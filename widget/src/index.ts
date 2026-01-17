import { Chart, registerables } from 'chart.js';
import styles from './styles/widget.css?inline';

Chart.register(...registerables);

interface WidgetConfig {
  apiUrl: string;
  containerId?: string;
}

interface AnalysisReport {
  id: string;
  practiceName: string;
  practiceWebsite: string;
  scores: {
    overall: number;
    keywords: number;
    backlinks: number;
    technical: number;
  };
  practiceData: any;
  competitors: any[];
  recommendations: any[];
  keywordData: any[];
}

class DentistEnvyWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private config: WidgetConfig;
  private state: 'form' | 'loading' | 'report' = 'form';
  private competitorMode: 'auto' | 'manual' = 'auto';
  private manualCompetitors: string[] = [''];
  private report: AnalysisReport | null = null;
  private progress: { percent: number; message: string } = { percent: 0, message: '' };

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.config = {
      apiUrl: this.getAttribute('api-url') || 'http://localhost:3001',
    };
  }

  connectedCallback() {
    this.render();
  }

  private render() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;

    const container = document.createElement('div');
    container.className = 'de-container';

    if (this.state === 'form') {
      container.innerHTML = this.renderForm();
    } else if (this.state === 'loading') {
      container.innerHTML = this.renderLoading();
    } else if (this.state === 'report') {
      container.innerHTML = this.renderReport();
    }

    this.shadow.innerHTML = '';
    this.shadow.appendChild(styleSheet);
    this.shadow.appendChild(container);

    this.attachEventListeners();

    if (this.state === 'report' && this.report) {
      this.renderCharts();
    }
  }

  private renderForm(): string {
    return `
      <div class="de-header">
        <h1 class="de-title">Compare Your SEO</h1>
        <p class="de-subtitle">See how your dental practice website ranks against local competitors</p>
      </div>

      <form class="de-form" id="seo-form">
        <div class="de-form-group">
          <label class="de-label">Practice Name</label>
          <input type="text" class="de-input" id="practice-name" placeholder="Smile Dental Care" required>
        </div>

        <div class="de-form-group">
          <label class="de-label">Practice Address</label>
          <input type="text" class="de-input" id="practice-address" placeholder="123 Main St, Austin, TX 78701" required>
        </div>

        <div class="de-form-group">
          <label class="de-label">Your Website URL</label>
          <input type="url" class="de-input" id="practice-website" placeholder="https://www.yourdentalpractice.com" required>
        </div>

        <div class="de-form-group">
          <label class="de-label">How would you like to select competitors?</label>
          <div class="de-mode-selector">
            <label class="de-mode-option ${this.competitorMode === 'auto' ? 'selected' : ''}" data-mode="auto">
              <input type="radio" name="mode" value="auto" ${this.competitorMode === 'auto' ? 'checked' : ''}>
              <div class="de-mode-title">Auto-Discover</div>
              <div class="de-mode-desc">Find the 10 highest-ranking dental offices near me</div>
            </label>
            <label class="de-mode-option ${this.competitorMode === 'manual' ? 'selected' : ''}" data-mode="manual">
              <input type="radio" name="mode" value="manual" ${this.competitorMode === 'manual' ? 'checked' : ''}>
              <div class="de-mode-title">Manual Entry</div>
              <div class="de-mode-desc">I'll enter competitor websites myself</div>
            </label>
          </div>
        </div>

        ${this.competitorMode === 'manual' ? this.renderManualEntry() : ''}

        <button type="submit" class="de-btn de-btn-primary">
          Analyze My SEO
        </button>
      </form>
    `;
  }

  private renderManualEntry(): string {
    return `
      <div class="de-form-group">
        <label class="de-label">Competitor Websites (up to 10)</label>
        <div class="de-competitor-list" id="competitor-list">
          ${this.manualCompetitors.map((url, index) => `
            <div class="de-competitor-item">
              <input type="url" class="de-input competitor-url" placeholder="https://competitor${index + 1}.com" value="${url}">
              ${this.manualCompetitors.length > 1 ? `<button type="button" class="de-remove-btn" data-index="${index}">Remove</button>` : ''}
            </div>
          `).join('')}
        </div>
        ${this.manualCompetitors.length < 10 ? `
          <button type="button" class="de-add-btn" id="add-competitor">+ Add Another Competitor</button>
        ` : ''}
      </div>
    `;
  }

  private renderLoading(): string {
    return `
      <div class="de-progress">
        <div class="de-progress-spinner"></div>
        <div class="de-progress-text">${this.progress.message || 'Starting analysis...'}</div>
        <div class="de-progress-bar">
          <div class="de-progress-fill" style="width: ${this.progress.percent}%"></div>
        </div>
      </div>
    `;
  }

  private renderReport(): string {
    if (!this.report) return '';

    const { scores, recommendations, keywordData, practiceData, competitors } = this.report;

    return `
      <div class="de-report">
        <div class="de-header">
          <h1 class="de-title">SEO Analysis Report</h1>
          <p class="de-subtitle">${this.report.practiceName}</p>
        </div>

        <div class="de-score-cards">
          <div class="de-score-card">
            <div class="de-score-value ${this.getScoreClass(scores.overall)}">${scores.overall}</div>
            <div class="de-score-label">Overall Score</div>
          </div>
          <div class="de-score-card">
            <div class="de-score-value ${this.getScoreClass(scores.keywords)}">${scores.keywords}</div>
            <div class="de-score-label">Keywords</div>
          </div>
          <div class="de-score-card">
            <div class="de-score-value ${this.getScoreClass(scores.backlinks)}">${scores.backlinks}</div>
            <div class="de-score-label">Backlinks</div>
          </div>
          <div class="de-score-card">
            <div class="de-score-value ${this.getScoreClass(scores.technical)}">${scores.technical}</div>
            <div class="de-score-label">Technical</div>
          </div>
        </div>

        <div class="de-section">
          <h2 class="de-section-title">Domain Authority Comparison</h2>
          <div class="de-chart-container">
            <canvas id="backlinks-chart"></canvas>
          </div>
        </div>

        <div class="de-section">
          <h2 class="de-section-title">Keyword Rankings</h2>
          <table class="de-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Your Rank</th>
                <th>Best Competitor</th>
              </tr>
            </thead>
            <tbody>
              ${keywordData.slice(0, 10).map((kw: any) => `
                <tr>
                  <td>${kw.keyword}</td>
                  <td>${this.renderRank(kw.practiceRank)}</td>
                  <td>${kw.bestCompetitor ? `${kw.bestCompetitor} (${this.renderRank(kw.bestCompetitorRank)})` : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="de-section">
          <h2 class="de-section-title">Recommendations</h2>
          <div class="de-recommendations">
            ${recommendations.map((rec: any) => `
              <div class="de-recommendation ${rec.priority}">
                <div class="de-recommendation-header">
                  <span class="de-recommendation-priority">${rec.priority}</span>
                  <span class="de-recommendation-title">${rec.title}</span>
                </div>
                <p class="de-recommendation-desc">${rec.description}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <button class="de-btn de-btn-secondary" id="start-over">Start New Analysis</button>
      </div>
    `;
  }

  private getScoreClass(score: number): string {
    if (score >= 70) return 'good';
    if (score >= 40) return 'medium';
    return 'poor';
  }

  private renderRank(rank: number | null): string {
    if (rank === null || rank === undefined) {
      return '<span class="de-rank unranked">Not Ranked</span>';
    }
    if (rank <= 3) {
      return `<span class="de-rank top3">#${rank}</span>`;
    }
    if (rank <= 10) {
      return `<span class="de-rank top10">#${rank}</span>`;
    }
    return `<span class="de-rank top20">#${rank}</span>`;
  }

  private attachEventListeners() {
    // Form submission
    const form = this.shadow.getElementById('seo-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Mode selection
    const modeOptions = this.shadow.querySelectorAll('.de-mode-option');
    modeOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const mode = option.getAttribute('data-mode') as 'auto' | 'manual';
        this.competitorMode = mode;
        this.render();
      });
    });

    // Add competitor button
    const addBtn = this.shadow.getElementById('add-competitor');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (this.manualCompetitors.length < 10) {
          this.manualCompetitors.push('');
          this.render();
        }
      });
    }

    // Remove competitor buttons
    const removeBtns = this.shadow.querySelectorAll('.de-remove-btn');
    removeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index') || '0');
        this.manualCompetitors.splice(index, 1);
        this.render();
      });
    });

    // Start over button
    const startOverBtn = this.shadow.getElementById('start-over');
    if (startOverBtn) {
      startOverBtn.addEventListener('click', () => {
        this.state = 'form';
        this.report = null;
        this.render();
      });
    }
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();

    const practiceName = (this.shadow.getElementById('practice-name') as HTMLInputElement).value;
    const address = (this.shadow.getElementById('practice-address') as HTMLInputElement).value;
    const websiteUrl = (this.shadow.getElementById('practice-website') as HTMLInputElement).value;

    // Get manual competitors if in manual mode
    let manualCompetitors: string[] | undefined;
    if (this.competitorMode === 'manual') {
      const inputs = this.shadow.querySelectorAll('.competitor-url') as NodeListOf<HTMLInputElement>;
      manualCompetitors = Array.from(inputs)
        .map((input) => input.value.trim())
        .filter((url) => url.length > 0);

      if (manualCompetitors.length === 0) {
        alert('Please enter at least one competitor URL');
        return;
      }
    }

    this.state = 'loading';
    this.progress = { percent: 0, message: 'Starting analysis...' };
    this.render();

    try {
      // Start analysis
      const startResponse = await fetch(`${this.config.apiUrl}/api/analysis/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceName,
          address,
          websiteUrl,
          competitorMode: this.competitorMode,
          manualCompetitors,
        }),
      });

      const { jobId } = await startResponse.json();

      // Poll for completion
      await this.pollForCompletion(jobId);
    } catch (error: any) {
      console.error('Analysis error:', error);
      alert('Analysis failed: ' + (error.message || 'Unknown error'));
      this.state = 'form';
      this.render();
    }
  }

  private async pollForCompletion(jobId: string) {
    const pollInterval = 2000; // 2 seconds
    const maxAttempts = 120; // 4 minutes max

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const statusResponse = await fetch(`${this.config.apiUrl}/api/analysis/${jobId}/status`);
        const status = await statusResponse.json();

        this.progress = {
          percent: status.progress || 0,
          message: status.progressMessage || 'Processing...',
        };
        this.render();

        if (status.status === 'completed') {
          // Fetch full report
          const reportResponse = await fetch(`${this.config.apiUrl}/api/analysis/${jobId}/report`);
          this.report = await reportResponse.json();
          this.state = 'report';
          this.render();
          return;
        }

        if (status.status === 'failed') {
          throw new Error('Analysis failed');
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        throw error;
      }
    }

    throw new Error('Analysis timed out');
  }

  private renderCharts() {
    if (!this.report) return;

    const canvas = this.shadow.getElementById('backlinks-chart') as HTMLCanvasElement;
    if (!canvas) return;

    const { practiceData, competitors } = this.report;

    const labels = [practiceData.name, ...competitors.map((c: any) => c.name.substring(0, 15))];
    const data = [practiceData.backlinks.rank, ...competitors.map((c: any) => c.backlinks.rank)];
    const colors = ['#3b82f6', ...competitors.map(() => '#94a3b8')];

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Domain Rank',
          data,
          backgroundColor: colors,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Domain Rank',
            },
          },
        },
      },
    });
  }
}

// Register the custom element
customElements.define('dentist-envy', DentistEnvyWidget);

// Export for UMD
export { DentistEnvyWidget };
