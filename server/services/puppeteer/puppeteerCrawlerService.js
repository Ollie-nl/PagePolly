// server/services/puppeteer/puppeteerCrawlerService.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const db = require('../../config/db');
const { v4: uuidv4 } = require('uuid');
const puppeteerConfig = require('./puppeteerConfig');
const antiDetectionService = require('./antiDetectionService');
const humanBehaviorSimulator = require('./humanBehaviorSimulator');

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
        navigationTimeout: settings.navigationTimeout || puppeteerConfig.timeouts.navigation,
        maxRetries: settings.maxRetries || puppeteerConfig.retry.maxRetries,
        waitForSelector: settings.waitForSelector || 'body',
        simulateHumanBehavior: settings.simulateHumanBehavior !== false,
        antiDetection: settings.antiDetection || puppeteerConfig.antiDetection,
      }
    };

    // Log active crawler configuration
    const ad = job.settings.antiDetection;
    console.log(`[Crawler] Job ${jobId} started — ${urls.length} URL(s)`);
    console.log(`[Crawler] Config:
  stealth plugin    : enabled
  adblocker         : enabled
  user agent        : ${ad.userAgent === false ? `rotating (${ad.userAgents.length} UAs)` : ad.userAgent}
  webgl protection  : ${ad.webglFingerprinting ? 'enabled' : 'disabled'}
  canvas protection : ${ad.canvasFingerprinting ? 'enabled' : 'disabled'}
  hw concurrency    : ${ad.hardwareConcurrency}
  device memory     : ${ad.deviceMemory} GB
  human behavior    : ${job.settings.simulateHumanBehavior ? `enabled (delay ${ad.humanBehavior.minDelay}–${ad.humanBehavior.maxDelay}ms)` : 'disabled'}
  max retries       : ${job.settings.maxRetries}
  nav timeout       : ${job.settings.navigationTimeout}ms`);

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
        console.log(`[Crawler] [${jobId}] Crawling (${completedUrls + 1}/${totalUrls}): ${url}`);
        try {
          const result = await this.crawlUrl(browser, url, settings);
          console.log(`[Crawler] [${jobId}] Done: ${url} (${result.crawlDuration}ms, retries: ${result.retryCount})`);
          await db.storeCrawlResult({
            jobId,
            vendorId: job.vendorId,
            ...result
          });
        } catch (error) {
          hasErrors = true;
          console.error(`[Crawler] [${jobId}] Failed: ${url} — ${error.message}`);
          await db.recordCrawlError(jobId, url, error.message);
        }

        // Update progress
        completedUrls++;
        const progress = Math.round((completedUrls / totalUrls) * 100);
        console.log(`[Crawler] [${jobId}] Progress: ${progress}% (${completedUrls}/${totalUrls})`);
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
          await this.simulateHumanBehavior(page, settings);
        }

        // Extract data
        const data = await this.extractPageData(page);

        await page.close();

        return {
          url,
          status: 'success',
          data,
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
    // Apply anti-detection measures (user agent rotation, fingerprinting protection, headers, viewport)
    await antiDetectionService.applyAntiDetection(page, settings.antiDetection);

    // Enable JavaScript
    await page.setJavaScriptEnabled(true);

    // Block unnecessary resources for faster crawling
    const blockedResources = puppeteerConfig.resourceManagement.blockedResources;
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (blockedResources.includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  /**
   * Simulate human-like behavior
   * @param {Page} page - Puppeteer page instance
   * @param {Object} settings - Crawl settings
   */
  async simulateHumanBehavior(page, settings) {
    await humanBehaviorSimulator.simulateHumanBehavior(page, settings.antiDetection?.humanBehavior || {});
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