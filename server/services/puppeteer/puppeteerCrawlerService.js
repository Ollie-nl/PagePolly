// server/services/puppeteer/puppeteerCrawlerService.js
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { v4 as uuidv4 } from 'uuid';
import db from '../../config/db.js';
import puppeteerManager from './puppeteerManager.js';

// Add plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

class PuppeteerCrawlerService {
  constructor(puppeteerManager) {
    this.puppeteerManager = puppeteerManager;
    this.activeCrawls = new Map(); // Toegevoegd voor het bijhouden van actieve crawls
  }

  /**
   * Start een nieuwe crawl sessie
   * @param {Object} options - Crawl opties
   * @param {string} options.vendorId - ID van de vendor
   * @param {string} options.userId - ID van de gebruiker
   * @param {Array<string>} options.startUrls - Start URL(s) om te crawlen
   * @param {number} [options.maxDepth=2] - Maximale diepte van het crawlen
   * @param {number} [options.maxPages=50] - Maximaal aantal te crawlen pagina's
   * @returns {Promise<Object>} Crawl sessie informatie
   */
  async startCrawl({ vendorId, userId, startUrls, maxDepth = 2, maxPages = 50 }) {
    const sessionId = uuidv4();
    const crawlState = {
      id: sessionId,
      vendorId,
      userId,
      status: 'pending',
      progress: 0,
      pagesCrawled: 0,
      totalPages: 0,
      currentDepth: 0,
      maxDepth,
      maxPages,
      visitedUrls: new Set(),
      results: [],
      errors: [],
      startTime: new Date(),
      settings: { maxDepth, maxPages },
      startUrls: startUrls // Voeg startUrls toe aan de crawlState
    };

    this.activeCrawls.set(sessionId, crawlState);

    console.log(`Start crawl proces voor job ${sessionId} met ${startUrls.length} start-URLs`);
    
    // Start direct de echte crawl, ongeacht development mode
    try {
      this._startCrawlProcess(sessionId, startUrls, { vendorId, userId, maxDepth, maxPages });
    } catch (error) {
      console.error(`Fout bij verwerken van crawl ${sessionId}:`, error);
      // Update status naar failed bij error
      const state = this.activeCrawls.get(sessionId);
      if (state) {
        state.status = 'failed';
        state.error = error.message || 'Onbekende fout bij starten crawl';
      }
    }

    return {
      sessionId,
      status: 'started'
    };
  }

  /**
   * Start het echte crawl proces met Puppeteer
   * @param {string} sessionId - ID van de crawl sessie
   * @param {Array<string>} startUrls - Begin URL's voor de crawl
   * @param {Object} options - Crawl opties
   * @private
   */
  async _startCrawlProcess(sessionId, startUrls, options = {}) {
    const { 
      vendorId, 
      userId, 
      maxDepth = 2,
      maxPages = 50,
      stealthMode = true,
      settings = {} 
    } = options;
    
    const crawlState = this.activeCrawls.get(sessionId);
    if (!crawlState) {
      throw new Error(`Geen crawl gevonden met sessionId: ${sessionId}`);
    }
    
    // Update browser configuratie op basis van instellingen
    const browserSettings = {
      headless: true, // Standaard headless (onzichtbaar)
      stealthMode: stealthMode,
      ...settings
    };
    
    // Alleen voor debug doeleinden tijdens development
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_BROWSER === 'true') {
      browserSettings.headless = false;
    }
    
    console.log(`Crawl gestart via service: ${sessionId}`);
    
    // Update browser configuratie voordat de crawl start
    this.puppeteerManager.updateBrowserConfig(browserSettings);

    // Update crawl status
    crawlState.status = 'running';
    this._updateProgress(sessionId);
    
