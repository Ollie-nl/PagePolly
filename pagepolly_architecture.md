# PagePolly System Architecture

Dit document beschrijft de technische architectuur voor de PagePolly web crawler tool. De architectuur is ontworpen om te voldoen aan de vereisten zoals beschreven in het Product Requirements Document, met focus op schaalbaarheid, onderhoudsvriendelijkheid en gebruiksgemak.

## Implementatie Aanpak

PagePolly vereist een robuuste architectuur die efficiënt webpagina's kan crawlen, data kan opslaan en visualiseren via een gebruiksvriendelijk dashboard. De implementatie zal gebruik maken van:

- **Frontend**: React met Tailwind CSS voor het dashboard en gebruikersinterface
- **Backend**: Node.js met Express voor de API-laag
- **Database**: PostgreSQL voor gestructureerde dataopslag
- **Externe Services**: Integratie met crawling API's zoals ScrapingBee

Er zijn enkele uitdagingen die speciale aandacht vereisen:
1. Het effectief beheren van externe API's en hun rate limiting
2. Het ontwerpen van een flexibel systeem voor meerdere crawling providers
3. Het verwerken en visualiseren van grote hoeveelheden gecrawlde data
4. Het waarborgen van de veiligheid van API keys en gevoelige gegevens

## 1. Frontend Design

### 1.1 Component Structuur

```
/src
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Table.jsx
│   │   └── ... 
│   ├── dashboard/
│   │   ├── ProgressOverview.jsx
│   │   ├── QuickStats.jsx
│   │   ├── RecentActivity.jsx
│   │   └── StatusSummary.jsx
│   ├── vendors/
│   │   ├── VendorForm.jsx
│   │   ├── VendorList.jsx
│   │   └── VendorDetails.jsx
│   ├── reports/
│   │   ├── CrawlReport.jsx
│   │   ├── ProductReport.jsx
│   │   └── ExportOptions.jsx
│   └── settings/
│       ├── CrawlerSettings.jsx
│       ├── ApiKeyManagement.jsx
│       └── UserPreferences.jsx
├── layouts/
│   ├── MainLayout.jsx
│   └── AuthLayout.jsx (voor toekomstige implementatie)
├── pages/
│   ├── Dashboard.jsx
│   ├── Vendors.jsx
│   ├── Reports.jsx
│   ├── Settings.jsx
│   └── NotFound.jsx
└── App.jsx
```

### 1.2 State Management

Voor state management zal het project gebruik maken van:

- **React Context API** voor globale state (gebruikersvoorkeuren, thema, etc.)
- **Redux Toolkit** voor complexere state management behoeften:
  - Vendor management state
  - Crawl data en resultaten
  - Rapportage informatie

Voorbeeld Redux store structuur:

```javascript
{
  vendors: {
    items: [], // lijst van vendor objecten
    status: 'idle' | 'loading' | 'succeeded' | 'failed',
    error: null,
    selectedVendor: null
  },
  crawls: {
    history: [], // historische crawl data
    activeJobs: [], // momenteel actieve crawling jobs
    status: 'idle' | 'loading' | 'succeeded' | 'failed',
    progress: {}, // voortgang per vendor URL
    statistics: {} // geaggregeerde statistieken
  },
  reports: {
    items: [],
    filters: {},
    exportFormat: null
  },
  settings: {
    crawlers: [], // geconfigureerde crawlers
    preferences: {}
  }
}
```

### 1.3 UI/UX Flow Diagram

Zie het bestand `pagepolly_sequence_diagram.mermaid` voor een gedetailleerde weergave van de gebruikersinteractie flow.

## 2. Backend Design

### 2.1 API Endpoints

#### Vendors API
- `GET /api/vendors` - Alle vendors ophalen
- `GET /api/vendors/:id` - Specifieke vendor ophalen
- `POST /api/vendors` - Nieuwe vendor aanmaken
- `PUT /api/vendors/:id` - Vendor updaten
- `DELETE /api/vendors/:id` - Vendor verwijderen

