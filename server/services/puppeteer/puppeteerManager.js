// server/services/puppeteer/puppeteerManager.js
const puppeteer = require('puppeteer-extra');

class PuppeteerManager {
  constructor() {
    this.browsers = new Map();
    this.maxBrowsers = 5;
    this.browserOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    };
    this.latestMetrics = null;
  }

  /**
   * Get a browser instance, creating a new one if necessary
   * @returns {Promise<Browser>} Puppeteer browser instance
   */
  async getBrowser() {
    // Clean up any crashed browsers
    for (const [id, browser] of this.browsers.entries()) {
      try {
        await browser.pages();
      } catch (e) {
        this.browsers.delete(id);
      }
    }

    // Try to find an available browser
    for (const [id, browser] of this.browsers.entries()) {
      const pages = await browser.pages();
      if (pages.length < 10) { // Max 10 pages per browser
        return browser;
      }
    }

    // Create new browser if under limit
    if (this.browsers.size < this.maxBrowsers) {
      const browser = await puppeteer.launch(this.browserOptions);
      const id = Date.now().toString();
      this.browsers.set(id, browser);
      return browser;
    }

    // Wait for an available browser
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        for (const [id, browser] of this.browsers.entries()) {
          try {
            const pages = await browser.pages();
            if (pages.length < 10) {
              clearInterval(checkInterval);
              resolve(browser);
              return;
            }
          } catch (e) {
            this.browsers.delete(id);
          }
        }
      }, 1000);
    });
  }

  /**
   * Release a browser instance
   * @param {Browser} browser - Puppeteer browser instance
   */
  async releaseBrowser(browser) {
    try {
      const pages = await browser.pages();
      await Promise.all(pages.map(page => page.close()));
    } catch (e) {
      console.error('Error closing browser pages:', e);
    }
  }

  /**
   * Check if the Puppeteer service is healthy
   * @returns {Promise<boolean>} True if service is healthy
   */
  async checkHealth() {
    const startTime = Date.now();
    const metrics = {
      timestamp: new Date().toISOString(),
      success: false,
      responseTime: 0,
      memory: process.memoryUsage(),
      activeBrowsers: this.browsers.size,
      activePages: await this.getActivePages(),
      error: null
    };

    try {
      // Try to launch a test browser
      const browser = await puppeteer.launch(this.browserOptions);
      const page = await browser.newPage();
      
      // Try to navigate to a simple page with timeout
      await page.goto('about:blank', { 
        waitUntil: 'networkidle0',
        timeout: 5000
      });
      
      // Get browser metrics
      const performance = await page.metrics();
      
      // Clean up
      await page.close();
      await browser.close();
      
      // Calculate response time
      metrics.responseTime = Date.now() - startTime;
      metrics.success = true;
      metrics.performance = performance;
      metrics.degraded = metrics.responseTime > 5000 || this.browsers.size >= this.maxBrowsers;
      
      this.latestMetrics = metrics;
      return metrics;
      
    } catch (error) {
      console.error('Health check failed:', error);
      metrics.error = error.message;
      metrics.degraded = true;
      this.latestMetrics = metrics;
      return metrics;
    }
  }

  /**
   * Close all browser instances
   */
  async closeAllBrowsers() {
    const closePromises = [];
    for (const [id, browser] of this.browsers.entries()) {
      try {
        closePromises.push(browser.close());
      } catch (e) {
        console.error(`Error closing browser ${id}:`, e);
      }
    }
    await Promise.all(closePromises);
    this.browsers.clear();
  }

  /**
   * Get the latest health check metrics
   * @returns {Object} Latest health metrics
   */
  getLatestMetrics() {
    return this.latestMetrics || {
      timestamp: new Date().toISOString(),
      success: false,
      responseTime: 0,
      memory: process.memoryUsage(),
      activeBrowsers: this.browsers.size,
      error: 'No health check performed yet',
      degraded: true
    };
  }

  /**
   * Get total number of active pages across all browsers
   * @returns {Promise<number>} Total number of active pages
   */
  async getActivePages() {
    let totalPages = 0;
    for (const [_, browser] of this.browsers.entries()) {
      try {
        const pages = await browser.pages();
        totalPages += pages.length;
      } catch (e) {
        console.error('Error counting pages:', e);
      }
    }
    return totalPages;
  }
}

module.exports = new PuppeteerManager();