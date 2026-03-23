# PagePolly Web Crawler Service

The PagePolly web crawler service is a Node.js backend that crawls websites and stores structured data in Supabase. It uses Puppeteer for headless browser automation to extract page elements, take screenshots, and analyze web page structure.

## Features

- **Web Crawling**: Crawl specified URLs and extract structured data
- **Screenshot Capture**: Take full-page screenshots of crawled pages
- **Element Extraction**: Extract product elements, navigation, headings, and links
- **Concurrent Processing**: Handle multiple crawl jobs simultaneously
- **Progress Tracking**: Monitor crawl progress in real-time
- **Job Management**: Start, monitor, and cancel crawl jobs
- **Supabase Integration**: Store results in Supabase database
- **Authentication**: Secure API endpoints with Supabase auth
- **Anti-Detection**: Rotating user agents, fingerprinting protection, and stealth mode
- **Human Behavior Simulation**: Realistic scrolling, mouse movements, and interaction patterns

## Prerequisites

- Node.js 16 or higher
- Supabase account with the following setup:
  - Authentication enabled
  - Database tables created (see `database/init.sql` and `database/crawl_jobs.sql`)
  - Service role API key

## Setup Instructions

1. **Install dependencies**

```bash
cd server
npm install
```


2. **Configure environment variables**

Copy the `.env.template` file to `.env` and fill in your Supabase credentials:

```bash
cp ../.env.template ../.env
# Then edit the .env file with your credentials
```


Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key for client-side auth
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for server-side operations
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment (development, production)

3. **Initialize the database**

Run the SQL scripts in the Supabase SQL editor:
- `database/init.sql` - Creates core tables
- `database/crawl_jobs.sql` - Creates the crawl jobs table

4. **Start the server**

Development mode:

```bash
cd server
npm run dev
```

Production mode:

```bash
cd server
npm start
```

## API Endpoints

### Start a crawl
- **POST** `/api/crawls`
- **Body**: `{ "projectId": "uuid", "urls": ["url1", "url2"] }`
- **Auth**: JWT token required
- **Returns**: Job ID and status

### Get active crawl jobs
- **GET** `/api/crawls/status`
- **Auth**: JWT token required
- **Returns**: List of active crawl jobs

### Cancel a crawl job
- **POST** `/api/crawls/:jobId/cancel`
- **Auth**: JWT token required
- **Returns**: Updated job status

### Get crawl job details
- **GET** `/api/crawls/:jobId`
- **Auth**: JWT token required
- **Returns**: Detailed job information including results

### Get crawl history
- **GET** `/api/crawls?projectId=uuid&status=completed&limit=10&page=1`
- **Auth**: JWT token required
- **Returns**: Paginated list of crawl jobs

## Architecture

- **server/index.js**: Main Express server setup
- **server/routes/puppeteerCrawlRoutes.js**: API route definitions for crawl jobs
- **server/services/puppeteer/puppeteerCrawlerService.js**: Core crawler — orchestrates page crawling, retries, and data extraction
- **server/services/puppeteer/puppeteerManager.js**: Browser pool management (up to 5 concurrent browsers)
- **server/services/puppeteer/puppeteerConfig.js**: Central configuration for all crawler settings
- **server/services/puppeteer/antiDetectionService.js**: Anti-detection measures applied per page
- **server/services/puppeteer/humanBehaviorSimulator.js**: Human-like interaction simulation
- **server/services/puppeteer/proxyRotationService.js**: Proxy pool management (disabled by default)
- **server/config/db.js**: Database service for Supabase interaction
- **server/middlewares/auth.js**: Authentication middleware

## Anti-Detection & Stealth

Every crawl automatically applies the following protections, configured via `puppeteerConfig.js`:

### Stealth Plugins
- `puppeteer-extra-plugin-stealth` — patches all common bot-detection checks at browser level
- `puppeteer-extra-plugin-adblocker` — blocks trackers and ads

### Anti-Detection (`antiDetectionService.js`)
| Protection | Details |
|---|---|
| User Agent rotation | Randomly picks from 6 real browser UAs (Chrome/Firefox/Safari/Edge on Windows & macOS) |
| `navigator.webdriver` | Overridden to `false` |
| HTTP headers | Injects `Accept-Language`, `Accept`, `Accept-Encoding`, `Upgrade-Insecure-Requests` |
| WebGL fingerprinting | Spoofs vendor/renderer to `Intel Inc. / Intel Iris Graphics 6100` |
| Canvas fingerprinting | Adds subtle pixel noise to `toDataURL` and `getImageData` |
| Hardware concurrency | Reported as `4` (configurable) |
| Device memory | Reported as `8 GB` (configurable) |
| Viewport | 1920×1080 with slight random variation |

### Human Behavior Simulation (`humanBehaviorSimulator.js`)
| Behavior | Details |
|---|---|
| Scrolling | Variable-speed smooth scrolling in 2–8 steps; 50% chance of partial scroll-back |
| Mouse movements | 2–4 random waypoints with stepped movement |
| Element interaction | 30% chance of hovering/clicking on tabs or accordion elements |
| Timing | Random delays between actions (300–1200ms by default) |

### Runtime Logging
At the start of each crawl job and each URL, the server logs which properties are active. Look for lines prefixed with `[Crawler]` in the server console.

## Configuration

All settings are centralized in `server/services/puppeteer/puppeteerConfig.js`:

```js
antiDetection: {
  userAgent: false,          // false = random rotation, string = fixed UA
  userAgents: [...],         // pool of UAs to rotate
  humanBehavior: {
    enabled: true,
    minDelay: 300,
    maxDelay: 1200,
    mouseMoveDelay: 1000,
    scrollDelay: 500,
  },
  webglFingerprinting: true,
  canvasFingerprinting: true,
  hardwareConcurrency: 4,
  deviceMemory: 8,
},
proxy: {
  enabled: false,            // set to true and populate pool to enable proxy rotation
  rotationEnabled: false,
  rotationInterval: 5,
  pool: [],
}
```

Per-job overrides can be passed via the `settings.antiDetection` field in the POST `/api/puppeteer-crawls` request body.

## Extension Points

- **Custom Element Extraction**: Modify `extractPageData()` in `puppeteerCrawlerService.js`
- **Proxy Rotation**: Enable `proxy.enabled` in `puppeteerConfig.js` and populate `proxy.pool`
- **Enhanced Anti-Detection**: Call `antiDetectionService.applyEnhancedAntiDetection()` instead of `applyAntiDetection()` for stronger protection on difficult sites
- **Notifications**: Implement webhooks or notifications when crawls complete

## Troubleshooting

- **Browser Launch Issues**: If Puppeteer fails to launch in production, install additional system dependencies or use a Docker container with Chrome included.
- **Memory Issues**: For large crawls, monitor memory usage. Reduce `maxBrowsers` in `puppeteerManager.js` or the number of pages per browser.
- **Blocked by target site**: Enable enhanced anti-detection or add proxies via `puppeteerConfig.js`.