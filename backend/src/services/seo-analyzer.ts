import { DataForSEOService } from './dataforseo';
import { GooglePlacesService } from './google-places';

interface AnalysisRequest {
  practiceName: string;
  address: string;
  websiteUrl: string;
  competitorMode: 'auto' | 'manual';
  manualCompetitors?: string[]; // URLs for manual mode
  city?: string; // For keyword localization
}

interface CompetitorData {
  name: string;
  domain: string;
  website: string;
  backlinks: {
    rank: number;
    backlinks: number;
    referringDomains: number;
  };
  onPage: {
    score: number;
    title: string;
    loadTime: number;
  };
  rankings: Map<string, number | null>; // keyword -> position
}

interface AnalysisReport {
  id: string;
  practiceName: string;
  practiceWebsite: string;
  createdAt: Date;
  practiceData: CompetitorData;
  competitors: CompetitorData[];
  scores: {
    overall: number;
    keywords: number;
    backlinks: number;
    technical: number;
  };
  recommendations: Recommendation[];
  keywordData: KeywordComparison[];
}

interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'keywords' | 'backlinks' | 'technical' | 'content';
  title: string;
  description: string;
}

interface KeywordComparison {
  keyword: string;
  practiceRank: number | null;
  bestCompetitorRank: number | null;
  bestCompetitor: string | null;
  avgCompetitorRank: number | null;
}

// Dental-specific keywords to track
const DENTAL_KEYWORDS = [
  'dentist near me',
  'dentist {city}',
  'emergency dentist {city}',
  'dental implants {city}',
  'teeth whitening {city}',
  'family dentist {city}',
  'cosmetic dentist {city}',
  'pediatric dentist {city}',
  'dental cleaning {city}',
  'root canal {city}',
  'dental crowns {city}',
  'invisalign {city}',
  'dentures {city}',
  'dental veneers {city}',
  'tooth extraction {city}',
  'best dentist {city}',
  'affordable dentist {city}',
  'dental office {city}',
];

export class SEOAnalyzer {
  private dataForSEO: DataForSEOService;
  private googlePlaces: GooglePlacesService;

  constructor() {
    this.dataForSEO = new DataForSEOService();
    this.googlePlaces = new GooglePlacesService();
  }