#### Crawls API
- `POST /api/crawls` - Start een nieuwe crawl
- `GET /api/crawls` - Alle crawl historiek ophalen
- `GET /api/crawls/:id` - Details van specifieke crawl ophalen
- `GET /api/crawls/status` - Status van actieve crawls ophalen
- `POST /api/crawls/:id/cancel` - Annuleer een actieve crawl

#### Resultaten API
- `GET /api/results` - Alle crawl resultaten ophalen
- `GET /api/results/:crawlId` - Resultaten voor specifieke crawl
- `GET /api/results/vendor/:vendorId` - Resultaten per vendor
- `GET /api/results/statistics` - Geaggregeerde statistieken

#### Rapporten API
- `GET /api/reports` - Beschikbare rapporten ophalen
- `GET /api/reports/:id` - Specifiek rapport ophalen
- `POST /api/reports/export` - Rapport exporteren (PDF, CSV)

#### Instellingen API
- `GET /api/settings/crawlers` - Crawler configuraties ophalen
- `POST /api/settings/crawlers` - Crawler configuratie aanmaken/updaten
- `DELETE /api/settings/crawlers/:id` - Crawler configuratie verwijderen

### 2.2 Service Layer Structuur

```
/src
├── controllers/
│   ├── vendorController.js
│   ├── crawlController.js
│   ├── resultController.js
│   ├── reportController.js
│   └── settingController.js
├── services/
│   ├── vendorService.js
│   ├── crawlService.js
│   ├── resultService.js
│   ├── reportService.js
│   ├── settingService.js
│   └── crawlers/
│       ├── crawlerFactory.js
│       ├── baseCrawler.js
│       ├── scrapingBeeCrawler.js
│       └── additionalCrawlers/ (voor toekomstige implementaties)
├── models/
│   ├── vendorModel.js
│   ├── crawlModel.js
│   ├── resultModel.js
│   └── settingModel.js
├── middleware/
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   ├── dataValidator.js
│   └── authMiddleware.js (voor toekomstige implementatie)
├── utils/
│   ├── logger.js
│   ├── database.js
│   ├── apiClient.js
│   └── helpers.js
├── config/
│   ├── database.js
│   ├── app.js
│   └── crawlers.js
└── server.js
```

### 2.3 Externe API Integratie

Voor de crawling functionaliteit wordt een adapter pattern gebruikt om meerdere crawl API providers te ondersteunen. Zie het bestand `pagepolly_class_diagram.mermaid` voor een gedetailleerde weergave van deze structuur.

## 3. Database Design

### 3.1 Database Schema

Uitgebreid PostgreSQL schema op basis van de oorspronkelijke tabellen met enkele aanvullingen. Zie het bestand `pagepolly_class_diagram.mermaid` voor een gedetailleerd database diagram.

### 3.2 Query Optimalisatie

Om de database prestaties te optimaliseren, worden de volgende maatregelen genomen:

1. **Indexen**: Belangrijke zoekvelden en foreign keys indexeren:
   ```sql
   CREATE INDEX idx_crawled_pages_site_id ON crawled_pages(site_id);
   CREATE INDEX idx_crawled_pages_date ON crawled_pages(date_crawled);
   CREATE INDEX idx_product_occurrences_crawled_page_id ON product_occurrences(crawled_page_id);
   CREATE INDEX idx_product_occurrences_product_id ON product_occurrences(product_id);
   CREATE INDEX idx_sites_url ON sites(url);
   CREATE INDEX idx_crawl_jobs_status ON crawl_jobs(status);
   ```

2. **Partitionering**: Voor grote datasets kunnen de tabellen gepartitioneerd worden:
   ```sql
   CREATE TABLE crawled_pages_partitioned (LIKE crawled_pages) PARTITION BY RANGE (date_crawled);
   
   -- Maandelijkse partities aanmaken
   CREATE TABLE crawled_pages_y2025m04 PARTITION OF crawled_pages_partitioned
       FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
   ```

