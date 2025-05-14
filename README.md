# PagePolly

PagePolly is an open-source web crawler tool designed to monitor vendor websites, ensuring products are displayed as agreed upon. It supports multiple crawling methods including API integration and Puppeteer-based browser automation. The system crawls vendor pages from provided URLs and stores relevant data in a PostgreSQL database. The results are presented through an intuitive React dashboard, enabling users to track crawl progress and identify discrepancies in product placement.

## Features

- Multiple crawling methods:
  - Direct API integration
  - Puppeteer browser automation
  - Customizable crawl settings
- Advanced anti-blocking mechanisms
- Real-time crawl monitoring
- Test interface for quick verification
- Comprehensive reporting

[Previous project structure and installation sections remain the same...]

## Crawling Methods

### 1. API Integration
- Direct communication with vendor APIs
- Structured data retrieval
- Rate limit compliance

### 2. Puppeteer Automation
- Headless browser-based crawling
- Anti-blocking features:
  - User agent rotation
  - Request timing randomization
  - Browser fingerprint protection
- Configuration options:
  ```env
  PUPPETEER_HEADLESS=true
  PUPPETEER_TIMEOUT=30000
  PUPPETEER_WAIT_TIME=2000
  PUPPETEER_PROXY_SERVER=
  ```

## Test Interface

1. Access the test interface at `/test-crawler`
2. Select crawling method (API or Puppeteer)
3. Enter test URL
4. Configure crawl settings:
   - Wait time
   - Timeout
   - Proxy (optional)
5. Click 'Start Test' to begin crawling
6. View real-time results and status

[Rest of the original README.md content remains unchanged...]

## Tech Stack

- React
- Redux Toolkit
- Vite
- TailwindCSS
- Chart.js
- Axios
- Puppeteer
- PostgreSQL (backend)
- Node.js (backend)
- ESLint