  /**
   * Run full SEO analysis
   */
  async analyze(request: AnalysisRequest, progressCallback?: (step: string, percent: number) => void): Promise<AnalysisReport> {
    const report = (step: string, percent: number) => {
      if (progressCallback) progressCallback(step, percent);
      console.log(`[${percent}%] ${step}`);
    };

    const practiceDomaim = GooglePlacesService.extractDomain(request.websiteUrl);

    // Step 1: Get competitors
    report('Finding competitors...', 10);
    let competitorDomains: string[] = [];
    let competitorNames: Map<string, string> = new Map();

    if (request.competitorMode === 'manual' && request.manualCompetitors) {
      competitorDomains = request.manualCompetitors.map((url) =>
        GooglePlacesService.extractDomain(url)
      );
      competitorDomains.forEach((d) => competitorNames.set(d, d));
    } else {
      // Auto-discover competitors
      const geo = await this.googlePlaces.geocodeAddress(request.address);
      const competitors = await this.googlePlaces.findDentalCompetitors(geo.lat, geo.lng);

      competitorDomains = competitors
        .filter((c) => c.website)
        .map((c) => GooglePlacesService.extractDomain(c.website!));

      competitors.forEach((c) => {
        if (c.website) {
          competitorNames.set(GooglePlacesService.extractDomain(c.website), c.name);
        }
      });
    }

    // Extract city from address for keywords
    const city = request.city || this.extractCity(request.address);
    const keywords = DENTAL_KEYWORDS.map((k) => k.replace('{city}', city));

    // Step 2: Get backlinks data for all domains
    report('Analyzing domain authority...', 25);
    const allDomains = [practiceDomaim, ...competitorDomains];
    const backlinksData = await this.dataForSEO.getMultipleBacklinks(allDomains);

    // Step 3: Get on-page SEO for all domains
    report('Analyzing technical SEO...', 40);
    const allUrls = [request.websiteUrl, ...competitorDomains.map((d) => `https://${d}`)];
    const onPageData = await this.dataForSEO.getMultipleOnPageAnalysis(allUrls);

    // Step 4: Get keyword rankings
    report('Checking keyword rankings...', 60);
    const keywordResults = await this.dataForSEO.getMultipleKeywordRankings(keywords);

    // Step 5: Process rankings data
    report('Processing rankings...', 80);
    const practiceRankings = new Map<string, number | null>();
    const competitorRankingsMap = new Map<string, Map<string, number | null>>();

    // Initialize competitor ranking maps
    competitorDomains.forEach((domain) => {
      competitorRankingsMap.set(domain, new Map());
    });

    // Process keyword results
    for (const result of keywordResults) {
      let practiceRank: number | null = null;

      for (const ranking of result.rankings) {
        const domain = ranking.domain.replace(/^www\./, '');

        if (domain === practiceDomaim || domain === `www.${practiceDomaim}`) {
          practiceRank = ranking.position;
        }

        if (competitorRankingsMap.has(domain)) {
          competitorRankingsMap.get(domain)!.set(result.keyword, ranking.position);
        }
      }

      practiceRankings.set(result.keyword, practiceRank);
    }

    // Step 6: Build competitor data objects
    report('Generating report...', 90);
    const practiceBacklinks = backlinksData[0];
    const practiceOnPage = onPageData[0];

    const practiceData: CompetitorData = {
      name: request.practiceName,
      domain: practiceDomaim,
      website: request.websiteUrl,
      backlinks: {
        rank: practiceBacklinks.rank,
        backlinks: practiceBacklinks.backlinks,
        referringDomains: practiceBacklinks.referringDomains,
      },
      onPage: {
        score: practiceOnPage.onpageScore,
        title: practiceOnPage.title,
        loadTime: practiceOnPage.loadTime,
      },
      rankings: practiceRankings,
    };

    const competitorsData: CompetitorData[] = competitorDomains.map((domain, index) => {
      const bl = backlinksData[index + 1];
      const op = onPageData[index + 1];

      return {
        name: competitorNames.get(domain) || domain,
        domain,
        website: `https://${domain}`,
        backlinks: {
          rank: bl?.rank || 0,
          backlinks: bl?.backlinks || 0,
          referringDomains: bl?.referringDomains || 0,
        },
        onPage: {
          score: op?.onpageScore || 0,
          title: op?.title || '',
          loadTime: op?.loadTime || 0,
        },
        rankings: competitorRankingsMap.get(domain) || new Map(),
      };
    });

    // Step 7: Calculate scores and generate recommendations
    const scores = this.calculateScores(practiceData, competitorsData, keywords);
    const recommendations = this.generateRecommendations(practiceData, competitorsData, keywords);
    const keywordComparisons = this.buildKeywordComparisons(keywords, practiceData, competitorsData);

    report('Analysis complete!', 100);

    return {
      id: this.generateId(),
      practiceName: request.practiceName,
      practiceWebsite: request.websiteUrl,
      createdAt: new Date(),
      practiceData,
      competitors: competitorsData,
      scores,
      recommendations,
      keywordData: keywordComparisons,
    };
  }

  private extractCity(address: string): string {
    // Simple city extraction - take the part before the state abbreviation
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
    return parts[0].trim();
  }

  private calculateScores(
    practice: CompetitorData,
    competitors: CompetitorData[],
    keywords: string[]
  ): { overall: number; keywords: number; backlinks: number; technical: number } {
    // Keyword visibility score
    let keywordScore = 0;
    let maxKeywordScore = keywords.length * 100;

    for (const keyword of keywords) {
      const rank = practice.rankings.get(keyword);
      if (rank !== null && rank !== undefined) {
        if (rank <= 3) keywordScore += 100;
        else if (rank <= 10) keywordScore += 70;
        else if (rank <= 20) keywordScore += 40;
        else if (rank <= 50) keywordScore += 20;
        else keywordScore += 10;
      }
    }
    const keywordsNormalized = Math.round((keywordScore / maxKeywordScore) * 100);

    // Backlinks score (compared to competitors)
    const allRanks = [practice.backlinks.rank, ...competitors.map((c) => c.backlinks.rank)];
    const maxRank = Math.max(...allRanks);
    const backlinksNormalized = maxRank > 0 ? Math.round((practice.backlinks.rank / maxRank) * 100) : 0;

    // Technical score (on-page score)
    const technicalNormalized = Math.round(practice.onPage.score);

    // Overall weighted score
    const overall = Math.round(
      keywordsNormalized * 0.4 +
      backlinksNormalized * 0.3 +
      technicalNormalized * 0.3
    );

    return {
      overall,
      keywords: keywordsNormalized,
      backlinks: backlinksNormalized,
      technical: technicalNormalized,
    };
  }

