// server/src/routes/crawlRoutes.js
const express = require('express');
const router = express.Router();
const crawlController = require('../controllers/crawlController');

/**
 * @route   POST /api/crawls
 * @desc    Start a new crawl job
 * @access  Private
 */
router.post('/', crawlController.startCrawl);

/**
 * @route   GET /api/crawls/:jobId
 * @desc    Get details of a specific crawl job
 * @access  Private
 */
router.get('/:jobId', crawlController.getCrawlJobDetails);

/**
 * @route   GET /api/crawls/status
 * @desc    Get all active crawl jobs for current user
 * @access  Private
 */
router.get('/status', crawlController.getActiveCrawlJobs);

/**
 * @route   GET /api/crawls
 * @desc    Get crawl history with optional filtering
 * @access  Private
 */
router.get('/', crawlController.getCrawlHistory);

/**
 * @route   POST /api/crawls/:jobId/cancel
 * @desc    Cancel an active crawl job
 * @access  Private
 */
router.post('/:jobId/cancel', crawlController.cancelCrawl);

module.exports = router;