# PagePolly Architecture

This document provides an overview of the architecture for the PagePolly project. The system is designed to be modular, scalable, and easy to extend.

---

## **Overview**

PagePolly is a web crawler and data extractor built with Puppeteer for web scraping and Node.js for backend functionality. The system integrates a database for storing extracted content and is designed to support a React-based dashboard for visualizing and managing crawled data.

---

## **System Components**

### **1. Puppeteer Crawler**
The core of the project is the Puppeteer-based crawler, which:
- Navigates websites stealthily using the Puppeteer Extra Stealth Plugin.
- Extracts textual content (e.g., headings, paragraphs, and metadata).
- Rotates user agents to mimic different browsers.
- Introduces delays between requests to avoid detection.

**Files:**
- `src/crawlers/`
- `src/crawlers/testCrawler.js`

---

### **2. Node.js Backend**
The backend manages the crawling workflow and integrates with the database. Key features:
- Exposes APIs for managing crawl requests.
- Handles error logging and retries.
- Configures the database connection for storing extracted data.

**Files:**
- `src/server/`
- `src/database/`

---

### **3. Database Layer**
The database stores the structured data extracted during crawling. Schema includes:
- **Crawled URLs:**
  - URL
  - Title
  - Metadata
  - Content
  - Crawl date
- **Error Logs:**
  - URL
  - Error type
  - Timestamp

**Supported Databases:**
- MongoDB (default)
- PostgreSQL (future integration)

**Files:**
- `src/database/config.js`
- `src/database/models/`

---

### **4. React Dashboard (Planned)**
A React-based frontend will provide a user-friendly interface for:
- Visualizing and filtering crawled data.
- Monitoring crawl progress.
- Configuring crawler settings.

**Planned Features:**
- Search and filter functionality.
- Graphical representation of crawling statistics.

**Files:**
- `src/frontend/`

---

## **Workflow**

1. **Initiate Crawl**:
   - A user specifies a target URL via CLI or API.
2. **Crawl Process**:
   - Puppeteer navigates the site, extracts content, and stores it in the database.
   - User agents and delays are applied to avoid detection.
3. **Data Storage**:
   - Extracted text and metadata are saved in the database for later use.
4. **Data Visualization**:
   - (Planned) Data is displayed in a React dashboard for analysis.

---

## **Technology Stack**

| Layer                | Technology                |
|----------------------|---------------------------|
| Web Crawling         | Puppeteer, Puppeteer Extra Plugins |
| Backend              | Node.js                  |
| Database             | PostgreSQL (future) |
| Frontend (Planned)   | React, Next.js    |
| Package Manager      | pnpm                     |

---

## **Planned Extensions**

1. **Proxies**: Add proxy support for advanced crawling.
2. **Advanced Error Handling**: Retry logic for failed requests.
3. **Distributed Crawling**: Scale the crawler across multiple nodes.
4. **Sitemap Parsing**: Efficiently crawl sites using their sitemaps.

---
## **Folder structure**

project-root/
├── public/
│   └── index.html           # HTML bestand voor de frontend
├── src/
│   ├── backend/
│   │   ├── server.js        # Backend server om API's te hosten
│   │   └── crawler.js       # Crawler-logica
│   ├── components/
│   │   ├── CrawlForm.jsx    # React component voor invoer
│   │   └── ResultsList.jsx  # React component om resultaten te tonen
│   ├── App.jsx              # Hoofdcomponent van React
│   ├── index.js             # Instappunt van de React-app
├── package.json             # Dependencies en scripts
├── webpack.config.js        # Webpack configuratie
└── README.md                # Documentatie



---

For questions or suggestions, please feel free to contribute or create an issue in the repository!