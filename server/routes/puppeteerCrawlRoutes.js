// server/routes/crawlerRoutes.js
import express from 'express';
import puppeteerCrawlerService from '../services/puppeteer/puppeteerCrawlerService.js';

const router = express.Router();

// Start een nieuwe crawl
router.post('/start', async (req, res) => {
  try {
    console.log('Crawler start route aangeroepen met:', req.body);
    const { vendorId, startUrls, maxDepth = 5, maxPages = 100, stealthMode = true } = req.body;
    
    if (!vendorId || !startUrls || startUrls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vendor ID en start URLs zijn vereist' 
      });
    }
    
    console.log(`Start echte crawl met vendorId: ${vendorId}, startUrls:`, startUrls);
    
    // Start de echte crawl via de service
    const result = await puppeteerCrawlerService.startCrawl({
      vendorId,
      userId: req.user?.id || 'anonymous',
      startUrls,
      maxDepth,
      maxPages,
      stealthMode
    });
    
    const sessionId = result.id;
    console.log(`Crawl gestart met sessie ID: ${sessionId}`);
    
    res.json({ 
      success: true, 
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Fout bij starten van crawl:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Er is een fout opgetreden bij het starten van de crawl'
    });
  }
});

// Haal de status van een crawl op
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`Crawler status route aangeroepen voor sessie: ${sessionId}`);
    
    // Voor testen, simuleer een status
    // TODO: Vervang met echte functionaliteit
    const status = {
      success: true,
      data: {
        status: 'running',
        progress: Math.floor(Math.random() * 100), // Willekeurige voortgang voor testen
        pagesCrawled: Math.floor(Math.random() * 20),
        currentDepth: 2,
        results: [
          {
            url: 'https://example.com',
            title: 'Voorbeeld pagina',
            status: 'success'
          },
          {
            url: 'https://example.com/about',
            title: 'Over ons',
            status: 'success'
          }
        ]
      }
    };
    
    // Als je de echte service wilt gebruiken, uncomment deze regel:
    // const crawlStatus = await puppeteerCrawlerService.getCrawlStatus(sessionId);
    // const status = { success: true, data: crawlStatus };
    
    res.json(status);
  } catch (error) {
    console.error('Fout bij ophalen crawl status:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het ophalen van de crawl status'
    });
  }
});

// Haal alle actieve crawl jobs op
router.get('/active', async (req, res) => {
  try {
    console.log('Crawls job active route aangeroepen');
    
    // Controleer of de service en de methode bestaan
    if (!puppeteerCrawlerService || typeof puppeteerCrawlerService.getActiveCrawls !== 'function') {
      console.error('puppeteerCrawlerService.getActiveCrawls is niet beschikbaar');
      return res.status(500).json({
        success: false,
        message: 'Interne serverfout: Crawler service niet beschikbaar'
      });
    }
    
    // Haal actieve crawls op via de service
    const activeCrawls = await puppeteerCrawlerService.getActiveCrawls();
    console.log(`${activeCrawls.length} actieve crawl jobs gevonden`);
    
    // Extra debug info over de gevonden crawls
    if (activeCrawls.length === 0) {
      console.log('Geen actieve crawls gevonden. Status van crawlerService:',
        puppeteerCrawlerService.activeCrawls.size, 'crawls in Map');
    } else {
      activeCrawls.forEach(crawl => {
        console.log(`Crawl job info - ID: ${crawl.sessionId}, Status: ${crawl.status}, Pagina's: ${crawl.pagesCrawled}`);
      });
    }
    
    // Zorg ervoor dat we altijd een array hebben, zelfs als de service null of undefined teruggeeft
    const safeActiveCrawls = Array.isArray(activeCrawls) ? activeCrawls : [];
    
    // Sanitize the crawl data for JSON response
    const sanitizedCrawls = safeActiveCrawls.map(crawl => {
      try {
        // Maak een kopie van het crawl object om te voorkomen dat we het origineel wijzigen
        const sanitizedCrawl = JSON.parse(JSON.stringify(crawl, (key, value) => {
          // Converteer Date objecten naar ISO strings
          if (value instanceof Date) {
            return value.toISOString();
          }
          // Converteer Set objecten naar arrays
          if (value instanceof Set) {
            return Array.from(value);
          }
          return value;
        }));
        
        return sanitizedCrawl;
      } catch (error) {
        console.error(`Fout bij sanitizen van crawl ${crawl.sessionId}:`, error);
        return {};
      }
    });

    console.log('Verzenden van respons naar client:', JSON.stringify(sanitizedCrawls, null, 2).substring(0, 500) + '...');
    
    // Verstuur het resultaat als JSON
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      data: sanitizedCrawls
    });
  } catch (error) {
    console.error('Fout bij ophalen van actieve crawl jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het ophalen van actieve crawl jobs',
      error: error.message
    });
  }
});

// Stop een actieve crawl
router.post('/stop/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`Crawler stop route aangeroepen voor sessie: ${sessionId}`);
    
    // Controleer of de service en de methode bestaan
    if (!puppeteerCrawlerService || typeof puppeteerCrawlerService.stopCrawl !== 'function') {
      return res.status(500).json({
        success: false,
        message: 'Interne serverfout: Crawler service niet beschikbaar'
      });
    }
    
    // Stop de crawl via de service
    await puppeteerCrawlerService.stopCrawl(sessionId);
    
    res.json({
      success: true,
      message: `Crawl ${sessionId} is gestopt`
    });
  } catch (error) {
    console.error('Fout bij stoppen van crawl:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het stoppen van de crawl',
      error: error.message
    });
  }
});

// Start een test crawl voor debugging (alleen in development)
router.post('/test-crawl', async (req, res) => {
  try {
    console.log('Test crawl route aangeroepen');
    
    // Controleer of de service en de methode bestaan
    if (!puppeteerCrawlerService || typeof puppeteerCrawlerService.addTestCrawl !== 'function') {
      console.error('puppeteerCrawlerService.addTestCrawl is niet beschikbaar');
      return res.status(500).json({
        success: false,
        message: 'Interne serverfout: Test crawl functie niet beschikbaar'
      });
    }
    
    // Maak een test crawl aan die 30 seconden actief blijft
    const sessionId = puppeteerCrawlerService.addTestCrawl();
    
    res.json({
      success: true,
      message: 'Test crawl gestart',
      data: { sessionId }
    });
  } catch (error) {
    console.error('Fout bij starten van test crawl:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het starten van de test crawl',
      error: error.message
    });
  }
});

export default router;