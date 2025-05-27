// server/index.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import process from 'process';
import puppeteerCrawlRoutes from './routes/puppeteerCrawlRoutes.js';
import authMiddleware from './middleware/auth.js';
// import createScrapingBeeProxy from './middleware/scrapingBeeProxy.js';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Supabase client for auth verification
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debug middleware om alle binnenkomende verzoeken te loggen
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Log response status code wanneer het antwoord wordt verzonden
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Response status: ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// CORS configuratie
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], // Voeg alle mogelijke frontend origins toe
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Voeg request logging middleware toe
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configureer Content Security Policy headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self'"
  );
  next();
});

// Debug request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Vang errors in routes af
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[${new Date().toISOString()}] Response status: ${res.statusCode}`);
    return originalSend.apply(res, arguments);
  };
  
  // Vang ook 503 errors af
  const originalStatus = res.status;
  res.status = function(code) {
    if (code === 503) {
      console.log(`[${new Date().toISOString()}] 503 Service Unavailable voor ${req.method} ${req.url}`);
      console.trace('Stack trace voor 503 error:');
    }
    return originalStatus.apply(res, arguments);
  };
  
  next();
});

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Import mock routes
import mockRoutes from './routes/mockRoutes.js';

// Authentication middleware for all routes except test endpoints
const authenticateRequest = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Test routes for development
if (process.env.NODE_ENV === 'development') {
  app.use('/api/test', mockRoutes);
}

// Main API routes with authentication
// Tijdelijk: skip authenticatie voor ontwikkeling en voeg een test user toe
app.get('/api/crawls', (req, res) => {
  console.log('Crawls GET route aangeroepen');
  res.json({
    status: 'success',
    data: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'test-user',
        projectId: 'test-project',
        urls: ['https://example.com'],
        status: 'completed',
        progress: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/crawls/status', (req, res) => {
  console.log('Crawls status route aangeroepen');
  res.json({
    status: 'success',
    data: {
      active: 0,
      completed: 1,
      failed: 0
    }
  });
});

// Test crawl endpoint voor eenvoudige tests
app.post('/api/crawls/test', async (req, res) => {
  console.log('Test crawl route aangeroepen', req.body);
  
  // Extracteer URL en instellingen uit de request
  const { url, settings, crawlerType } = req.body;
  
  if (!url) {
    return res.status(400).json({
      status: 'error',
      message: 'URL is vereist voor een test crawl'
    });
  }
  
  try {
    // Start tijd voor duur berekening
    const startTime = Date.now();
    
    // Importeer puppeteer en gebruik StealthPlugin om detectie te voorkomen
    const puppeteer = (await import('puppeteer-extra')).default;
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
    puppeteer.use(StealthPlugin());
    
    // Launch browser met minimale instellingen
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      // Open nieuwe pagina
      const page = await browser.newPage();
      
      // Stel een timeout in
      await page.setDefaultNavigationTimeout(15000);
      
      // Navigeer naar de URL
      console.log(`Navigeren naar URL: ${url}`);
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // Verzamel basis informatie
      const statusCode = response.status();
      const headers = response.headers();
      const contentType = headers['content-type'] || 'unknown';
      
      // Haal paginatitel en meta tags op
      const title = await page.title();
      const metaTags = await page.evaluate(() => {
        const description = document.querySelector('meta[name="description"]')?.content || '';
        const keywords = document.querySelector('meta[name="keywords"]')?.content || '';
        return { description, keywords };
      });
      
      // Verzamel alle links op de pagina
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]')).map(a => ({
          url: a.href,
          text: a.textContent.trim().substring(0, 100) || 'Geen tekst'
        })).slice(0, 20); // Beperk tot 20 links
      });
      
      // Haal HTML op (beperkt tot 10000 tekens om grootte te beperken)
      const html = await page.content();
      const shortHtml = html.substring(0, 10000) + (html.length > 10000 ? '...[afgekapt]' : '');
      
      // Bereken duur
      const duration = (Date.now() - startTime) / 1000;
      
      // Stel resultaat samen
      const result = {
        id: 'test-' + Date.now(),
        url: url,
        crawlerType: crawlerType || 'puppeteer',
        timestamp: new Date().toISOString(),
        duration: duration,
        statusCode: statusCode,
        contentType: contentType,
        title: title,
        metaTags: metaTags,
        links: links,
        headers: headers,
        html: shortHtml
      };
      
      // Stuur resultaat terug
      res.json({
        status: 'success',
        data: result
      });
      
    } finally {
      // Sluit browser altijd, zelfs bij fouten
      await browser.close();
    }
    
  } catch (error) {
    console.error('Fout bij crawlen van URL:', error);
    res.status(500).json({
      status: 'error',
      message: 'Fout bij crawlen: ' + error.message
    });
  }
});

app.post('/api/crawls', async (req, res) => {
  console.log('Crawls POST route aangeroepen', req.body);
  
  let { urls, projectId, settings, crawlerType = 'puppeteer', vendorId } = req.body;
  
  // Als er een vendorId is maar geen URLs, haal de URLs op van de vendor
  if (vendorId && (!urls || !Array.isArray(urls) || urls.length === 0)) {
    try {
      console.log(`Poging tot ophalen van URL voor vendor ID: ${vendorId}`);
      
      // Ophalen van de vendor uit de database
      try {
        const { data: vendor, error } = await supabase
          .from('vendors_ohxp1d')
          .select('*')
          .eq('id', vendorId)
          .single();
        
        if (error) {
          console.error('Fout bij ophalen vendor uit database:', error);
          
          // Als de tabel niet bestaat, gebruik een standaard mapping
          const vendorUrls = {
            1: 'https://www.scrapingbee.com',
            2: 'https://pptr.dev',
            3: 'https://ferrum.audio'
          };
          
          if (vendorUrls[vendorId]) {
            urls = [vendorUrls[vendorId]];
            console.log(`Database tabel bestaat niet, gebruiken standaard URL voor vendor ${vendorId}: ${urls[0]}`);
          } else {
            return res.status(400).json({
              status: 400,
              message: `Vendor met ID ${vendorId} niet gevonden in standaard mapping. Database tabel bestaat niet.`
            });
          }
        } else if (vendor) {
          // Controleer verschillende mogelijke veldnamen voor de URL
          const vendorUrl = vendor.url || vendor.website_url || vendor.website || vendor.link;
          
          if (vendorUrl) {
            // Gebruik de URL van de vendor uit de database
            urls = [vendorUrl];
            console.log(`Gevonden website URL voor vendor ${vendorId}: ${vendorUrl}`);
          } else {
            // Vendor gevonden maar geen herkenbare URL veld
            console.log('Vendor gevonden maar geen URL veld herkend. Beschikbare velden:', Object.keys(vendor));
            return res.status(400).json({
              status: 400,
              message: `Vendor met ID ${vendorId} heeft geen geldige URL. Beschikbare velden: ${Object.keys(vendor).join(', ')}`
            });
          }
        } else {
          // Geen vendor gevonden
          return res.status(404).json({
            status: 404,
            message: `Vendor met ID ${vendorId} niet gevonden`
          });
        }
      } catch (err) {
        console.error('Algemene fout bij ophalen vendor URLs:', err);
        return res.status(500).json({
          status: 500,
          message: 'Algemene fout bij ophalen vendor URLs: ' + err.message
        });
      }
      
    } catch (err) {
      console.error('Algemene fout bij ophalen vendor URLs:', err);
      return res.status(500).json({
        status: 500,
        message: 'Algemene fout bij ophalen vendor URLs: ' + err.message
      });
    }
  }
  
  // Controleer of er nu URLs zijn
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      status: 400,
      message: 'Tenminste één URL is vereist voor een crawl'
    });
  }

  try {
    // Maak een nieuwe crawl job aan in de database
    const crawlId = 'crawl-' + Date.now();
    const userId = req.user?.id || 'test-user';
    
    let crawlJob = null;
    
    // In ontwikkelingsmodus, sla database-operaties over
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Simuleer crawl job aanmaken voor ${urls[0]}`);
      // Simuleer een database response
      crawlJob = {
        id: crawlId,
        user_id: userId,
        project_id: projectId || 'default',
        urls: urls,
        vendor_id: vendorId || null,
        status: 'running',
        progress: 0,
        crawler_type: crawlerType,
        settings: settings || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else {
      // Maak een nieuwe crawl job entry in de database
      try {
        const { data, error } = await supabase
          .from('crawl_jobs')
          .insert({
            id: crawlId,
            user_id: userId,
            project_id: projectId || 'default',
            urls: urls,
            vendor_id: vendorId || null,
            status: 'running',
            progress: 0,
            crawler_type: crawlerType,
            settings: settings || {}
          })
          .select()
          .single();
        
        if (error) {
          console.error('Fout bij aanmaken crawl job:', error);
          return res.status(500).json({
            status: 500,
            message: 'Fout bij aanmaken crawl job: ' + error.message
          });
        }
        
        crawlJob = data;
      } catch (dbError) {
        console.error('Database fout bij aanmaken crawl job:', dbError);
        return res.status(500).json({
          status: 500,
          message: 'Database fout bij aanmaken crawl job: ' + dbError.message
        });
      }
    }
    
    // Stuur direct een response terug met de job ID
    res.json({
      status: 'success',
      data: {
        id: crawlId,
        userId: userId,
        projectId: projectId || 'default',
        urls: urls,
        status: 'running',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
    
    // Start de crawl in de achtergrond
    processCrawl(crawlId, urls, settings, crawlerType).catch(err => {
      console.error(`Fout bij verwerken van crawl ${crawlId}:`, err);
      // Update job status naar failed
      updateCrawlJobStatus(crawlId, 'failed', 0);
    });
    
  } catch (error) {
    console.error('Fout bij verwerken crawl request:', error);
    res.status(500).json({
      status: 500,
      message: 'Fout bij verwerken crawl request: ' + error.message
    });
  }
});

// Functie om crawl job status bij te werken
async function updateCrawlJobStatus(crawlId, status, progress) {
  try {
    // In ontwikkelingsmodus, sla database-operaties over
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Simuleer status update voor crawl ${crawlId}: status=${status}, progress=${progress}`);
      return;
    }
    
    const { error } = await supabase
      .from('crawl_jobs')
      .update({
        status: status,
        progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', crawlId);
    
    if (error) {
      console.error(`Fout bij updaten status van crawl ${crawlId}:`, error);
    }
  } catch (err) {
    console.error(`Fout bij updaten status van crawl ${crawlId}:`, err);
  }
}

// Functie om crawl resultaat op te slaan
async function saveCrawlResult(crawlId, pageData) {
  try {
    // In ontwikkelingsmodus, sla database-operaties over
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Simuleer opslaan resultaat voor crawl ${crawlId}, URL: ${pageData.url}`);
      return;
    }
    
    const { error } = await supabase
      .from('crawl_results')
      .insert({
        crawl_id: crawlId,
        url: pageData.url,
        title: pageData.title,
        status_code: pageData.statusCode,
        content_type: pageData.contentType,
        meta_tags: pageData.metaTags,
        links: pageData.links,
        headers: pageData.headers,
        html: pageData.html,
        crawled_at: pageData.timestamp
      });
    
    if (error) {
      console.error(`Fout bij opslaan resultaat voor crawl ${crawlId}:`, error);
    }
  } catch (err) {
    console.error(`Fout bij opslaan resultaat voor crawl ${crawlId}:`, err);
  }
}

