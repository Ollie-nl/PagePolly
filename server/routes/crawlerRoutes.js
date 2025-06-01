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
    
    console.log(`Start crawler voor vendor ${vendorId} naar URLs: ${JSON.stringify(startUrls)}`);
    console.log(`Crawler instellingen: maxDepth=${maxDepth}, maxPages=${maxPages}, stealthMode=${stealthMode}`);
    
    // Start een echte crawl met puppeteerCrawlerService
    const result = await puppeteerCrawlerService.startCrawl({
      vendorId,
      userId: req.user?.id || 'anonymous',
      startUrls,
      maxDepth,
      maxPages
    });

    const sessionId = result.sessionId;
    console.log(`Crawl sessie gestart met ID: ${sessionId}`);
    
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
    
    // Haal werkelijke crawl status op
    const crawlStatus = await puppeteerCrawlerService.getCrawlStatus(sessionId);
    
    // Als de crawl niet bestaat
    if (crawlStatus.status === 'not_found') {
      return res.status(404).json({
        success: false,
        message: 'Crawl sessie niet gevonden'
      });
    }
    
    const status = { success: true, data: crawlStatus };
    res.json(status);
  } catch (error) {
    console.error('Fout bij ophalen crawl status:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden bij het ophalen van de crawl status'
    });
  }
});

// Stop een actieve crawl
router.post('/stop/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`Crawler stop route aangeroepen voor sessie: ${sessionId}`);
    
    const stopped = await puppeteerCrawlerService.stopCrawl(sessionId);
    
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
