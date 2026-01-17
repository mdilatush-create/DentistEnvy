(function() {
    'use strict';

    // Configuration - Update this to your production API URL
    const API_URL = window.DENTISTENVY_API_URL || 'http://localhost:5001';

    // Widget styles (scoped with prefix to avoid WordPress conflicts)
    const styles = `
        .de-widget * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        .de-widget {
            max-width: 900px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
        }

        .de-header {
            text-align: center;
            margin-bottom: 32px;
        }

        .de-logo {
            font-size: 28px;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
        }

        .de-subtitle {
            color: #6b7280;
            font-size: 16px;
        }

        .de-form-group {
            margin-bottom: 20px;
        }

        .de-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }

        .de-input {
            width: 100%;
            padding: 14px 16px;
            font-size: 16px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            outline: none;
            transition: all 0.2s;
            background: #fff;
        }

        .de-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .de-input::placeholder {
            color: #9ca3af;
        }

        .de-mode-selector {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 8px;
        }

        .de-mode-option {
            padding: 20px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            background: #fff;
        }

        .de-mode-option:hover {
            border-color: #667eea;
            background: #f9fafb;
        }

        .de-mode-option.de-selected {
            border-color: #667eea;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }

        .de-mode-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }

        .de-mode-desc {
            font-size: 13px;
            color: #6b7280;
        }

        .de-competitor-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 12px;
        }

        .de-competitor-item {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .de-competitor-item .de-input {
            flex: 1;
        }

        .de-remove-btn {
            padding: 12px 16px;
            background: #fee2e2;
            color: #dc2626;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }

        .de-add-btn {
            padding: 14px;
            background: #f9fafb;
            color: #374151;
            border: 2px dashed #d1d5db;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            width: 100%;
            margin-top: 12px;
        }

        .de-add-btn:hover {
            background: #f3f4f6;
            border-color: #9ca3af;
        }

        .de-btn {
            width: 100%;
            padding: 16px 24px;
            font-size: 18px;
            font-weight: 600;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 24px;
        }

        .de-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
        }

        .de-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .de-btn-primary:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .de-btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }

        .de-progress {
            text-align: center;
            padding: 60px 20px;
        }

        .de-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid #e5e7eb;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: de-spin 1s linear infinite;
            margin: 0 auto 24px;
        }

        @keyframes de-spin {
            to { transform: rotate(360deg); }
        }

        .de-progress-text {
            font-size: 18px;
            color: #374151;
            margin-bottom: 16px;
        }

        .de-progress-bar {
            width: 100%;
            max-width: 400px;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin: 0 auto;
        }

        .de-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
        }

        .de-score-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 32px;
        }

        .de-score-card {
            padding: 24px;
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border-radius: 12px;
            text-align: center;
        }

        .de-score-value {
            font-size: 42px;
            font-weight: 700;
        }

        .de-score-value.de-good { color: #10b981; }
        .de-score-value.de-medium { color: #f59e0b; }
        .de-score-value.de-poor { color: #ef4444; }

        .de-score-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-top: 8px;
        }

        .de-section {
            background: #f9fafb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
        }

        .de-section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }

        .de-chart-container {
            position: relative;
            height: 300px;
        }

        .de-table {
            width: 100%;
            border-collapse: collapse;
        }

        .de-table th,
        .de-table td {
            padding: 14px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }

        .de-table th {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .de-table td {
            font-size: 14px;
            color: #374151;
        }

        .de-rank {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
        }

        .de-rank.de-top3 { background: #d1fae5; color: #065f46; }
        .de-rank.de-top10 { background: #fef3c7; color: #92400e; }
        .de-rank.de-top20 { background: #fee2e2; color: #991b1b; }
        .de-rank.de-unranked { background: #f3f4f6; color: #6b7280; }

        .de-recommendations {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .de-recommendation {
            padding: 20px;
            background: #fff;
            border-radius: 10px;
            border-left: 4px solid;
        }

        .de-recommendation.de-critical { border-left-color: #ef4444; }
        .de-recommendation.de-high { border-left-color: #f59e0b; }
        .de-recommendation.de-medium { border-left-color: #3b82f6; }
        .de-recommendation.de-low { border-left-color: #10b981; }

        .de-recommendation-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .de-recommendation-priority {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 4px 8px;
            border-radius: 4px;
        }

        .de-recommendation.de-critical .de-recommendation-priority { background: #fee2e2; color: #991b1b; }
        .de-recommendation.de-high .de-recommendation-priority { background: #fef3c7; color: #92400e; }
        .de-recommendation.de-medium .de-recommendation-priority { background: #dbeafe; color: #1e40af; }
        .de-recommendation.de-low .de-recommendation-priority { background: #d1fae5; color: #065f46; }

        .de-recommendation-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
        }

        .de-recommendation-desc {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.6;
        }

        .de-hidden {
            display: none !important;
        }

        @media (max-width: 768px) {
            .de-widget {
                padding: 24px;
                margin: 20px;
            }

            .de-mode-selector {
                grid-template-columns: 1fr;
            }

            .de-score-cards {
                grid-template-columns: repeat(2, 1fr);
            }

            .de-table th,
            .de-table td {
                padding: 10px 8px;
                font-size: 12px;
            }
        }
    `;

    // Inject styles
    function injectStyles() {
        const styleElement = document.createElement('style');
        styleElement.id = 'dentistenvy-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // Load Chart.js if not already loaded
    function loadChartJS(callback) {
        if (window.Chart) {
            callback();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    // Widget Class
    class DentistEnvyWidget {
        constructor(container) {
            this.container = container;
            this.competitorMode = 'auto';
            this.competitorCount = 1;
            this.backlinksChart = null;
            this.init();
        }

        init() {
            this.render();
            this.attachEventListeners();
        }

        render() {
            this.container.innerHTML = `
                <div class="de-widget">
                    <div class="de-header">
                        <h2 class="de-logo">DentistEnvy</h2>
                        <p class="de-subtitle">Compare your dental practice's SEO against local competitors</p>
                    </div>

                    <!-- Form Section -->
                    <div id="de-form-section">
                        <form id="de-seo-form">
                            <div class="de-form-group">
                                <label class="de-label">Practice Name</label>
                                <input type="text" class="de-input" id="de-practice-name" placeholder="Smile Dental Care" required>
                            </div>

                            <div class="de-form-group">
                                <label class="de-label">Practice Address</label>
                                <input type="text" class="de-input" id="de-practice-address" placeholder="123 Main St, Austin, TX 78701" required>
                            </div>

                            <div class="de-form-group">
                                <label class="de-label">Your Website URL</label>
                                <div style="display: flex; align-items: center; gap: 0;">
                                    <span style="padding: 14px 12px; background: #f3f4f6; border: 2px solid #e5e7eb; border-right: none; border-radius: 10px 0 0 10px; color: #6b7280; font-size: 16px;">https://www.</span>
                                    <input type="text" class="de-input" id="de-practice-website" placeholder="yourdentalpractice.com" required style="border-radius: 0 10px 10px 0; flex: 1;">
                                </div>
                            </div>

                            <div class="de-form-group">
                                <label class="de-label">Type of Practice</label>
                                <select class="de-input" id="de-practice-type" required>
                                    <option value="general">General Dentistry</option>
                                    <option value="pediatric">Pediatric Dentistry</option>
                                    <option value="oral_surgery">Oral Surgery</option>
                                    <option value="periodontist">Periodontist</option>
                                    <option value="orthodontist">Orthodontist</option>
                                    <option value="prosthodontist">Prosthodontist</option>
                                </select>
                            </div>

                            <div class="de-form-group">
                                <label class="de-label">How would you like to select competitors?</label>
                                <div class="de-mode-selector">
                                    <div class="de-mode-option de-selected" data-mode="auto">
                                        <div class="de-mode-title">Auto-Discover</div>
                                        <div class="de-mode-desc">Find the top 5 dental offices within 7 miles</div>
                                    </div>
                                    <div class="de-mode-option" data-mode="manual">
                                        <div class="de-mode-title">Manual Entry</div>
                                        <div class="de-mode-desc">I'll enter competitor websites myself</div>
                                    </div>
                                </div>
                            </div>

                            <div id="de-manual-entry" class="de-form-group de-hidden">
                                <label class="de-label">Competitor Websites (up to 10)</label>
                                <div class="de-competitor-list" id="de-competitor-list">
                                    <div class="de-competitor-item">
                                        <span style="padding: 14px 12px; background: #f3f4f6; border: 2px solid #e5e7eb; border-right: none; border-radius: 10px 0 0 10px; color: #6b7280; font-size: 16px;">https://</span>
                                        <input type="text" class="de-input de-competitor-url" placeholder="competitor1.com" style="border-radius: 0 10px 10px 0; flex: 1;">
                                    </div>
                                </div>
                                <button type="button" class="de-add-btn" id="de-add-competitor">+ Add Another Competitor</button>
                            </div>

                            <button type="submit" class="de-btn de-btn-primary">
                                Analyze My SEO
                            </button>
                        </form>
                    </div>

                    <!-- Progress Section -->
                    <div id="de-progress-section" class="de-hidden">
                        <div class="de-progress">
                            <div class="de-spinner"></div>
                            <div class="de-progress-text" id="de-progress-text">Starting analysis...</div>
                            <div class="de-progress-bar">
                                <div class="de-progress-fill" id="de-progress-fill" style="width: 0%"></div>
                            </div>
                            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">This process could take up to 7 minutes.<br>We're analyzing your website and comparing it against your competitors.</p>
                        </div>
                    </div>

                    <!-- Report Section -->
                    <div id="de-report-section" class="de-hidden">
                        <div class="de-header">
                            <h2 class="de-logo">SEO Analysis Report</h2>
                            <p class="de-subtitle" id="de-report-practice-name"></p>
                        </div>

                        <div class="de-score-cards" id="de-score-cards"></div>

                        <div class="de-section">
                            <h3 class="de-section-title">Domain Authority Comparison</h3>
                            <div class="de-chart-container">
                                <canvas id="de-backlinks-chart"></canvas>
                            </div>
                            <table class="de-table" style="margin-top: 20px;">
                                <thead>
                                    <tr>
                                        <th>Practice</th>
                                        <th>Domain Rank</th>
                                        <th>Backlinks</th>
                                        <th>Referring Domains</th>
                                    </tr>
                                </thead>
                                <tbody id="de-competitors-table"></tbody>
                            </table>
                        </div>

                        <div class="de-section">
                            <h3 class="de-section-title">Google Reviews Comparison</h3>
                            <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">Reviews are a key local SEO ranking factor - see how you compare</p>
                            <table class="de-table">
                                <thead>
                                    <tr>
                                        <th>Practice</th>
                                        <th>Rating</th>
                                        <th>Review Count</th>
                                    </tr>
                                </thead>
                                <tbody id="de-reviews-table"></tbody>
                            </table>
                        </div>

                        <div class="de-section">
                            <h3 class="de-section-title">Keyword Rankings</h3>
                            <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">How you rank for the 20 most popular dental search terms</p>
                            <div id="de-keyword-summary" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;"></div>
                        </div>

                        <div class="de-section">
                            <h3 class="de-section-title">Directory Listings</h3>
                            <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">Your presence on key dental and business directories</p>
                            <div id="de-directory-listings" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;"></div>
                        </div>

                        <div class="de-section">
                            <h3 class="de-section-title">Recommendations</h3>
                            <div class="de-recommendations" id="de-recommendations"></div>
                        </div>

                        <button class="de-btn de-btn-secondary" id="de-start-over">Start New Analysis</button>
                    </div>
                </div>
            `;
        }

        attachEventListeners() {
            // Mode selection
            this.container.querySelectorAll('.de-mode-option').forEach(option => {
                option.addEventListener('click', () => {
                    this.container.querySelectorAll('.de-mode-option').forEach(o => o.classList.remove('de-selected'));
                    option.classList.add('de-selected');
                    this.competitorMode = option.dataset.mode;

                    const manualEntry = this.container.querySelector('#de-manual-entry');
                    if (this.competitorMode === 'manual') {
                        manualEntry.classList.remove('de-hidden');
                    } else {
                        manualEntry.classList.add('de-hidden');
                    }
                });
            });

            // Add competitor
            this.container.querySelector('#de-add-competitor').addEventListener('click', () => {
                if (this.competitorCount < 10) {
                    this.competitorCount++;
                    const list = this.container.querySelector('#de-competitor-list');
                    const item = document.createElement('div');
                    item.className = 'de-competitor-item';
                    item.innerHTML = `
                        <span style="padding: 14px 12px; background: #f3f4f6; border: 2px solid #e5e7eb; border-right: none; border-radius: 10px 0 0 10px; color: #6b7280; font-size: 16px;">https://</span>
                        <input type="text" class="de-input de-competitor-url" placeholder="competitor${this.competitorCount}.com" style="border-radius: 0 10px 10px 0; flex: 1;">
                        <button type="button" class="de-remove-btn">Remove</button>
                    `;
                    item.querySelector('.de-remove-btn').addEventListener('click', () => {
                        item.remove();
                        this.competitorCount--;
                    });
                    list.appendChild(item);
                }
            });

            // Form submission
            this.container.querySelector('#de-seo-form').addEventListener('submit', (e) => this.handleSubmit(e));

            // Start over
            this.container.querySelector('#de-start-over').addEventListener('click', () => this.resetForm());
        }

        async handleSubmit(e) {
            e.preventDefault();

            const practiceName = this.container.querySelector('#de-practice-name').value;
            const address = this.container.querySelector('#de-practice-address').value;
            const websiteInput = this.container.querySelector('#de-practice-website').value.trim();
            const websiteUrl = 'https://www.' + websiteInput.replace(/^(https?:\/\/)?(www\.)?/, '');
            const practiceType = this.container.querySelector('#de-practice-type').value;

            let manualCompetitors = [];
            if (this.competitorMode === 'manual') {
                const inputs = this.container.querySelectorAll('.de-competitor-url');
                manualCompetitors = Array.from(inputs)
                    .map(input => {
                        let url = input.value.trim();
                        if (url && !url.startsWith('http')) {
                            url = 'https://' + url;
                        }
                        return url;
                    })
                    .filter(url => url.length > 0);

                if (manualCompetitors.length === 0) {
                    alert('Please enter at least one competitor URL');
                    return;
                }
            }

            // Show progress
            this.container.querySelector('#de-form-section').classList.add('de-hidden');
            this.container.querySelector('#de-progress-section').classList.remove('de-hidden');
            this.container.querySelector('#de-report-section').classList.add('de-hidden');

            try {
                const startResponse = await fetch(`${API_URL}/api/analysis/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        practiceName,
                        address,
                        websiteUrl,
                        practiceType,
                        competitorMode: this.competitorMode,
                        manualCompetitors
                    })
                });

                const { jobId } = await startResponse.json();
                await this.pollForCompletion(jobId);

            } catch (error) {
                console.error('Analysis error:', error);
                alert('Analysis failed: ' + (error.message || 'Unknown error'));
                this.container.querySelector('#de-form-section').classList.remove('de-hidden');
                this.container.querySelector('#de-progress-section').classList.add('de-hidden');
            }
        }

        async pollForCompletion(jobId) {
            const pollInterval = 2000;
            const maxAttempts = 120;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const statusResponse = await fetch(`${API_URL}/api/analysis/${jobId}/status`);
                const status = await statusResponse.json();

                this.container.querySelector('#de-progress-text').textContent = status.progressMessage || 'Processing...';
                this.container.querySelector('#de-progress-fill').style.width = `${status.progress || 0}%`;

                if (status.status === 'completed') {
                    const reportResponse = await fetch(`${API_URL}/api/analysis/${jobId}/report`);
                    const report = await reportResponse.json();
                    this.displayReport(report);
                    return;
                }

                if (status.status === 'failed') {
                    throw new Error('Analysis failed');
                }

                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }

            throw new Error('Analysis timed out');
        }

        displayReport(report) {
            this.container.querySelector('#de-progress-section').classList.add('de-hidden');
            this.container.querySelector('#de-report-section').classList.remove('de-hidden');

            this.container.querySelector('#de-report-practice-name').textContent = report.practiceName;

            // Score cards
            const scores = report.scores;
            this.container.querySelector('#de-score-cards').innerHTML = `
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
            `;

            // Chart
            this.renderChart(report);

            // Competitors table with clickable links
            this.container.querySelector('#de-competitors-table').innerHTML = `
                <tr style="background: #eff6ff;">
                    <td><strong>${report.practiceData.name}</strong> (You)</td>
                    <td><strong>${report.practiceData.backlinks.rank}</strong></td>
                    <td>${report.practiceData.backlinks.backlinks.toLocaleString()}</td>
                    <td>${report.practiceData.backlinks.referring_domains.toLocaleString()}</td>
                </tr>
                ${report.competitors.map(c => `
                    <tr>
                        <td><a href="${c.website}" target="_blank" rel="noopener" style="color: #667eea; text-decoration: none; font-weight: 500;">${c.name}</a></td>
                        <td>${c.backlinks.rank}</td>
                        <td>${c.backlinks.backlinks.toLocaleString()}</td>
                        <td>${c.backlinks.referring_domains.toLocaleString()}</td>
                    </tr>
                `).join('')}
            `;

            // Reviews comparison table
            const renderStars = (rating) => {
                if (!rating) return '<span style="color: #9ca3af;">No rating</span>';
                const fullStars = Math.floor(rating);
                const hasHalf = rating % 1 >= 0.5;
                let stars = '★'.repeat(fullStars);
                if (hasHalf) stars += '½';
                return `<span style="color: #f59e0b; font-size: 16px;">${stars}</span> <span style="color: #374151; font-weight: 600;">${rating.toFixed(1)}</span>`;
            };

            const practiceReviewCount = report.practiceData.review_count || 0;
            const avgCompetitorReviews = report.competitors.length > 0
                ? Math.round(report.competitors.reduce((sum, c) => sum + (c.review_count || 0), 0) / report.competitors.length)
                : 0;
            const reviewCountClass = practiceReviewCount >= avgCompetitorReviews ? 'color: #10b981;' : 'color: #ef4444;';

            this.container.querySelector('#de-reviews-table').innerHTML = `
                <tr style="background: #eff6ff;">
                    <td><strong>${report.practiceData.name}</strong> (You)</td>
                    <td>${renderStars(report.practiceData.rating)}</td>
                    <td><strong style="${reviewCountClass}">${practiceReviewCount.toLocaleString()}</strong></td>
                </tr>
                ${report.competitors.map(c => `
                    <tr>
                        <td><a href="${c.website}" target="_blank" rel="noopener" style="color: #667eea; text-decoration: none; font-weight: 500;">${c.name}</a></td>
                        <td>${renderStars(c.rating)}</td>
                        <td>${(c.review_count || 0).toLocaleString()}</td>
                    </tr>
                `).join('')}
            `;

            // Keyword summary - two lists
            const ks = report.keywordSummary || {};

            const renderRankingList = (items, emptyMessage) => {
                if (!items || items.length === 0) {
                    return `<div style="color: #6b7280; font-style: italic; padding: 12px 0;">${emptyMessage}</div>`;
                }
                return items.map((kw, i) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                        <span style="color: #374151;">${kw.keyword}</span>
                        <span style="font-weight: 600; color: ${kw.practiceRank ? (kw.practiceRank <= 10 ? '#10b981' : '#f59e0b') : '#ef4444'};">
                            ${kw.practiceRank ? '#' + kw.practiceRank : 'Not ranked'}
                        </span>
                    </div>
                `).join('');
            };

            this.container.querySelector('#de-keyword-summary').innerHTML = `
                <div style="background: #fff; border-radius: 12px; padding: 24px; border: 2px solid #10b981;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                        <span style="font-size: 20px;">✓</span>
                        <h3 style="font-size: 16px; font-weight: 600; color: #065f46; margin: 0;">Keywords You Rank For</h3>
                    </div>
                    ${renderRankingList(ks.top5Ranking, 'No rankings found yet')}
                </div>
                <div style="background: #fff; border-radius: 12px; padding: 24px; border: 2px solid #f59e0b;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                        <span style="font-size: 20px;">↑</span>
                        <h3 style="font-size: 16px; font-weight: 600; color: #92400e; margin: 0;">Keywords to Improve</h3>
                    </div>
                    ${renderRankingList(ks.top5Improve, 'Great job! No improvements needed')}
                </div>
            `;

            // Directory listings
            const dirs = report.directoryListings || [];

            const getImportanceBadge = (importance) => {
                const colors = {
                    critical: { bg: '#fee2e2', text: '#991b1b' },
                    high: { bg: '#fef3c7', text: '#92400e' },
                    medium: { bg: '#dbeafe', text: '#1e40af' },
                    low: { bg: '#f3f4f6', text: '#6b7280' }
                };
                const c = colors[importance] || colors.low;
                return `<span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${c.bg}; color: ${c.text}; text-transform: uppercase; font-weight: 600;">${importance}</span>`;
            };

            this.container.querySelector('#de-directory-listings').innerHTML = dirs.map(dir => `
                <div style="background: #fff; border-radius: 8px; padding: 16px; border: 2px solid ${dir.found ? '#10b981' : '#e5e7eb'}; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 20px;">${dir.found ? '✓' : '✗'}</span>
                        <div>
                            <div style="font-weight: 600; color: #1f2937;">${dir.directory}</div>
                            <div style="font-size: 12px; color: #6b7280;">${dir.domain}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${getImportanceBadge(dir.importance)}
                        ${dir.found
                            ? `<a href="${dir.url}" target="_blank" rel="noopener" style="font-size: 12px; color: #667eea; text-decoration: none;">View →</a>`
                            : `<span style="font-size: 12px; color: #ef4444; font-weight: 500;">Not Found</span>`
                        }
                    </div>
                </div>
            `).join('');

            // Recommendations
            this.container.querySelector('#de-recommendations').innerHTML = report.recommendations.map(rec => `
                <div class="de-recommendation de-${rec.priority}">
                    <div class="de-recommendation-header">
                        <span class="de-recommendation-priority">${rec.priority}</span>
                        <span class="de-recommendation-title">${rec.title}</span>
                    </div>
                    <p class="de-recommendation-desc">${rec.description}</p>
                </div>
            `).join('');
        }

        getScoreClass(score) {
            if (score >= 70) return 'de-good';
            if (score >= 40) return 'de-medium';
            return 'de-poor';
        }

        renderRank(rank) {
            if (rank === null || rank === undefined) {
                return '<span class="de-rank de-unranked">Not Ranked</span>';
            }
            if (rank <= 3) return `<span class="de-rank de-top3">#${rank}</span>`;
            if (rank <= 10) return `<span class="de-rank de-top10">#${rank}</span>`;
            return `<span class="de-rank de-top20">#${rank}</span>`;
        }

        renderChart(report) {
            const canvas = this.container.querySelector('#de-backlinks-chart');
            const ctx = canvas.getContext('2d');

            if (this.backlinksChart) {
                this.backlinksChart.destroy();
            }

            const labels = [
                report.practiceData.name,
                ...report.competitors.map(c => c.name.substring(0, 20))
            ];

            const data = [
                report.practiceData.backlinks.rank,
                ...report.competitors.map(c => c.backlinks.rank)
            ];

            const colors = ['#667eea', ...report.competitors.map(() => '#94a3b8')];

            this.backlinksChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Domain Rank',
                        data,
                        backgroundColor: colors,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Domain Rank' } },
                        x: { ticks: { maxRotation: 45, minRotation: 45 } }
                    }
                }
            });
        }

        resetForm() {
            this.container.querySelector('#de-report-section').classList.add('de-hidden');
            this.container.querySelector('#de-form-section').classList.remove('de-hidden');
            this.container.querySelector('#de-seo-form').reset();
            this.container.querySelectorAll('.de-mode-option').forEach(o => o.classList.remove('de-selected'));
            this.container.querySelector('.de-mode-option[data-mode="auto"]').classList.add('de-selected');
            this.competitorMode = 'auto';
            this.container.querySelector('#de-manual-entry').classList.add('de-hidden');
        }
    }

    // Initialize
    function init() {
        injectStyles();
        loadChartJS(function() {
            const containers = document.querySelectorAll('[data-dentistenvy]');
            containers.forEach(container => {
                new DentistEnvyWidget(container);
            });
        });
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose globally for manual initialization
    window.DentistEnvy = {
        init: init,
        Widget: DentistEnvyWidget
    };
})();