    // Start de crawl in de achtergrond
    try {
      // Verwerk alle start URLs
      for (const url of startUrls) {
        if (crawlState.status === 'stopped') break;
        await this._performCrawl(sessionId, url, 0);
      }
      
      // Markeer als voltooid als alle start URLs zijn verwerkt
      await this._completeCrawl(sessionId);
    } catch (error) {
      console.error('Crawl error:', error);
      crawlState.status = 'failed';
      crawlState.error = error.message;
      this._updateProgress(sessionId);
    }
  }

  async _performCrawl(sessionId, url, currentDepth = 0) {
    const crawlState = this.activeCrawls.get(sessionId);
    if (!crawlState || crawlState.status === 'stopped') return;
    
    // Controleer of we al teveel pagina's hebben gecrawled
    if (crawlState.pagesCrawled >= crawlState.maxPages) {
      await this._completeCrawl(sessionId);
      return;
    }
    
    // Controleer of we deze URL al hebben bezocht
    if (crawlState.visitedUrls.has(url)) return;
    
    // Voeg de URL toe aan bezochte URLs
    crawlState.visitedUrls.add(url);
    crawlState.currentDepth = currentDepth;

    try {
      // Gebruik de verbeterde getNewPage functie uit puppeteerManager voor betere headers
      const page = await this.puppeteerManager.getNewPage();
      if (!page) {
        throw new Error('Kon geen pagina openen');
      }

      console.log(`[${sessionId}] Bezoeken van URL: ${url} (diepte: ${currentDepth})`);
      crawlState.status = `Crawling ${url} (diepte: ${currentDepth})`;
      crawlState.pagesCrawled++;
      this._updateProgress(sessionId);

      // Navigeer naar de URL
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Haal pagina-informatie op
      const title = await page.title();
      const content = await page.content();

      // Verzamel resultaat
      const pageData = {
        url,
        title,
        content,
        depth: currentDepth,
        timestamp: new Date().toISOString(),
        status: 'success'
      };

      crawlState.results.push(pageData);

      // Verzamel links voor verdere crawling
      const links = await this._collectLinks(page, url);
      console.log(`[${sessionId}] Gevonden links op ${url}: ${links.length}`);

      // Sluit de pagina om geheugen vrij te maken
      await page.close();

      // Verwerk de gevonden links (alleen als we niet de maximale diepte hebben bereikt)
      if (currentDepth < crawlState.maxDepth) {
        for (const link of links) {
          if (crawlState.status === 'stopped') break;
          if (crawlState.pagesCrawled >= crawlState.maxPages) break;
          if (!crawlState.visitedUrls.has(link)) {
            await this._performCrawl(sessionId, link, currentDepth + 1);
          }
        }
      }
    } catch (error) {
      console.error(`[${sessionId}] Error crawling ${url}: ${error.message}`);
      
      // Registreer de fout in crawl state
      crawlState.errors.push({
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Als dit een start-URL is, markeer de crawl als mislukt
      if (currentDepth === 0 && crawlState.startUrls.includes(url)) {
        crawlState.status = 'failed';
        crawlState.error = `Kon start-URL niet crawlen: ${error.message}`;
        this._updateProgress(sessionId);
      }
    }
  }

  async _collectLinks(page, baseUrl) {
    try {
      return await page.$$eval('a', (as, base) => {
        const baseUrl = new URL(base);
        const links = [];
        
        for (const a of as) {
          try {
            // Haal href attribuut op
            const href = a.getAttribute('href');
            if (!href) continue;
            
            // Negeer javascript: en mailto: links
            if (href.startsWith('javascript:') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:') ||
                href.startsWith('#')) {
              continue;
            }
            
            // Converteer relatieve naar absolute URL's
            let fullUrl;
            try {
              fullUrl = new URL(href, base);
            } catch (e) {
              // Ongeldige URL
              continue;
            }
            
            // Alleen URL's van hetzelfde domein volgen
            if (fullUrl.hostname === baseUrl.hostname) {
              // Normaliseer URL (verwijder hash, standaardiseer pad)
              fullUrl.hash = '';
              let normalized = fullUrl.toString();
              
              // Verwijder trailing slash voor consistentie
              if (normalized.endsWith('/') && normalized.length > baseUrl.origin.length + 1) {
                normalized = normalized.slice(0, -1);
              }
              
              links.push(normalized);
            }
          } catch (e) {
            // Skip problematische links
            continue;
          }
        }
        
        // Return unieke links
        return [...new Set(links)];
      }, baseUrl);
    } catch (error) {
      console.error(`Fout bij verzamelen links: ${error.message}`);
      return []; // Return lege array bij fout
    }
  }

  _updateProgress(sessionId) {
    const crawlState = this.activeCrawls.get(sessionId);
    if (!crawlState) return;

    const progress = Math.min(
      Math.round((crawlState.pagesCrawled / crawlState.maxPages) * 100),
      100
    );
    crawlState.progress = progress;
    // Hier kun je een event emitter of database update toevoegen
  }

  _handleCrawlError(sessionId, url, error) {
    const crawlState = this.activeCrawls.get(sessionId);
    if (!crawlState) return;

    const errorData = {
      url,
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    crawlState.errors.push(errorData);

    this._updateProgress(sessionId);
  }

  async _completeCrawl(sessionId) {
    const crawlState = this.activeCrawls.get(sessionId);
    if (!crawlState) return;

    crawlState.status = 'completed';
    crawlState.endTime = new Date();
    crawlState.progress = 100;
    crawlState.duration = (crawlState.endTime - crawlState.startTime) / 1000;
    
    console.log(`[${sessionId}] Crawl completed in ${crawlState.duration} seconds`);
    console.log(`[${sessionId}] Pages crawled: ${crawlState.pagesCrawled}`);
    console.log(`[${sessionId}] Errors: ${crawlState.errors.length}`);

    // Hier kun je de resultaten opslaan in de database
    // await this._saveCrawlResults(crawlState);
  }

  async getCrawlStatus(sessionId) {
    return this.activeCrawls.get(sessionId) || { status: 'not_found' };
  }

  /**
   * Haalt alle actieve crawl jobs op met gedetailleerde informatie
   * @returns {Array} Array met alle actieve crawl jobs en hun status
   */
  async getActiveCrawls() {
    const activeCrawls = [];
    
    // Converteer de Map naar een array met gedetailleerde informatie
    for (const [sessionId, crawlState] of this.activeCrawls.entries()) {
      // Skip voltooide of mislukte crawls
      if (crawlState.status === 'completed' || crawlState.status === 'failed') {
        continue;
      }
      
      // Bereken de duur van de huidige crawl
      const currentDuration = Math.round((new Date() - crawlState.startTime) / 1000);
      
      // Verzamel de top 5 meest recent bezochte URLs
      const recentUrls = Array.from(crawlState.visitedUrls).slice(-5).reverse();
      
      // Bereken gemiddelde verwerkingstijd per pagina, indien beschikbaar
      const avgProcessingTime = crawlState.pagesCrawled > 0 
        ? currentDuration / crawlState.pagesCrawled 
        : 0;
      
      activeCrawls.push({
        sessionId,
        vendorId: crawlState.vendorId,
        userId: crawlState.userId,
        status: crawlState.status,
        progress: crawlState.progress || 0,
        startTime: crawlState.startTime,
        pagesCrawled: crawlState.pagesCrawled || 0,
        maxPages: crawlState.maxPages,
        currentDepth: crawlState.currentDepth || 0,
        maxDepth: crawlState.maxDepth,
        errors: crawlState.errors.length,
        // Extra interessante informatie
        duration: currentDuration,
        avgProcessingTime: avgProcessingTime.toFixed(2),
        recentUrls,
        currentUrl: crawlState.currentUrl || null,
        // Voeg start URLs en stealth mode toe
        startUrls: crawlState.startUrls || [],
        stealthMode: crawlState.stealthMode || false,
        // Statistieken over gevonden content
        statistics: {
          totalLinks: crawlState.stats?.totalLinks || 0,
          uniqueLinks: crawlState.stats?.uniqueLinks || 0,
          internalLinks: crawlState.stats?.internalLinks || 0,
          externalLinks: crawlState.stats?.externalLinks || 0
        }
      });
    }
    
    return activeCrawls;
  }

  async stopCrawl(sessionId) {
    const crawlState = this.activeCrawls.get(sessionId);
    if (crawlState) {
      crawlState.status = 'stopped';
      return true;
    }
    return false;
  }

  /**
   * Start een crawl job (backwards compatibility method)
   * @param {string} userId - ID van gebruiker
   * @param {string} vendorId - ID van vendor
   * @param {Array<string>} urls - URLs te crawlen
   * @param {Object} settings - Crawl instellingen
   * @returns {Promise<Object>} Crawl resultaat
   */
  async startCrawlJob(userId, vendorId, urls, settings = {}) {
    console.log('Crawl job aanmaken voor', urls[0]);

    // Zorg ervoor dat de urls in array formaat zijn
    const startUrls = Array.isArray(urls) ? urls : [urls];
    
    // Instellingen normaliseren voor puppeteerManager configuratie
    const crawlSettings = {
      maxDepth: settings.maxDepth || 2,
      maxPages: settings.maxPages || 50,
      stealthMode: settings.stealthMode !== false,
      headless: true, // Standaard headless (geen zichtbare browser)
      waitTime: settings.waitTime || 0
    };
    
    // Start de crawl met de juiste parameters
    return this.startCrawl({
      userId,
      vendorId,
      startUrls,
      maxDepth: crawlSettings.maxDepth,
      maxPages: crawlSettings.maxPages,
      stealthMode: crawlSettings.stealthMode,
      settings: crawlSettings
    });
  }
}

// Creëer en exporteer een instantie met puppeteerManager
const puppeteerCrawlerService = new PuppeteerCrawlerService(puppeteerManager);
export default puppeteerCrawlerService;