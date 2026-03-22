# PagePolly — Architectuur

## Overzicht

PagePolly is een web monitoring tool bestaande uit drie lagen:

```
┌─────────────────────────────────────┐
│  Browser (React SPA)                │  port 5175 (dev)
│  React · Redux · MUI                │
└───────────────┬─────────────────────┘
                │ HTTP / REST
┌───────────────▼─────────────────────┐
│  Backend (Node.js / Express)        │  port 4000
│  Puppeteer crawl engine             │
└───────────────┬─────────────────────┘
                │ Supabase JS client
┌───────────────▼─────────────────────┐
│  Supabase (PostgreSQL + Auth)       │
│  Row Level Security                 │
└─────────────────────────────────────┘
```

---

## Frontend

**Stack:** React 18 · Redux Toolkit · MUI 7

### Pagina's

| Route | Pagina | Beschrijving |
|-------|--------|-------------|
| `/` | Dashboard | Overzicht actieve jobs en statistieken |
| `/vendors` | Vendors | Beheer vendor-configuraties |
| `/crawler/:id` | Crawler | Start en monitor crawls per vendor |
| `/reports` | Reports | Resultaten en rapporten |
| `/settings` | Settings | Puppeteer-configuraties beheren |
| `/test` | Test | Test een enkele URL direct |

### State management (Redux slices)

| Slice | Bestand | Verantwoordelijkheid |
|-------|---------|---------------------|
| `crawl` | `crawlSlice.js` | Crawl jobs (starten, status, annuleren) |
| `vendors` | `vendorSlice.js` | CRUD vendor-configuraties |
| `reports` | `reportSlice.js` | Rapporten ophalen |
| `settings` | `settingSlice.js` | Puppeteer-configs beheren |

### API communicatie

- `src/api/crawlerApi.js` — Axios client met retry-logica voor crawl-endpoints
- `src/api/apiClient.js` — Axios client voor vendor- en report-endpoints
- Auth token wordt automatisch via Supabase opgehaald

---

## Backend

**Entry point:** `server/index.js` (gestart via `start-crawler.js`)

### Express routes

| Prefix | Bestand | Beschrijving |
|--------|---------|-------------|
| `/api/crawls` | `routes/crawlRoutes.js` | Crawl jobs beheren |
| `/api/vendors` | `routes/vendorRoutes.js` | Vendor CRUD |
| `/api/reports` | `routes/reportRoutes.js` | Rapport queries |
| `/api/health` | (inline) | Server health check |

Alle routes (behalve `/api/health`) zijn beveiligd met een JWT middleware die tokens valideert via Supabase.

### Crawl flow

```
POST /api/crawls
  └── crawlRoutes.js
        └── crawlService.js
              └── puppeteer.launch()
                    ├── puppeteer-extra-plugin-stealth   (anti-detectie)
                    ├── puppeteer-extra-plugin-adblocker (tracker blokkering)
                    └── page.goto(url)
                          ├── extractPageData()   → titels, headings, links
                          └── page.screenshot()   → base64 JPEG
              └── db.storeCrawlResult()
```

### Puppeteer configuratie

- Stealth mode aan: voorkomt detectie als headless browser
- Adblocker aan: blokkeert trackers (snellere laadtijden)
- Resources geblokkeerd: images, fonts, stylesheets (snellere crawl)
- User agent: actuele Chrome UA
- Retry logica: max 3 pogingen per URL, exponential backoff

---

## Database (Supabase / PostgreSQL)

Schema bestand: `supabase/schema.sql`

### Tabellen

```
auth.users (Supabase intern)
    │
    ├── vendors
    │     ├── crawl_jobs
    │     │     ├── crawl_results
    │     │     └── crawl_errors
    │     └── (vendor_id op crawl_results)
    │
    └── crawler_configs
```

### Tabel details

**vendors**
```sql
id, user_id, name, url, status, created_at, updated_at
```

**crawl_jobs**
```sql
id, user_id, user_email, vendor_id, urls (jsonb),
status, progress, settings (jsonb), error, created_at, completed_at
```

**crawl_results**
```sql
id, job_id, vendor_id, url, status, data (jsonb),
screenshot, crawl_duration, retry_count, created_at
```

**crawl_errors**
```sql
id, job_id, url, error, is_blocking, created_at
```

**crawler_configs**
```sql
id, user_id, user_email, name, type, options (jsonb), created_at, updated_at
```

### Row Level Security

Elke tabel heeft RLS-policies zodat gebruikers alleen hun eigen data kunnen zien en bewerken. De backend gebruikt de service role key om schrijfoperaties buiten RLS te kunnen uitvoeren.

---

## Authenticatie

- Supabase Auth (email/wachtwoord)
- JWT tokens worden door de frontend opgeslagen via Supabase JS client
- Backend valideert tokens bij elk verzoek via `supabase.auth.getUser(token)`
- Frontend stuurt token mee als `Authorization: Bearer <token>` header

---

## Development setup

```
.env                 ← lokale credentials (niet in git)
.env.template        ← template met uitleg

pnpm dev             ← frontend op :5175
node start-crawler.js ← backend op :4000

vite proxy: /api → http://localhost:4000
```