3. **Materialized Views**: Voor veelgebruikte rapportages:
   ```sql
   CREATE MATERIALIZED VIEW mv_site_statistics AS
   SELECT 
       s.id, s.name, s.url, 
       COUNT(cp.id) AS pages_crawled,
       MAX(cp.date_crawled) AS last_crawled,
       AVG(cp.response_time) AS avg_response_time,
       COUNT(DISTINCT po.product_id) AS products_found
   FROM sites s
   LEFT JOIN crawled_pages cp ON s.id = cp.site_id
   LEFT JOIN product_occurrences po ON cp.id = po.crawled_page_id
   GROUP BY s.id, s.name, s.url;
   ```

## 4. Beveiligingsoverwegingen

### 4.1 Authenticatie/Autorisatie Framework

Voor de toekomstige implementatie van authenticatie en autorisatie wordt een voorbereid framework ontworpen met JWT-based authenticatie en Role-based Access Control (RBAC).

### 4.2 API Key Management

Voor het veilige beheer van externe API keys wordt gebruik gemaakt van versleuteling met een master key opgeslagen in .env bestanden en een rotatiemechanisme voor API keys.

### 4.3 Environment Variable Handling

Omgevingsvariabelen worden beheerd met een validatieschema en verschillende configuratiebestanden voor verschillende omgevingen (development, staging, productie).

## 5. Deployment Architectuur

### 5.1 Omgevingen

Er worden drie omgevingen ingericht: Development, Staging en Production, elk met hun eigen database en configuratie.

### 5.2 CI/CD Pipeline

Een GitHub Actions pipeline wordt geïmplementeerd voor automatische tests, builds en deployments naar de verschillende omgevingen.

## 6. Data Structuren en Interfaces

Zie het bestand `pagepolly_class_diagram.mermaid` voor een gedetailleerd overzicht van alle datastructuren en interfaces in het systeem.

## 7. Programma Call Flow

Zie het bestand `pagepolly_sequence_diagram.mermaid` voor een gedetailleerde weergave van de programma call flow voor de belangrijkste gebruikersscenario's.

## 8. Conclusie

De voorgestelde architectuur voor PagePolly biedt een robuuste, schaalbare en veilige oplossing die voldoet aan de eisen van het PRD. De oplossing is opgebouwd uit moderne technologieën (React, Node.js, PostgreSQL) en maakt gebruik van bewezen ontwerppatronen zoals de adapter pattern voor de crawler integratie en repository pattern voor de data toegang.

Belangrijke voordelen van deze architectuur zijn:

1. **Flexibiliteit**: Door het gebruik van de adapter pattern voor crawlers kan het systeem eenvoudig worden uitgebreid met andere crawl API providers zonder grote codewijzigingen.

2. **Schaalbaarheid**: De architectuur ondersteunt horizontale schaalbaarheid voor zowel de frontend als backend componenten, met een aparte database tier die onafhankelijk kan worden geschaald.

3. **Onderhoudbaarheid**: De modulaire opbouw en duidelijke scheiding van verantwoordelijkheden maakt het eenvoudiger om individuele componenten te onderhouden en uit te breiden.

4. **Toekomstbestendigheid**: De architectuur is voorbereid op toekomstige uitbreidingen zoals een login-systeem, complexere rapportages en integratie met externe systemen.

5. **Beveiligingsfocus**: Er is speciale aandacht besteed aan de veilige opslag en beheer van gevoelige gegevens zoals API keys.

De voorgestelde implementatie voldoet aan alle vereisten uit het PRD en biedt een solide basis voor de ontwikkeling van PagePolly als een effectieve tool voor het monitoren van productplaatsing op leverancierswebsites.