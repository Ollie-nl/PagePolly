// server/routes/crawlRoutes.js
const express = require('express');
const router = express.Router();
const crawlService = require('../services/crawlService');

/**
 * Start a new crawl job
 * POST /api/crawls
 */
router.post('/', async (req, res, next) => {
  try {
    const { vendorId, settings } = req.body;
    const userId = req.user.id;

    if (!vendorId) {
      return res.status(400).json({ error: 'Invalid request', message: 'vendorId is required' });
    }

    // Look up vendor to get the URL
    const db = require('../config/db');
    const vendor = await db.getVendor(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Not found', message: 'Vendor not found' });
    }
    if (!vendor.url) {
      return res.status(400).json({ error: 'Invalid vendor', message: 'Vendor has no URL configured' });
    }

    const job = await crawlService.startCrawl(vendorId, userId, [vendor.url], settings);

    res.status(201).json({
      message: 'Crawl job started successfully',
      id: job.id,
      status: job.status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all active crawl jobs for the user
 * GET /api/crawls/status
 */
router.get('/status', async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const activeJobs = crawlService.getActiveJobsForUser(userId);
    
    res.json(activeJobs.map(job => ({
      id: job.id,
      projectId: job.projectId,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      urls: job.urls?.length || 0
    })));
  } catch (error) {
    next(error);
  }
});

/**
 * Cancel an active crawl job
 * POST /api/crawls/:jobId/cancel
 */
router.post('/:jobId/cancel', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id; // From auth middleware
    
    // Get job details first
    const job = await crawlService.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: `Crawl job ${jobId} not found`
      });
    }
    
    // Ensure user owns the job
    if (job.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to cancel this job'
      });
    }
    
    // Cancel job
    const updatedJob = await crawlService.cancelJob(jobId);
    
    res.json({
      id: updatedJob.id,
      status: updatedJob.status,
      message: 'Crawl job cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get detailed information about a specific crawl job
 * GET /api/crawls/:jobId
 */
router.get('/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id; // From auth middleware
    
    // Get job details
    const job = await crawlService.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: `Crawl job ${jobId} not found`
      });
    }
    
    // Ensure user owns the job
    if (job.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this job'
      });
    }
    
    res.json({
      id: job.id,
      projectId: job.projectId,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      completionTime: job.completionTime,
      urls: job.urls,
      results: job.results,
      errors: job.errors
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get crawl history
 * GET /api/crawls
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { projectId, status, limit = 10, page = 1 } = req.query;
    
    const filters = {
      projectId,
      status,
      limit: parseInt(limit, 10),
      page: parseInt(page, 10)
    };
    
    const history = await crawlService.getCrawlHistory(userId, filters);
    
    res.json(history);
  } catch (error) {
    next(error);
  }
});

/**
 * Test crawler with a single URL
 * POST /api/crawls/test
 */
router.post('/test', async (req, res, next) => {
  try {
    const { url, settings, user_email } = req.body;

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        message: 'Please provide a valid URL including protocol (http:// or https://)'
      });
    }

    // Start test crawl
    const result = await crawlService.testCrawl({
      url,
      settings,
      user_email
    });

    res.json({
      success: true,
      data: result.data,
      screenshot: result.screenshot,
      crawlDuration: result.crawlDuration,
      message: 'Test crawl completed successfully'
    });
  } catch (error) {
    console.error('Test crawl error:', error);
    
    // Handle specific error types
    if (error.code === 'SERVICE_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable',
        message: error.message,
        retryAfter: error.retryAfter || 5
      });
    }

    // Handle other errors
    res.status(error.status || 500).json({
      success: false,
      error: error.name || 'CrawlError',
      message: error.message || 'An unexpected error occurred during test crawl'
    });
  }
});

module.exports = router;