  private generateRecommendations(
    practice: CompetitorData,
    competitors: CompetitorData[],
    keywords: string[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check domain authority
    const avgCompetitorRank = competitors.reduce((sum, c) => sum + c.backlinks.rank, 0) / competitors.length;
    if (practice.backlinks.rank < avgCompetitorRank * 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'backlinks',
        title: 'Build Domain Authority',
        description: `Your domain rank (${practice.backlinks.rank}) is below the competitor average (${Math.round(avgCompetitorRank)}). Focus on acquiring quality backlinks from dental directories, local business listings, and community organizations.`,
      });
    }

    // Check technical SEO
    if (practice.onPage.score < 70) {
      recommendations.push({
        priority: 'critical',
        category: 'technical',
        title: 'Improve Technical SEO',
        description: `Your on-page SEO score is ${Math.round(practice.onPage.score)}/100. Address technical issues like page speed, meta tags, and mobile optimization.`,
      });
    }

    // Check keyword rankings
    const rankedKeywords = Array.from(practice.rankings.entries()).filter(([_, rank]) => rank !== null);
    const top10Keywords = rankedKeywords.filter(([_, rank]) => rank !== null && rank <= 10);

    if (top10Keywords.length === 0) {
      recommendations.push({
        priority: 'critical',
        category: 'keywords',
        title: 'No Keywords in Top 10',
        description: 'You have no dental keywords ranking in the top 10 search results. Focus on optimizing your homepage and service pages for key terms like "dentist [your city]" and "family dentist [your city]".',
      });
    } else if (top10Keywords.length < 5) {
      recommendations.push({
        priority: 'high',
        category: 'keywords',
        title: 'Improve Keyword Rankings',
        description: `You have ${top10Keywords.length} keywords in the top 10. Target additional dental service keywords with dedicated landing pages.`,
      });
    }

    // Check page load time
    if (practice.onPage.loadTime > 3000) {
      recommendations.push({
        priority: 'high',
        category: 'technical',
        title: 'Improve Page Speed',
        description: `Your page loads in ${(practice.onPage.loadTime / 1000).toFixed(1)} seconds. Aim for under 3 seconds by optimizing images, enabling caching, and minimizing scripts.`,
      });
    }

    // Check referring domains
    const avgReferringDomains = competitors.reduce((sum, c) => sum + c.backlinks.referringDomains, 0) / competitors.length;
    if (practice.backlinks.referringDomains < avgReferringDomains * 0.5) {
      recommendations.push({
        priority: 'medium',
        category: 'backlinks',
        title: 'Increase Referring Domains',
        description: `You have ${practice.backlinks.referringDomains} referring domains vs competitor average of ${Math.round(avgReferringDomains)}. Pursue link building through local partnerships and dental industry directories.`,
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  private buildKeywordComparisons(
    keywords: string[],
    practice: CompetitorData,
    competitors: CompetitorData[]
  ): KeywordComparison[] {
    return keywords.map((keyword) => {
      const practiceRank = practice.rankings.get(keyword) || null;

      let bestCompetitorRank: number | null = null;
      let bestCompetitor: string | null = null;
      let totalRank = 0;
      let rankedCount = 0;

      for (const competitor of competitors) {
        const rank = competitor.rankings.get(keyword);
        if (rank !== null && rank !== undefined) {
          totalRank += rank;
          rankedCount++;
          if (bestCompetitorRank === null || rank < bestCompetitorRank) {
            bestCompetitorRank = rank;
            bestCompetitor = competitor.name;
          }
        }
      }

      return {
        keyword,
        practiceRank,
        bestCompetitorRank,
        bestCompetitor,
        avgCompetitorRank: rankedCount > 0 ? Math.round(totalRank / rankedCount) : null,
      };
    });
  }

  private generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const seoAnalyzer = new SEOAnalyzer();