// Functie om de crawl uit te voeren
async function processCrawl(crawlId, urls, settings, crawlerType) {
  console.log(`Start crawl proces voor job ${crawlId} met ${urls.length} start-URLs`);
  
  // Importeer puppeteer en gebruik StealthPlugin om detectie te voorkomen
  const puppeteer = (await import('puppeteer-extra')).default;
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
  puppeteer.use(StealthPlugin());
  
  // Launch browser met minimale instellingen
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const startUrl = urls[0]; // Begin met de eerste URL
    const crawledUrls = new Set(); // Houdt bij welke URLs al zijn gecrawld
    const urlsToCrawl = [startUrl]; // Queue van URLs om te crawlen
    let totalPagesCrawled = 0;
    const MAX_PAGES = 3; // Maximaal 3 pagina's crawlen
    
    // Zolang er URLs zijn om te crawlen en we het maximum niet hebben bereikt
    while (urlsToCrawl.length > 0 && totalPagesCrawled < MAX_PAGES) {
      const url = urlsToCrawl.shift();
      
      // Als deze URL al is gecrawld, sla over
      if (crawledUrls.has(url)) {
        continue;
      }
      
      crawledUrls.add(url);
      totalPagesCrawled++;
      
      console.log(`Crawlen van pagina ${totalPagesCrawled}/${MAX_PAGES}: ${url}`);
      
      // Update voortgang
      const progress = Math.floor((totalPagesCrawled / MAX_PAGES) * 100);
      await updateCrawlJobStatus(crawlId, 'running', progress);
      
      // Crawl de pagina
      const pageData = await crawlPage(browser, url);
      
      // Sla het resultaat op
      await saveCrawlResult(crawlId, pageData);
      
      // Voeg gelinkte URLs toe aan de queue
      if (pageData.links && totalPagesCrawled < MAX_PAGES) {
        for (const link of pageData.links) {
          // Voeg alleen URLs toe van hetzelfde domein
          try {
            const linkUrl = new URL(link.url);
            const startUrlObj = new URL(startUrl);
            
            if (linkUrl.hostname === startUrlObj.hostname && !crawledUrls.has(link.url)) {
              urlsToCrawl.push(link.url);
            }
          } catch (err) {
            // Ongeldige URL, negeren
            console.warn(`Ongeldige URL gevonden: ${link.url}`);
          }
        }
      }
    }
    
    // Update status naar voltooid
    await updateCrawlJobStatus(crawlId, 'completed', 100);
    console.log(`Crawl ${crawlId} voltooid. ${totalPagesCrawled} pagina's verwerkt.`);
    
  } finally {
    // Sluit browser altijd, zelfs bij fouten
    await browser.close();
  }
}

