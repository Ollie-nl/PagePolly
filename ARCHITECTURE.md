
# PagePolly Architecture EN

This document provides an overview of the updated system architecture for PagePolly. The system is designed to be modular, scalable, and easy to extend.

---

## System Components

### 1. **Puppeteer Crawler**
- Navigates websites stealthily using the Puppeteer Extra Stealth Plugin.
- Extracts text-only content (e.g., headings, paragraphs, and metadata).
- Rotates user agents to mimic different browsers.
- Introduces delays between requests to avoid detection.

---

### 2. **Node.js Backend**
- Exposes APIs for managing crawling workflows.
- Integrates PostgreSQL for storing extracted data.

---

### 3. **PostgreSQL Database**
Schema:
```sql
CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    name TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crawled_pages (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    content TEXT,
    date_crawled TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_code INTEGER,
    depth INTEGER,
    response_time INTEGER,
    headings TEXT,
    links TEXT[],
    user_agent TEXT,
    crawler_version TEXT,
    source TEXT,
    language TEXT,
    is_valid BOOLEAN DEFAULT TRUE
);
```

---

### 4. **React Dashboard**
- Provides a frontend for visualizing and analyzing crawled data.
- Includes features for filtering, searching, and monitoring.

---

## Workflow

1. **Initiate Crawl**:
   - User specifies a target URL, depth, and optional metadata via the frontend.
2. **Data Extraction**:
   - Puppeteer extracts text content, metadata, and site structure.
3. **Data Storage**:
   - Extracted data is stored in PostgreSQL for structured analysis.
4. **Visualization**:
   - Data is displayed in a React-based dashboard.

---

## Technology Stack

| Layer          | Technology         |
|----------------|--------------------|
| Web Crawling   | Puppeteer          |
| Backend        | Node.js            |
| Database       | PostgreSQL         |
| Frontend       | React              |
| Containerization | Docker           |

---

## Folder Structure

```
project-root/
├── public/
│   └── index.html
├── src/
│   ├── backend/
│   │   ├── server.js
│   │   ├── crawler.js
│   │   ├── userAgents.js
│   │   └── db.js
│   ├── components/
│   │   ├── CrawlForm.jsx
│   │   └── ResultsList.jsx
│   ├── App.jsx
│   ├── index.js
├── docker-compose.yml
├── .env
├── package.json
├── README.md
└── ARCHITECTURE.md
```

---

For questions or suggestions, feel free to contribute or create an issue!


# PagePolly Architectuur NL

Dit document geeft een overzicht van de bijgewerkte systeemarchitectuur van PagePolly. Het systeem is ontworpen om modulair, schaalbaar en eenvoudig uitbreidbaar te zijn.

---

## Systeemonderdelen

### 1. **Puppeteer Crawler**
- Navigeert stealthily door websites met behulp van de Puppeteer Extra Stealth Plugin.
- Extraheert alleen tekstuele inhoud (bijvoorbeeld headings, paragrafen en metadata).
- Roteert user agents om verschillende browsers na te bootsen.
- Voegt vertragingen toe tussen verzoeken om detectie te voorkomen.

---

### 2. **Node.js Backend**
- Biedt API's aan voor het beheren van crawling-workflows.
- Integreert PostgreSQL voor het opslaan van geëxtraheerde gegevens.

---

### 3. **PostgreSQL Database**
Schema:
```sql
CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    name TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crawled_pages (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    content TEXT,
    date_crawled TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_code INTEGER,
    depth INTEGER,
    response_time INTEGER,
    headings TEXT,
    links TEXT[],
    user_agent TEXT,
    crawler_version TEXT,
    source TEXT,
    language TEXT,
    is_valid BOOLEAN DEFAULT TRUE
);
```

---

### 4. **React Dashboard**
- Biedt een frontend voor het visualiseren en analyseren van gecrawlde gegevens.
- Bevat functies voor filteren, zoeken en monitoren.

---

## Workflow

1. **Start Crawling**:
   - Gebruikers geven een URL, diepte en optionele metadata op via de frontend.
2. **Data Extractie**:
   - Puppeteer extraheert tekstinhoud, metadata en site-structuur.
3. **Gegevensopslag**:
   - Geëxtraheerde gegevens worden opgeslagen in PostgreSQL voor gestructureerde analyse.
4. **Visualisatie**:
   - Gegevens worden weergegeven in een React-gebaseerd dashboard.

---

## Technologie Stack

| Laag             | Technologie       |
|------------------|-------------------|
| Web Crawling     | Puppeteer         |
| Backend          | Node.js           |
| Database         | PostgreSQL        |
| Frontend         | React             |
| Containerisatie  | Docker            |

---

## Mapstructuur

```
project-root/
├── public/
│   └── index.html
├── src/
│   ├── backend/
│   │   ├── server.js
│   │   ├── crawler.js
│   │   └── db.js
│   ├── components/
│   │   ├── CrawlForm.jsx
│   │   └── ResultsList.jsx
│   ├── App.jsx
│   ├── index.js
├── docker-compose.yml
├── .env
├── package.json
├── README.md
└── ARCHITECTURE.md
```

---

Voor vragen of suggesties kun je bijdragen of een issue aanmaken!
