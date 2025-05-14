// server/routes/puppeteerCrawlRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateCrawlRequest, validateJobId, validatePaginationParams } = require('../middleware/validators');
const PuppeteerCrawlerService = require('../services/puppeteer/puppeteerCrawlerService');
const puppeteerManager = require('../services/puppeteer/puppeteerManager');
const db = require('../config/db');

const crawlerService = new PuppeteerCrawlerService(puppeteerManager);

// Start a new crawl job
router.post('/',
  authenticateToken,
  validateCrawlRequest,
  async (req, res) => {
    try {
      const { urls, vendorId, settings } = req.body;
      const userId = req.user.email;

      const job = await crawlerService.startCrawlJob(
        userId,
        vendorId,
        urls,
        settings
      );

      res.status(201).json(job);
    } catch (error) {
      console.error('Error starting crawl job:', error);
      res.status(500).json({ 
        error: 'Failed to start crawl job',
        message: error.message
      });
    }
  }
);

// Get job status
router.get('/:jobId',
  authenticateToken,
  validateJobId,
  async (req, res) => {
    try {
      const job = await db.getCrawlJob(req.params.jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.userId !== req.user.email) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(job);
    } catch (error) {
      console.error('Error getting job status:', error);
      res.status(500).json({ 
        error: 'Failed to get job status',
        message: error.message
      });
    }
  }
);

// Get job results
router.get('/:jobId/results',
  authenticateToken,
  validateJobId,
  async (req, res) => {
    try {
      const job = await db.getCrawlJob(req.params.jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.userId !== req.user.email) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!['completed', 'partial'].includes(job.status)) {
        return res.status(400).json({ error: 'Results not available yet' });
      }

      res.json({ results: job.results });
    } catch (error) {
      console.error('Error getting job results:', error);
      res.status(500).json({ 
        error: 'Failed to get job results',
        message: error.message
      });
    }
  }
);

// Cancel job
router.post('/:jobId/cancel',
  authenticateToken,
  validateJobId,
  async (req, res) => {
    try {
      const job = await db.getCrawlJob(req.params.jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.userId !== req.user.email) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!['pending', 'running'].includes(job.status)) {
        return res.status(400).json({ error: 'Job cannot be cancelled' });
      }

      await db.updateCrawlJob(job.id, {
        status: 'cancelled',
        completionTime: new Date()
      });

      res.json({ message: 'Job cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling job:', error);
      res.status(500).json({ 
        error: 'Failed to cancel job',
        message: error.message
      });
    }
  }
);

// Get crawl history
router.get('/',
  authenticateToken,
  validatePaginationParams,
  async (req, res) => {
    try {
      const { page = 0, limit = 10, vendorId, status } = req.query;
      const userId = req.user.email;

      const history = await db.getCrawlHistory(userId, {
        offset: page * limit,
        limit: parseInt(limit),
        vendorId,
        status
      });

      res.json(history);
    } catch (error) {
      console.error('Error getting crawl history:', error);
      res.status(500).json({ 
        error: 'Failed to get crawl history',
        message: error.message
      });
    }
  }
);

module.exports = router;