// Functie om een enkele pagina te crawlen
async function crawlPage(browser, url) {
  const startTime = Date.now();
  
  // Open nieuwe pagina
  const page = await browser.newPage();
  
  try {
    // Stel een timeout in
    await page.setDefaultNavigationTimeout(15000);
    
    // Navigeer naar de URL
    console.log(`Navigeren naar URL: ${url}`);
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Verzamel basis informatie
    const statusCode = response.status();
    const headers = response.headers();
    const contentType = headers['content-type'] || 'unknown';
    
    // Haal paginatitel en meta tags op
    const title = await page.title();
    const metaTags = await page.evaluate(() => {
      const description = document.querySelector('meta[name="description"]')?.content || '';
      const keywords = document.querySelector('meta[name="keywords"]')?.content || '';
      return { description, keywords };
    });
    
    // Verzamel alle links op de pagina
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => ({
        url: a.href,
        text: a.textContent.trim().substring(0, 100) || 'Geen tekst'
      }));
    });
    
    // Haal HTML op (beperkt tot 10000 tekens om grootte te beperken)
    const html = await page.content();
    const shortHtml = html.substring(0, 10000) + (html.length > 10000 ? '...[afgekapt]' : '');
    
    // Bereken duur
    const duration = (Date.now() - startTime) / 1000;
    
    // Stel resultaat samen
    return {
      url: url,
      timestamp: new Date().toISOString(),
      duration: duration,
      statusCode: statusCode,
      contentType: contentType,
      title: title,
      metaTags: metaTags,
      links: links,
      headers: headers,
      html: shortHtml
    };
  } finally {
    // Sluit de pagina
    await page.close();
  }
}

