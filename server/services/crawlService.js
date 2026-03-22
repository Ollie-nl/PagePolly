// server/services/crawlService.js
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

/**
 * Service for handling web crawling operations
 */
class CrawlService {
  constructor() {
    // Store active crawl jobs
    this.activeJobs = new Map();
  }

  /**
   * Start a new crawl job
   * @param {string} projectId - The project ID to associate with this crawl
   * @param {string} userId - The user ID who initiated the crawl
   * @param {Array<string>} urls - URLs to crawl
   * @returns {Object} - The job details
   */
  async startCrawl(vendorId, userId, userEmail, urls, settings = {}) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      vendorId,
      userId,
      userEmail,
      urls,
      settings,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      results: [],
      errors: []
    };

    this.activeJobs.set(jobId, job);
    await db.createCrawlJob(job);

    // Start crawling process in background
    this.executeCrawl(jobId).catch(error => {
      console.error(`Crawl job ${jobId} failed:`, error);
      this.updateJobStatus(jobId, 'failed', { error: error.message });
    });

    return { id: jobId, status: job.status };
  }

  /**
   * Execute the crawl job
   * @param {string} jobId - ID of the job to execute
   */
  async executeCrawl(jobId) {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    try {
      // Update status to running
      this.updateJobStatus(jobId, 'running');

      // Launch browser
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new' // Use new headless mode
      });

      // Process each URL
      const results = [];
      for (let i = 0; i < job.urls.length; i++) {
        if (job.status === 'cancelled') break;

        const url = job.urls[i];
        const startTime = Date.now();
        try {
          const result = await this.crawlSinglePage(browser, url);
          const crawlDuration = Date.now() - startTime;

          // Store individual result in database
          await db.storeCrawlResult({
            jobId,
            vendorId: job.vendorId,
            url,
            status: 'success',
            data: result.data,
            crawlDuration,
            retryCount: 0,
          });

          results.push({ url, ...result });
          const progress = Math.floor(((i + 1) / job.urls.length) * 100);
          this.updateJobProgress(jobId, progress);
        } catch (error) {
          job.errors.push({ url, error: error.message });
          await db.recordCrawlError(jobId, url, error.message);
        }
      }

      // Close browser
      await browser.close();

      if (job.status !== 'cancelled') {
        job.results = results;
        job.completionTime = new Date();
        job.status = 'completed';
        await db.updateCrawlJob(jobId, {
          status: 'completed',
          progress: 100,
          completionTime: job.completionTime
        });
      }
    } catch (error) {
      // Handle any errors in the crawling process
      this.updateJobStatus(jobId, 'failed', { error: error.message });
      await db.updateCrawlJob(jobId, {
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Crawl a single page and extract information
   * @param {Browser} browser - Puppeteer browser instance
   * @param {string} url - URL to crawl
   * @returns {Object} - Extracted page data
   */
  async crawlSinglePage(browser, url) {
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1366, height: 768 });
    
    // Enable request interception for performance
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // Skip loading unnecessary resources
      const resourceType = req.resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    try {
      // Navigate to URL with timeout
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      // Wait for content to load
      await page.waitForSelector('body', { timeout: 5000 });

      // Extract clean text content — no HTML, no images, no positions
      const pageData = await page.evaluate(() => {
        const clean = (el) => (el?.innerText || el?.textContent || '').trim();
        const unique = (arr) => [...new Set(arr.filter(Boolean))];

        // Meta
        const title       = document.title || '';
        const description = document.querySelector('meta[name="description"]')?.content?.trim() || '';
        const keywords    = document.querySelector('meta[name="keywords"]')?.content?.trim() || '';
        const canonical   = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
        const lang        = document.documentElement.lang || '';

        // Headings as clean text
        const headings = {
          h1: unique(Array.from(document.querySelectorAll('h1')).map(clean)),
          h2: unique(Array.from(document.querySelectorAll('h2')).map(clean)),
          h3: unique(Array.from(document.querySelectorAll('h3')).map(clean)),
        };

        // Paragraphs — skip very short/empty ones
        const paragraphs = unique(
          Array.from(document.querySelectorAll('p'))
            .map(clean)
            .filter(t => t.length > 20)
        );

        // Links — deduplicate by href, keep anchor text
        const seen = new Set();
        const links = Array.from(document.querySelectorAll('a[href]'))
          .map(a => ({ href: a.href, text: clean(a) }))
          .filter(({ href, text }) => {
            if (!href.startsWith('http') || seen.has(href)) return false;
            seen.add(href);
            return true;
          });

        return {
          url:         canonical,
          title,
          meta:        { description, keywords, lang },
          headings,
          paragraphs,
          links,
          crawledAt:   new Date().toISOString(),
        };
      });
      
      await page.close();
      return { data: pageData };
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Update job status
   * @param {string} jobId - ID of the job to update
   * @param {string} status - New status
   * @param {Object} additionalData - Optional additional data
   */
  updateJobStatus(jobId, status, additionalData = {}) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = status;
      Object.assign(job, additionalData);
      
      // Update in database
      db.updateCrawlJob(jobId, { status, ...additionalData })
        .catch(err => console.error(`Failed to update job ${jobId} status:`, err));
    }
  }

  /**
   * Update job progress
   * @param {string} jobId - ID of the job to update
   * @param {number} progress - Current progress percentage
   */
  updateJobProgress(jobId, progress) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.progress = progress;
      
      // Update in database
      db.updateCrawlJob(jobId, { progress })
        .catch(err => console.error(`Failed to update job ${jobId} progress:`, err));
    }
  }

  /**
   * Get details of a specific job
   * @param {string} jobId - Job ID to retrieve
   * @returns {Object|null} - Job details or null if not found
   */
  async getJob(jobId) {
    // Check memory cache first
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId);
    }
    
    // Otherwise fetch from database
    return await db.getCrawlJob(jobId);
  }

  /**
   * Get all active jobs
   * @returns {Array} - List of active jobs
   */
  getActiveJobs() {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get all active jobs for a specific user
   * @param {string} userId - User ID
   * @returns {Array} - List of user's active jobs
   */
  getActiveJobsForUser(userId) {
    return Array.from(this.activeJobs.values())
      .filter(job => job.userId === userId);
  }

  /**
   * Cancel an active job
   * @param {string} jobId - ID of the job to cancel
   * @returns {Object} - Updated job details
   */
  async cancelJob(jobId) {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found or already completed`);
    }
    
    // Update job status
    job.status = 'cancelled';
    job.completionTime = new Date();
    
    // Update in database
    await db.updateCrawlJob(jobId, {
      status: 'cancelled',
      completionTime: job.completionTime
    });
    
    return job;
  }

  /**
   * Get crawl history for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Array} - Crawl history
   */
  async getCrawlHistory(userId, filters = {}) {
    return await db.getCrawlHistory(userId, filters);
  }

  /**
   * Test crawl a single URL
   * @param {Object} params - Test parameters
   * @param {string} params.url - URL to crawl
   * @param {string} params.method - Crawl method ('puppeteer' or 'api')
   * @param {Object} params.settings - Method-specific settings
   * @param {string} params.user_email - User's email
   * @returns {Promise<Object>} - Test results
   */
  async testCrawl({ url, settings, user_email }) {
    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new'
      });

      try {
        const startTime = Date.now();
        const result = await this.crawlSinglePage(browser, url);
        const crawlDuration = Date.now() - startTime;

        return {
          ...result,
          crawlDuration
        };
      } finally {
        await browser.close();
      }
    } catch (error) {
      // Enhance error with additional information
      const enhancedError = new Error(error.message);
      enhancedError.code = error.code || 'CRAWL_ERROR';
      enhancedError.status = error.status || 500;
      if (error.code === 'SERVICE_UNAVAILABLE') {
        enhancedError.retryAfter = 5;
      }
      throw enhancedError;
    }
  }
}

module.exports = new CrawlService();