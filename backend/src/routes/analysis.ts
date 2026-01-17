import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { seoAnalyzer } from '../services/seo-analyzer';
import { googlePlacesService, GooglePlacesService } from '../services/google-places';

const router = Router();

// In-memory storage for analysis jobs (replace with database in production)
const analysisJobs = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  progressMessage: string;
  result?: any;
  error?: string;
  createdAt: Date;
}>();

/**
 * POST /api/analysis/start
 * Start a new SEO analysis
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const {
      practiceName,
      address,
      websiteUrl,
      competitorMode,
      manualCompetitors,
    } = req.body;

    // Validation
    if (!practiceName || !address || !websiteUrl) {
      return res.status(400).json({
        error: 'Missing required fields: practiceName, address, websiteUrl',
      });
    }

    if (competitorMode !== 'auto' && competitorMode !== 'manual') {
      return res.status(400).json({
        error: 'competitorMode must be "auto" or "manual"',
      });
    }

    if (competitorMode === 'manual') {
      if (!manualCompetitors || !Array.isArray(manualCompetitors) || manualCompetitors.length === 0) {
        return res.status(400).json({
          error: 'manualCompetitors array is required for manual mode',
        });
      }
      if (manualCompetitors.length > 10) {
        return res.status(400).json({
          error: 'Maximum 10 competitors allowed',
        });
      }
    }

    // Create job
    const jobId = uuidv4();
    analysisJobs.set(jobId, {
      status: 'pending',
      progress: 0,
      progressMessage: 'Starting analysis...',
      createdAt: new Date(),
    });

    // Start analysis in background
    processAnalysis(jobId, {
      practiceName,
      address,
      websiteUrl,
      competitorMode,
      manualCompetitors,
    });

    return res.json({
      jobId,
      status: 'pending',
      message: 'Analysis started',
    });
  } catch (error: any) {
    console.error('Error starting analysis:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/analysis/:jobId/status
 * Get the status of an analysis job
 */
router.get('/:jobId/status', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = analysisJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  return res.json({
    jobId,
    status: job.status,
    progress: job.progress,
    progressMessage: job.progressMessage,
  });
});

/**
 * GET /api/analysis/:jobId/report
 * Get the completed analysis report
 */
router.get('/:jobId/report', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = analysisJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status === 'failed') {
    return res.status(500).json({
      error: job.error || 'Analysis failed',
    });
  }

  if (job.status !== 'completed') {
    return res.status(202).json({
      message: 'Analysis still in progress',
      status: job.status,
      progress: job.progress,
    });
  }

  return res.json(job.result);
});

/**
 * POST /api/analysis/discover-competitors
 * Discover competitors for an address (preview before full analysis)
 */
router.post('/discover-competitors', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const geo = await googlePlacesService.geocodeAddress(address);
    const competitors = await googlePlacesService.findDentalCompetitors(geo.lat, geo.lng);

    return res.json({
      location: geo,
      competitors: competitors.map((c) => ({
        name: c.name,
        address: c.address,
        website: c.website,
        domain: c.website ? GooglePlacesService.extractDomain(c.website) : null,
        rating: c.rating,
        reviewCount: c.reviewCount,
      })),
    });
  } catch (error: any) {
    console.error('Error discovering competitors:', error);
    return res.status(500).json({ error: error.message || 'Failed to discover competitors' });
  }
});

/**
 * POST /api/analysis/validate-urls
 * Validate competitor URLs
 */
router.post('/validate-urls', async (req: Request, res: Response) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'urls array is required' });
    }

    const validatedUrls = urls.map((url: string) => {
      try {
        const domain = GooglePlacesService.extractDomain(url);
        return {
          original: url,
          domain,
          valid: true,
        };
      } catch {
        return {
          original: url,
          domain: null,
          valid: false,
          error: 'Invalid URL format',
        };
      }
    });

    return res.json({ urls: validatedUrls });
  } catch (error: any) {
    console.error('Error validating URLs:', error);
    return res.status(500).json({ error: error.message || 'Failed to validate URLs' });
  }
});

/**
 * Background analysis processor
 */
async function processAnalysis(jobId: string, request: {
  practiceName: string;
  address: string;
  websiteUrl: string;
  competitorMode: 'auto' | 'manual';
  manualCompetitors?: string[];
}) {
  const job = analysisJobs.get(jobId);
  if (!job) return;

  job.status = 'processing';

  try {
    const result = await seoAnalyzer.analyze(request, (message, progress) => {
      job.progressMessage = message;
      job.progress = progress;
    });

    job.status = 'completed';
    job.progress = 100;
    job.progressMessage = 'Analysis complete!';
    job.result = serializeReport(result);
  } catch (error: any) {
    console.error('Analysis failed:', error);
    job.status = 'failed';
    job.error = error.message || 'Analysis failed';
  }
}

/**
 * Serialize report for JSON response (convert Maps to objects)
 */
function serializeReport(report: any): any {
  return {
    ...report,
    practiceData: {
      ...report.practiceData,
      rankings: Object.fromEntries(report.practiceData.rankings),
    },
    competitors: report.competitors.map((c: any) => ({
      ...c,
      rankings: Object.fromEntries(c.rankings),
    })),
  };
}

export default router;