app.get('/api/crawls/:jobId', (req, res) => {
  console.log(`Crawls job ${req.params.jobId} route aangeroepen`);
  res.json({
    status: 'success',
    data: {
      id: req.params.jobId,
      userId: 'test-user',
      projectId: 'test-project',
      urls: ['https://example.com'],
      status: 'completed',
      progress: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      results: [
        {
          url: 'https://example.com',
          title: 'Example Domain',
          statusCode: 200,
          contentType: 'text/html',
          headers: {
            'content-type': 'text/html; charset=UTF-8'
          },
          body: '<html><body><h1>Example Domain</h1></body></html>'
        }
      ]
    }
  });
});

app.get('/api/crawls/:jobId/results', (req, res) => {
  console.log(`Crawls job ${req.params.jobId} results route aangeroepen`);
  res.json({
    status: 'success',
    data: [
      {
        url: 'https://example.com',
        title: 'Example Domain',
        statusCode: 200,
        contentType: 'text/html',
        headers: {
          'content-type': 'text/html; charset=UTF-8'
        },
        body: '<html><body><h1>Example Domain</h1></body></html>'
      }
    ]
  });
});

// Behoud de test-crawls endpoints voor compatibiliteit
app.get('/api/test-crawls', (req, res) => {
  console.log('Test crawls route aangeroepen');
  res.json({
    status: 'success',
    data: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'test-user',
        projectId: 'test-project',
        urls: ['https://example.com'],
        status: 'completed',
        progress: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/test-crawls/status', (req, res) => {
  console.log('Test crawls status route aangeroepen');
  res.json({
    status: 'success',
    data: {
      active: 0,
      completed: 1,
      failed: 0
    }
  });
});

app.post('/api/test-crawls', (req, res) => {
  console.log('Test crawls POST route aangeroepen', req.body);
  res.json({
    status: 'success',
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'test-user',
      projectId: req.body.projectId || 'test-project',
      urls: req.body.urls || ['https://example.com'],
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

app.get('/api/test-crawls/:jobId', (req, res) => {
  console.log(`Test crawls job ${req.params.jobId} route aangeroepen`);
  res.json({
    status: 'success',
    data: {
      id: req.params.jobId,
      userId: 'test-user',
      projectId: 'test-project',
      urls: ['https://example.com'],
      status: 'completed',
      progress: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      results: [
        {
          url: 'https://example.com',
          title: 'Example Domain',
          statusCode: 200,
          contentType: 'text/html',
          headers: {
            'content-type': 'text/html; charset=UTF-8'
          },
          body: '<html><body><h1>Example Domain</h1></body></html>'
        }
      ]
    }
  });
});

app.get('/api/test-crawls/:jobId/results', (req, res) => {
  console.log(`Test crawls job ${req.params.jobId} results route aangeroepen`);
  res.json({
    status: 'success',
    data: [
      {
        url: 'https://example.com',
        title: 'Example Domain',
        statusCode: 200,
        contentType: 'text/html',
        headers: {
          'content-type': 'text/html; charset=UTF-8'
        },
        body: '<html><body><h1>Example Domain</h1></body></html>'
      }
    ]
  });
});

// Vendors endpoints (meervoud)
app.get('/api/vendors', async (req, res) => {
  console.log('Vendors endpoint aangeroepen');
  
  try {
    // Haal vendors op uit de database
    const { data: vendors, error } = await supabase
      .from('vendors_ohxp1d')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Fout bij ophalen vendors:', error);
      return res.status(500).json({
        status: 500,
        message: 'Fout bij ophalen vendors: ' + error.message
      });
    }
    
    res.json({
      status: 'success',
      data: vendors || []
    });
  } catch (err) {
    console.error('Algemene fout bij ophalen vendors:', err);
    res.status(500).json({
      status: 500,
      message: 'Algemene fout bij ophalen vendors: ' + err.message
    });
  }
});

// Endpoint om een vendor toe te voegen
app.post('/api/vendors', async (req, res) => {
  console.log('Vendor toevoegen endpoint aangeroepen', req.body);
  
  const { name, url, description } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({
      status: 400,
      message: 'Naam en URL zijn verplicht voor een vendor'
    });
  }
  
  try {
    // Voeg vendor toe aan de database
    const { data, error } = await supabase
      .from('vendors_ohxp1d')
      .insert({
        name,
        url,
        description: description || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Fout bij toevoegen vendor:', error);
      return res.status(500).json({
        status: 500,
        message: 'Fout bij toevoegen vendor: ' + error.message
      });
    }
    
    res.json({
      status: 'success',
      data
    });
  } catch (err) {
    console.error('Algemene fout bij toevoegen vendor:', err);
    res.status(500).json({
      status: 500,
      message: 'Algemene fout bij toevoegen vendor: ' + err.message
    });
  }
});

// Endpoint om een vendor te verwijderen
app.delete('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Vendor verwijderen endpoint aangeroepen voor ID: ${id}`);
  
  try {
    // Verwijder vendor uit de database
    const { error } = await supabase
      .from('vendors_ohxp1d')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Fout bij verwijderen vendor ${id}:`, error);
      return res.status(500).json({
        status: 500,
        message: 'Fout bij verwijderen vendor: ' + error.message
      });
    }
    
    res.json({
      status: 'success',
      message: `Vendor ${id} succesvol verwijderd`
    });
  } catch (err) {
    console.error(`Algemene fout bij verwijderen vendor ${id}:`, err);
    res.status(500).json({
      status: 500,
      message: 'Algemene fout bij verwijderen vendor: ' + err.message
    });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Debugroute: catch alle 404-fouten en toon debug informatie
app.use('*', (req, res) => {
  console.log(`[DEBUG] 404 voor pad: ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route niet gevonden',
    path: req.originalUrl,
    method: req.method,
    suggestie: 'Controleer het pad en de methode van de aanvraag. Mogelijk wordt er een verkeerd basispad gebruikt.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`PagePolly server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

export default app;