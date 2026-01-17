import axios, { AxiosInstance } from 'axios';

interface SerpResult {
  keyword: string;
  rankings: RankingItem[];
}

interface RankingItem {
  position: number;
  domain: string;
  url: string;
  title: string;
}

interface BacklinksResult {
  domain: string;
  rank: number;
  backlinks: number;
  referringDomains: number;
  referringIps: number;
}

interface OnPageResult {
  url: string;
  statusCode: number;
  onpageScore: number;
  title: string;
  description: string;
  checks: Record<string, boolean>;
  loadTime: number;
  contentSize: number;
}

export class DataForSEOService {
  private client: AxiosInstance;

  constructor() {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    if (!login || !password) {
      throw new Error('DataForSEO credentials not configured');
    }

    this.client = axios.create({
      baseURL: 'https://api.dataforseo.com/v3',
      auth: {
        username: login,
        password: password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get keyword rankings from Google SERP
   * @param keyword - Search keyword
   * @param locationCode - Google location code (2840 = United States)
   * @param depth - Number of results to fetch (default 20)
   */
  async getKeywordRankings(
    keyword: string,
    locationCode: number = 2840,
    depth: number = 20
  ): Promise<SerpResult> {
    const response = await this.client.post('/serp/google/organic/live/advanced', [
      {
        keyword,
        location_code: locationCode,
        language_code: 'en',
        depth,
      },
    ]);

    const task = response.data.tasks?.[0];
    if (task?.status_code !== 20000) {
      throw new Error(`SERP API error: ${task?.status_message || 'Unknown error'}`);
    }

    const items = task.result?.[0]?.items || [];
    const rankings: RankingItem[] = items
      .filter((item: any) => item.type === 'organic')
      .map((item: any) => ({
        position: item.rank_absolute,
        domain: item.domain,
        url: item.url,
        title: item.title,
      }));

    return { keyword, rankings };
  }

  /**
   * Get keyword rankings for multiple keywords in parallel
   */
  async getMultipleKeywordRankings(
    keywords: string[],
    locationCode: number = 2840
  ): Promise<SerpResult[]> {
    const tasks = keywords.map((keyword) => ({
      keyword,
      location_code: locationCode,
      language_code: 'en',
      depth: 20,
    }));

    const response = await this.client.post('/serp/google/organic/live/advanced', tasks);

    return response.data.tasks.map((task: any, index: number) => {
      if (task.status_code !== 20000) {
        console.error(`SERP error for "${keywords[index]}": ${task.status_message}`);
        return { keyword: keywords[index], rankings: [] };
      }

      const items = task.result?.[0]?.items || [];
      const rankings: RankingItem[] = items
        .filter((item: any) => item.type === 'organic')
        .map((item: any) => ({
          position: item.rank_absolute,
          domain: item.domain,
          url: item.url,
          title: item.title,
        }));

      return { keyword: keywords[index], rankings };
    });
  }

  /**
   * Get backlinks summary for a domain
   */
  async getBacklinksSummary(domain: string): Promise<BacklinksResult> {
    const response = await this.client.post('/backlinks/summary/live', [
      { target: domain },
    ]);

    const task = response.data.tasks?.[0];
    if (task?.status_code !== 20000) {
      throw new Error(`Backlinks API error: ${task?.status_message || 'Unknown error'}`);
    }

    const result = task.result?.[0];
    if (!result) {
      return {
        domain,
        rank: 0,
        backlinks: 0,
        referringDomains: 0,
        referringIps: 0,
      };
    }

    return {
      domain: result.target,
      rank: result.rank || 0,
      backlinks: result.backlinks || 0,
      referringDomains: result.referring_domains || 0,
      referringIps: result.referring_ips || 0,
    };
  }

  /**
   * Get backlinks for multiple domains in parallel
   */
  async getMultipleBacklinks(domains: string[]): Promise<BacklinksResult[]> {
    const tasks = domains.map((domain) => ({ target: domain }));
    const response = await this.client.post('/backlinks/summary/live', tasks);

    return response.data.tasks.map((task: any, index: number) => {
      if (task.status_code !== 20000) {
        console.error(`Backlinks error for "${domains[index]}": ${task.status_message}`);
        return {
          domain: domains[index],
          rank: 0,
          backlinks: 0,
          referringDomains: 0,
          referringIps: 0,
        };
      }

      const result = task.result?.[0];
      return {
        domain: result?.target || domains[index],
        rank: result?.rank || 0,
        backlinks: result?.backlinks || 0,
        referringDomains: result?.referring_domains || 0,
        referringIps: result?.referring_ips || 0,
      };
    });
  }

  /**
   * Get on-page SEO analysis for a URL
   */
  async getOnPageAnalysis(url: string): Promise<OnPageResult> {
    const response = await this.client.post('/on_page/instant_pages', [
      {
        url,
        enable_javascript: true,
      },
    ]);

    const task = response.data.tasks?.[0];
    if (task?.status_code !== 20000) {
      throw new Error(`OnPage API error: ${task?.status_message || 'Unknown error'}`);
    }

    const item = task.result?.[0]?.items?.[0];
    if (!item) {
      throw new Error('No OnPage data returned');
    }

    return {
      url: item.url,
      statusCode: item.status_code,
      onpageScore: item.onpage_score || 0,
      title: item.meta?.title || '',
      description: item.meta?.description || '',
      checks: item.checks || {},
      loadTime: item.page_timing?.time_to_interactive || 0,
      contentSize: item.size || 0,
    };
  }

  /**
   * Get on-page analysis for multiple URLs in parallel
   */
  async getMultipleOnPageAnalysis(urls: string[]): Promise<OnPageResult[]> {
    const tasks = urls.map((url) => ({
      url,
      enable_javascript: true,
    }));

    const response = await this.client.post('/on_page/instant_pages', tasks);

    return response.data.tasks.map((task: any, index: number) => {
      if (task.status_code !== 20000) {
        console.error(`OnPage error for "${urls[index]}": ${task.status_message}`);
        return {
          url: urls[index],
          statusCode: 0,
          onpageScore: 0,
          title: '',
          description: '',
          checks: {},
          loadTime: 0,
          contentSize: 0,
        };
      }

      const item = task.result?.[0]?.items?.[0];
      return {
        url: item?.url || urls[index],
        statusCode: item?.status_code || 0,
        onpageScore: item?.onpage_score || 0,
        title: item?.meta?.title || '',
        description: item?.meta?.description || '',
        checks: item?.checks || {},
        loadTime: item?.page_timing?.time_to_interactive || 0,
        contentSize: item?.size || 0,
      };
    });
  }
}

export const dataForSEOService = new DataForSEOService();
