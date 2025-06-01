// server/services/puppeteer/puppeteerManager.js
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

// Registreer de stealth plugin (dit verbergt automatisatie voor websites)
puppeteer.use(StealthPlugin());

class PuppeteerManager {
  constructor() {
    this.browser = null;
    this.isLaunching = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.pageWaitTime = 0;
    
    // Chrome executable padden voor verschillende besturingssystemen
    this.chromePaths = {
      darwin: [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        '/Applications/Chromium.app/Contents/MacOS/Chromium'
      ],
      linux: [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
      ],
      win32: [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      ]
    };
    
    // Basisinstellingen voor de browser
    this.browserConfig = {
      headless: true, // Standaard in headless mode (onzichtbaar)
      ignoreHTTPSErrors: true,
      timeout: 30000,
      protocolTimeout: 30000,
      waitForInitialPage: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--window-size=1280,720'
      ]
    };
    
    // Zoek het Chrome executable pad voor het huidige OS
    this.findChromePath();
  }
  
  // Zoek het Chrome executable pad
  findChromePath() {
    const platform = process.platform;
    const paths = this.chromePaths[platform] || [];
    
    for (const path of paths) {
      if (fs.existsSync(path)) {
        this.browserConfig.executablePath = path;
        console.log(`Chrome executable gevonden op: ${path}`);
        return;
      }
    }
    
    console.log('Geen Chrome executable gevonden, val terug op standaard browser');
  }

  /**
   * Update de browser configuratie op basis van crawl instellingen
   * @param {Object} settings - Crawl instellingen 
   */
  updateBrowserConfig(settings = {}) {
    if (settings) {
      // Update headless modus (default: true - onzichtbaar)
      if (settings.headless !== undefined) {
        this.browserConfig.headless = !!settings.headless;
      }
      
      // Stealth modus
      if (settings.stealthMode !== undefined) {
        // StealthPlugin is al geregistreerd, dit is voor extra stealth instellingen
        if (settings.stealthMode) {
          this.browserConfig.args.push('--disable-blink-features=AutomationControlled');
        }
      }
      
      // Wachttijd tussen pagina acties
      if (settings.waitTime !== undefined && typeof settings.waitTime === 'number') {
        this.pageWaitTime = settings.waitTime;
      }
      
      // Browser venster afmetingen
      if (settings.viewport) {
        const { width, height } = settings.viewport;
        if (width && height) {
          this.browserConfig.args = this.browserConfig.args.filter(arg => !arg.startsWith('--window-size'));
          this.browserConfig.args.push(`--window-size=${width},${height}`);
        }
      }
      
      console.log('Browser configuratie bijgewerkt:', JSON.stringify(this.browserConfig, null, 2));
    }
    
    // Reset browser om nieuwe configuratie toe te passen
    this.closeBrowser();
  }

  /**
   * Haalt een browser instance op, start er indien nodig een nieuwe
   * @returns {Promise<Browser>} Puppeteer browser instance
   */
  async getBrowser() {
    // Controleer of we al een actieve browser hebben
    if (this.browser) {
      try {
        const pages = await this.browser.pages();
        return this.browser;
      } catch (error) {
        console.log('Bestaande browser is niet meer beschikbaar:', error.message);
        this.browser = null;
      }
    }
    
    // Voorkom dat meerdere launches tegelijk starten
    if (this.isLaunching) {
      console.log('Browser launch al bezig, even wachten...');
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (this.browser) {
          return this.browser;
        }
      }
      throw new Error('Timeout bij wachten op browser launch');
    }
    
    try {
      this.isLaunching = true;
      
      // Start een nieuwe browser
      console.log('Starten van een nieuwe browser instance...');
      console.log('Browser configuratie:', JSON.stringify(this.browserConfig, null, 2));
      
      this.browser = await puppeteer.launch(this.browserConfig);
      
      // Controleer of de browser werkt door een pagina te openen
      const testPage = await this.browser.newPage();
      await testPage.setDefaultNavigationTimeout(10000);
      await testPage.setDefaultTimeout(10000);
      
      // Stel standaard headers in om 503 errors te verminderen
      await testPage.setExtraHTTPHeaders({
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      });
      
      // Sluit de testpagina weer
      await testPage.close();
      
      // Registreer disconnect handler
      this.browser.on('disconnected', () => {
        console.log('Browser disconnected event - browser op null gezet');
        this.browser = null;
      });
      
      this.isLaunching = false;
      this.retryCount = 0;
      
      return this.browser;
    } catch (error) {
      this.isLaunching = false;
      console.error('Fout bij starten van browser:', error);
      
      // Retry logica met aangepaste configuratie
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        
        // Pas configuratie aan gebaseerd op error type
        if (error.message.includes('ECONNRESET') || 
            error.message.includes('socket hang up') ||
            error.message.includes('Target closed')) {
          
          // Schakel tussen WebSocket en pipe mode
          if (!this.browserConfig.pipe) {
            console.log(`Retry ${this.retryCount}/${this.maxRetries}: Schakel over naar pipe mode`);
            this.browserConfig.pipe = true;
          } else {
            console.log(`Retry ${this.retryCount}/${this.maxRetries}: Probeer met verhoogde timeouts`);
            this.browserConfig.timeout = 60000;
            this.browserConfig.protocolTimeout = 60000;
          }
        }
        
        // Wacht even tussen retries
        const waitTime = this.retryCount * 1000;
        console.log(`Wachten ${waitTime}ms voor volgende poging...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Probeer opnieuw
        return this.getBrowser();
      }
      
      // Als alle retries mislukken
      throw new Error(`Kon browser niet starten na ${this.maxRetries} pogingen: ${error.message}`);
    }
  }

  /**
   * Maak een nieuwe pagina aan met standaard instellingen
   * @returns {Promise<Page>} Puppeteer page
   */
  async getNewPage() {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    // Stel hogere timeouts in
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);
    
    // Stel betere headers in om 503 errors te verminderen
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    
    return page;
  }

  /**
   * Sluit de browser
   */
  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('Browser succesvol gesloten');
      } catch (error) {
        console.error('Fout bij sluiten browser:', error);
      } finally {
        this.browser = null;
      }
    }
  }
}

// Singleton instance
const puppeteerManager = new PuppeteerManager();
export default puppeteerManager;