# DentistEnvy - Dental Practice SEO Comparison Tool

An embeddable widget that allows dental practices to compare their website's SEO performance against local competitors.

## Features

- **Two competitor selection modes:**
  - **Auto-Discover**: Finds the 10 highest-ranking dental offices within 15 miles
  - **Manual Entry**: User enters up to 10 competitor URLs directly

- **Comprehensive SEO Analysis:**
  - Keyword rankings for 18 dental-specific keywords
  - Domain authority and backlink metrics
  - Technical SEO scores
  - Actionable recommendations

- **Visual Reports:**
  - Score cards (Overall, Keywords, Backlinks, Technical)
  - Domain authority comparison chart
  - Keyword ranking tables
  - Priority-based recommendations

## Prerequisites

- Node.js 18+ and npm
- Google Places API key (for auto-discovery mode)
- DataForSEO account (already configured)

## Setup

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Widget
cd ../widget
npm install
```

### 2. Configure Environment

Edit `backend/.env` and add your Google Places API key:

```env
PORT=3001
DATAFORSEO_LOGIN=mark@yobi.app
DATAFORSEO_PASSWORD=d320f2233a4b2d53
GOOGLE_PLACES_API_KEY=your_google_api_key_here
FRONTEND_URL=http://localhost:5173
```

### 3. Run the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start widget dev server
cd widget
npm run dev
```

### 4. Open the Demo

Visit `http://localhost:5173` to see the widget in action.

## Embedding the Widget

### Development

```html
<dentist-envy api-url="http://localhost:3001"></dentist-envy>
<script type="module" src="http://localhost:5173/src/index.ts"></script>
```

### Production

After building (`npm run build` in widget folder):

```html
<dentist-envy api-url="https://your-api-domain.com"></dentist-envy>
<script src="https://your-cdn.com/dentistenvy-widget.umd.js"></script>
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analysis/start` | POST | Start a new SEO analysis |
| `/api/analysis/:jobId/status` | GET | Check analysis progress |
| `/api/analysis/:jobId/report` | GET | Get completed report |
| `/api/analysis/discover-competitors` | POST | Preview competitors (auto-discovery) |
| `/api/analysis/validate-urls` | POST | Validate competitor URLs |

## Project Structure

```
DentistEnvy/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── routes/
│   │   │   └── analysis.ts       # API routes
│   │   └── services/
│   │       ├── dataforseo.ts     # DataForSEO API client
│   │       ├── google-places.ts  # Google Places API client
│   │       └── seo-analyzer.ts   # Main analysis orchestrator
│   ├── package.json
│   └── .env
├── widget/
│   ├── src/
│   │   ├── index.ts              # Web Component widget
│   │   └── styles/
│   │       └── widget.css        # Widget styles
│   ├── index.html                # Demo page
│   └── package.json
└── README.md
```

## Cost Estimates

Per analysis (10 competitors, 18 keywords):
- SERP API: ~$0.036 (18 keywords × $0.002)
- Backlinks API: ~$0.22 (11 domains × $0.02)
- OnPage API: ~$0.014 (11 domains × $0.00125)
- **Total: ~$0.27 per analysis**

## Getting a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Places API
   - Geocoding API
4. Create credentials → API key
5. (Recommended) Restrict the key to your domain

## License

Proprietary - New Patients Inc.
