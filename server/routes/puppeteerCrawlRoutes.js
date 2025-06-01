// server/routes/crawlerRoutes.js
import express from 'express';
import puppeteerCrawlerService from '../services/puppeteer/puppeteerCrawlerService.js';

const router = express.Router();

// Start een nieuwe crawl
router.post('/start', async (req, res) => {
  try {
    console.log('Crawler start route aangeroepen met:', req.body);
    const { vendorId, startUrls, maxDepth = 2, maxPages = 50, stealthMode = true } = req.body;
    
    if (!vendorId || !startUrls || startUrls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vendor ID en start URLs zijn vereist' 
      });
    }
    
    // Voor testen, simuleer een succesvolle start
    // TODO: Vervang met echte functionaliteit
    const sessionId = `test-${Date.now()}`;
    console.log(`Simuleer start crawl met sessie ID: ${sessionId}`);
    
    // Als je de echte service wilt gebruiken, uncomment deze regel:
    // const result = await puppeteerCrawlerService.startCrawl({
    //   vendorId,
    //   userId: req.user?.id || 'anonymous',
    //   startUrls,
    //   maxDepth,
    //   maxPages
    // });
    // const sessionId = result.sessionId;
    
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
    console.log('Ophalen van actieve crawl jobs');
    
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
    
    // Zorg ervoor dat we altijd een array hebben, zelfs als de service null of undefined teruggeeft
    const safeActiveCrawls = Array.isArray(activeCrawls) ? activeCrawls : [];
    
    // Controleer of elke entry in de array een geldig object is
    const sanitizedCrawls = safeActiveCrawls.map(crawl => {
      // Als crawl geen object is, return een leeg object
      if (!crawl || typeof crawl !== 'object') {
        console.warn('Ongeldige crawl data gevonden:', crawl);
        return {};
      }
      
      try {
        // Zorg ervoor dat alle date objecten als strings worden weergegeven
        const sanitized = { ...crawl };
        if (sanitized.startTime instanceof Date) {
          sanitized.startTime = sanitized.startTime.toISOString();
        }
        
        // Converteer Set objecten naar arrays
        if (sanitized.recentUrls && sanitized.recentUrls instanceof Set) {
          sanitized.recentUrls = Array.from(sanitized.recentUrls);
        }
        
        return sanitized;
      } catch (err) {
        console.error('Fout bij sanitizen van crawl data:', err);
        return {};
      }
    });
    
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
    
    // Voor testen, simuleer een succesvolle stop
    // TODO: Vervang met echte functionaliteit
    const stopped = true;
    
    // Als je de echte service wilt gebruiken, uncomment deze regel:
    // const stopped = await puppeteerCrawlerService.stopCrawl(sessionId);
    
    if (!stopped) {
      return res.status(404).json({ 
        success: false, 
        message: 'Crawl sessie niet gevonden of reeds gestopt' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Crawl is gestopt' 
    });
  } catch (error) {
    console.error('Fout bij stoppen van crawl:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het stoppen van de crawl'
    });
  }
});

export default router;