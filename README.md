# PagePolly

Open-source tool om vendor-pagina's te monitoren en te crawlen. Controleer of producten correct worden weergegeven op websites van leveranciers.

## Technologie-stack

| Laag | Technologie |
|------|-------------|
| Frontend | React 18 · Redux Toolkit · MUI 7 |
| Backend | Node.js · Express |
| Crawler | Puppeteer · puppeteer-extra-plugin-stealth |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |

## Vereisten

- Node.js 18+
- pnpm (of npm)
- Een gratis [Supabase](https://supabase.com) account

---

## Installatie

### 1. Repository clonen

```bash
git clone https://github.com/Ollie-nl/PagePolly.git
cd PagePolly
```

### 2. Dependencies installeren

```bash
# Frontend dependencies
pnpm install

# Backend dependencies
cd server && npm install && cd ..
```

### 3. Database aanmaken in Supabase

1. Maak een nieuw project aan op [supabase.com](https://supabase.com)
2. Ga naar **SQL Editor** in het dashboard
3. Kopieer de inhoud van `supabase/schema.sql` en voer uit

### 4. Environment variabelen instellen

```bash
cp .env.template .env
```

Vul je Supabase-gegevens in (te vinden in **Settings → API** in het Supabase dashboard):

```env
VITE_SUPABASE_URL=https://jouw-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=jouw-anon-key
SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key
```

---

## Opstarten (development)

Open twee terminals:

**Terminal 1 — Backend:**
```bash
node start-crawler.js
# Server draait op http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
pnpm dev
# Frontend draait op http://localhost:5175
```

Ga naar [http://localhost:5175](http://localhost:5175) en registreer een account.

---

## API Endpoints

Alle endpoints (behalve `/api/health`) vereisen een `Authorization: Bearer <token>` header.

| Method | Endpoint | Beschrijving |
|--------|----------|--------------|
| GET | `/api/health` | Server status |
| GET | `/api/vendors` | Alle vendors ophalen |
| POST | `/api/vendors` | Nieuwe vendor aanmaken |
| PUT | `/api/vendors/:id` | Vendor bijwerken |
| DELETE | `/api/vendors/:id` | Vendor verwijderen |
| POST | `/api/crawls` | Crawl job starten |
| GET | `/api/crawls/:jobId` | Job status ophalen |
| GET | `/api/crawls/:jobId/results` | Resultaten ophalen |
| POST | `/api/crawls/:jobId/cancel` | Job annuleren |
| GET | `/api/crawls` | Crawl geschiedenis |
| POST | `/api/crawls/test` | Enkele URL testen |
| GET | `/api/reports` | Rapporten ophalen |
| GET | `/api/reports/:id` | Enkel rapport |

---

## Database tabellen

| Tabel | Beschrijving |
|-------|-------------|
| `vendors` | Vendor-configuraties (naam, URL) |
| `crawl_jobs` | Crawl-jobs en hun status |
| `crawl_results` | Resultaten per gecrawlde URL |
| `crawl_errors` | Fouten per URL |
| `crawler_configs` | Puppeteer-configuraties (via Settings) |

Alle tabellen hebben Row Level Security (RLS) — elke gebruiker ziet alleen zijn eigen data.

---

## Projectstructuur

```
pagepolly/
├── src/                        # React frontend
│   ├── api/                    # API clients (axios)
│   ├── components/             # Herbruikbare componenten
│   ├── hooks/                  # Custom React hooks
│   ├── pages/                  # Pagina-componenten
│   ├── store/                  # Redux store & slices
│   └── lib/                    # Supabase client
├── server/                     # Node.js backend
│   ├── config/db.js            # Database interface
│   ├── routes/                 # Express routes
│   └── services/               # Puppeteer crawl services
├── supabase/
│   └── schema.sql              # Database schema (run dit in Supabase)
├── .env.template               # Environment variabelen template
├── start-crawler.js            # Backend start script
└── vite.config.js              # Vite configuratie
```

---

## Hoe een crawl werkt

1. Gebruiker voegt een vendor toe (naam + URL)
2. Gebruiker start een crawl via de interface
3. Backend opent een headless Chromium browser via Puppeteer
4. Puppeteer stealth-modus voorkomt blokkering door anti-bot systemen
5. Data (titels, headings, links, screenshot) wordt opgeslagen in Supabase
6. Frontend toont resultaten via polling

---

## Bijdragen

Pull requests zijn welkom. Open eerst een issue om grote wijzigingen te bespreken.
