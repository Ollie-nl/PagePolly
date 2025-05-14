// server/services/puppeteer/puppeteerCrawlerService.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const db = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

// Add plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

class PuppeteerCrawlerService {
  constructor(puppeteerManager) {
    this.puppeteerManager = puppeteerManager;
  }

  /**
   * Start a new crawl job
   * @param {string} userId - User email
   * @param {string} vendorId - Vendor ID
   * @param {Array<string>} urls - URLs to crawl
   * @param {Object} settings - Crawl settings
   * @returns {Promise<Object>} - Created job details
   */
  async startCrawlJob(userId, vendorId, urls, settings = {}) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      userId,
      vendorId,
      urls,
      status: 'pending',
      progress: 0,
      settings: {
        ...settings,
        navigationTimeout: settings.navigationTimeout || 30000,
        maxRetries: settings.maxRetries || 3,
        waitForSelector: settings.waitForSelector || 'body',
        simulateHumanBehavior: settings.simulateHumanBehavior !== false,
        screenshots: settings.screenshots || { enabled: true, fullPage: true }
      }
    };

    // Store job in database
    await db.createCrawlJob(job);

    // Start crawling process
    this.processCrawlJob(job).catch(error => {
      console.error(`Error processing job ${jobId}:`, error);
      db.updateCrawlJob(jobId, { status: 'failed', error: error.message });
    });

    return { jobId, status: 'pending' };
  }

  /**
   * Process a crawl job
   * @param {Object} job - Job details
   * @returns {Promise<void>}
   */
  async processCrawlJob(job) {
    const { id: jobId, urls, settings } = job;
    let browser;

    try {
      // Update job status to running
      await db.updateCrawlJob(jobId, { status: 'running' });

      // Get browser instance
      browser = await this.puppeteerManager.getBrowser();
      
      const totalUrls = urls.length;
      let completedUrls = 0;
      let hasErrors = false;

      // Process each URL
      for (const url of urls) {
        try {
          const result = await this.crawlUrl(browser, url, settings);
          await db.storeCrawlResult({
            jobId,
            vendorId: job.vendorId,
            ...result
          });
        } catch (error) {
          hasErrors = true;
          await db.recordCrawlError(jobId, url, error.message);
          console.error(`Error crawling ${url}:`, error);
        }

        // Update progress
        completedUrls++;
        const progress = Math.round((completedUrls / totalUrls) * 100);
        await db.updateCrawlJob(jobId, { progress });
      }

      // Update final status
      await db.updateCrawlJob(jobId, {
        status: hasErrors ? 'partial' : 'completed',
        completionTime: new Date()
      });

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      await db.updateCrawlJob(jobId, {
        status: 'failed',
        error: error.message,
        completionTime: new Date()
      });
      throw error;
    } finally {
      if (browser) {
        await this.puppeteerManager.releaseBrowser(browser);
      }
    }
  }

  /**
   * Crawl a single URL with retries
   * @param {Browser} browser - Puppeteer browser instance
   * @param {string} url - URL to crawl
   * @param {Object} settings - Crawl settings
   * @returns {Promise<Object>} - Crawl result
   */
  async crawlUrl(browser, url, settings) {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError;

    while (retryCount <= settings.maxRetries) {
      const page = await browser.newPage();
      
      try {
        // Configure page
        await this.configurePage(page, settings);

        // Navigate to URL
        await page.goto(url, {
          waitUntil: 'networkidle0',
          timeout: settings.navigationTimeout
        });

        // Wait for content
        await page.waitForSelector(settings.waitForSelector, {
          timeout: settings.navigationTimeout
        });

        // Simulate human behavior if enabled
        if (settings.simulateHumanBehavior) {
          await this.simulateHumanBehavior(page);
        }

        // Extract data
        const data = await this.extractPageData(page);

        // Take screenshot if enabled
        let screenshot = null;
        if (settings.screenshots?.enabled) {
          screenshot = await page.screenshot({
            fullPage: settings.screenshots.fullPage,
            encoding: 'base64'
          });
        }

        await page.close();

        return {
          url,
          status: 'success',
          data,
          screenshot,
          crawlDuration: Date.now() - startTime,
          retryCount
        };

      } catch (error) {
        lastError = error;
        await page.close();
        
        if (retryCount >= settings.maxRetries) {
          throw new Error(`Failed to crawl ${url} after ${retryCount} retries: ${error.message}`);
        }
        
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
      }
    }

    throw lastError;
  }

  /**
   * Configure page settings
   * @param {Page} page - Puppeteer page instance
   * @param {Object} settings - Crawl settings
   */
  async configurePage(page, settings) {
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    // Enable JavaScript
    await page.setJavaScriptEnabled(true);

    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  /**
   * Simulate human-like behavior
   * @param {Page} page - Puppeteer page instance
   */
  async simulateHumanBehavior(page) {
    // Random scrolling
    await page.evaluate(() => {
      const scrollAmount = Math.floor(Math.random() * 500) + 200;
      window.scrollBy(0, scrollAmount);
    });

    // Random mouse movements
    const viewport = await page.viewport();
    await page.mouse.move(
      Math.random() * viewport.width,
      Math.random() * viewport.height,
      { steps: 10 }
    );

    // Random pauses
    await new Promise(resolve => 
      setTimeout(resolve, Math.random() * 1000 + 500)
    );
  }

  /**
   * Extract data from page
   * @param {Page} page - Puppeteer page instance
   * @returns {Promise<Object>} - Extracted data
   */
  async extractPageData(page) {
    return await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        meta: {
          description: document.querySelector('meta[name="description"]')?.content,
          keywords: document.querySelector('meta[name="keywords"]')?.content
        },
        headers: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
          type: h.tagName.toLowerCase(),
          text: h.textContent.trim()
        })),
        text: document.body.textContent.trim()
      };
    });
  }
}

module.exports = PuppeteerCrawlerService;