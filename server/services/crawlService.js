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
  async startCrawl(projectId, userId, urls) {
    // Create a new job
    const jobId = uuidv4();
    const job = {
      id: jobId,
      projectId,
      userId,
      urls,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      results: [],
      errors: []
    };

    // Store in active jobs
    this.activeJobs.set(jobId, job);

    // Record job in database
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
        if (job.status === 'cancelled') {
          break;
        }

        const url = job.urls[i];
        try {
          const result = await this.crawlSinglePage(browser, url);
          results.push({ url, ...result });
          
          // Update progress
          const progress = Math.floor(((i + 1) / job.urls.length) * 100);
          this.updateJobProgress(jobId, progress);
        } catch (error) {
          job.errors.push({ url, error: error.message });
          await db.recordCrawlError(jobId, url, error.message);
        }
      }

      // Close browser
      await browser.close();

      // Store results if job wasn't cancelled
      if (job.status !== 'cancelled') {
        job.results = results;
        job.completionTime = new Date();
        job.status = 'completed';
        
        // Save final results to database
        await db.updateCrawlJob(jobId, {
          status: 'completed',
          progress: 100,
          results,
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

      // Extract page information
      const pageData = await page.evaluate(() => {
        const extractElementData = (element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            type: element.type || null,
            text: element.innerText || null,
            html: element.innerHTML,
            attributes: Array.from(element.attributes).reduce((obj, attr) => {
              obj[attr.name] = attr.value;
              return obj;
            }, {}),
            position: {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            },
            isVisible: !(rect.width === 0 || 
                       rect.height === 0 || 
                       window.getComputedStyle(element).visibility === 'hidden' ||
                       window.getComputedStyle(element).display === 'none'),
            zIndex: window.getComputedStyle(element).zIndex,
          };
        };

        const title = document.title;
        
        // Extract product elements (this can be customized based on needs)
        const products = Array.from(document.querySelectorAll('.product, [data-product], [class*="product"], [id*="product"]'))
          .map(extractElementData);
          
        // Extract navigation elements
        const navElements = Array.from(document.querySelectorAll('nav, [role="navigation"], .navigation, .menu'))
          .map(extractElementData);
          
        // Extract heading elements for structure
        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(extractElementData);
        
        // Extract links
        const links = Array.from(document.querySelectorAll('a[href]'))
          .map(element => ({
            ...extractElementData(element),
            href: element.href
          }));

        // Get document metadata
        const metadata = {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          keywords: document.querySelector('meta[name="keywords"]')?.content || '',
        };

        return {
          title,
          url: window.location.href,
          time: new Date().toISOString(),
          metadata,
          structure: {
            products,
            navElements,
            headings,
            links,
          }
        };
      });
      
      // Take a screenshot
      const screenshot = await page.screenshot({ 
        fullPage: true,
        encoding: 'base64',
        quality: 80,
        type: 'jpeg'
      });
      
      // Close the page
      await page.close();
      
      // Return the collected data
      return { 
        data: pageData, 
        screenshot: `data:image/jpeg;base64,${screenshot}`,
        timestamp: new Date()
      };
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
}

module.exports = new CrawlService();