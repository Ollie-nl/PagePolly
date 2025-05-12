// server/routes/mockRoutes.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Mock storage for active crawl jobs and history
const activeCrawlJobs = new Map();
const crawlHistory = [];

// Mock vendors data
const vendors = [
  {
    id: '1',
    name: 'Amazon',
    url: 'https://www.amazon.com',
    logo: '/assets/logos/amazon.png',
    categories: ['e-commerce', 'cloud'],
    status: 'active'
  },
  {
    id: '2',
    name: 'eBay',
    url: 'https://www.ebay.com',
    logo: '/assets/logos/ebay.png',
    categories: ['e-commerce', 'auction'],
    status: 'active'
  },
  {
    id: '3',
    name: 'Walmart',
    url: 'https://www.walmart.com',
    logo: '/assets/logos/walmart.png',
    categories: ['e-commerce', 'retail'],
    status: 'active'
  }
];

// Helper function to generate a new mock crawl job
const createMockCrawlJob = (projectId, userId, urls) => {
  const jobId = uuidv4();
  
  const job = {
    id: jobId,
    projectId,
    userId,
    status: 'pending',
    progress: 0,
    startTime: new Date(),
    urls,
    results: [],
    errors: []
  };
  
  // Simulate a running job
  setTimeout(() => {
    if (activeCrawlJobs.has(jobId)) {
      const job = activeCrawlJobs.get(jobId);
      job.status = 'running';
      job.progress = 25;
      
      // Continue adding progress
      setTimeout(() => {
        if (activeCrawlJobs.has(jobId)) {
          const job = activeCrawlJobs.get(jobId);
          if (job.status !== 'cancelled') {
            job.progress = 75;
            
            setTimeout(() => {
              if (activeCrawlJobs.has(jobId)) {
                const job = activeCrawlJobs.get(jobId);
                if (job.status !== 'cancelled') {
                  job.status = 'completed';
                  job.progress = 100;
                  job.completionTime = new Date();
                  
                  // Generate mock results
                  job.urls.forEach(url => {
                    job.results.push({
                      url,
                      data: {
                        title: `Mock crawl result for ${url}`,
                        url,
                        time: new Date().toISOString(),
                        metadata: {
                          title: `Page title for ${url}`,
                          description: 'This is a mock description generated for testing purposes.',
                          keywords: 'mock, test, crawler',
                        },
                        structure: {
                          products: [],
                          navElements: [],
                          headings: [],
                          links: []
                        }
                      },
                      screenshot: 'data:image/jpeg;base64,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',
                      timestamp: new Date()
                    });
                  });
                  
                  // Move to history
                  crawlHistory.push({...job});
                  activeCrawlJobs.delete(jobId);
                }
              }
            }, 5000);
          }
        }
      }, 5000);
    }
  }, 2000);

  // Save to active jobs
  activeCrawlJobs.set(jobId, job);
  return job;
};

/*
 * MOCK CRAWLER ENDPOINTS
 */

// Start a new crawl job
router.post('/crawls', (req, res) => {
  const { projectId, urls } = req.body;
  const userId = req.user?.id || 'default-user';
  
  if (!projectId || !urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Project ID and an array of URLs are required'
    });
  }

  // Validate URLs
  const validUrls = urls.filter(url => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  });

  if (validUrls.length === 0) {
    return res.status(400).json({
      error: 'Invalid URLs',
      message: 'No valid URLs provided'
    });
  }

  // Create mock job
  const job = createMockCrawlJob(projectId, userId, validUrls);
  
  res.status(201).json({
    message: 'Crawl job started successfully',
    id: job.id,
    status: job.status
  });
});

// Get active crawl jobs status
router.get('/crawls/status', (req, res) => {
  const userId = req.user?.id || 'default-user';
  
  // Filter jobs for the current user
  const userJobs = Array.from(activeCrawlJobs.values())
    .filter(job => job.userId === userId)
    .map(job => ({
      id: job.id,
      projectId: job.projectId,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      urls: job.urls?.length || 0
    }));
  
  res.json(userJobs);
});

// Cancel a crawl job
router.post('/crawls/:jobId/cancel', (req, res) => {
  const { jobId } = req.params;
  const userId = req.user?.id || 'default-user';
  
  // Get job details
  const job = activeCrawlJobs.get(jobId);
  
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
  job.status = 'cancelled';
  job.completionTime = new Date();
  
  res.json({
    id: job.id,
    status: job.status,
    message: 'Crawl job cancelled successfully'
  });
});

// Get details for a specific crawl job
router.get('/crawls/:jobId', (req, res) => {
  const { jobId } = req.params;
  const userId = req.user?.id || 'default-user';
  
  // Check active jobs first
  let job = activeCrawlJobs.get(jobId);
  
  // If not found, check history
  if (!job) {
    job = crawlHistory.find(j => j.id === jobId);
  }
  
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
});

// Get crawl history
router.get('/crawls', (req, res) => {
  const userId = req.user?.id || 'default-user';
  const { projectId, status, limit = 10, page = 1 } = req.query;
  
  // Filter history based on query parameters
  let filteredHistory = crawlHistory.filter(job => job.userId === userId);
  
  if (projectId) {
    filteredHistory = filteredHistory.filter(job => job.projectId === projectId);
  }
  
  if (status) {
    filteredHistory = filteredHistory.filter(job => job.status === status);
  }
  
  // Pagination
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);
  
  res.json({
    total: filteredHistory.length,
    page: parseInt(page),
    limit: parseInt(limit),
    data: paginatedHistory.map(job => ({
      id: job.id,
      projectId: job.projectId,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      completionTime: job.completionTime || null,
      urls: job.urls.length,
      resultsCount: job.results.length,
      errorsCount: job.errors.length
    }))
  });
});

/*
 * MOCK VENDOR ENDPOINTS
 */

// Get all vendors
router.get('/vendors', (req, res) => {
  res.json(vendors);
});

// Add a new vendor
router.post('/vendors', (req, res) => {
  const vendorData = req.body;
  
  if (!vendorData.name || !vendorData.url) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Vendor name and URL are required'
    });
  }
  
  const newVendor = {
    id: uuidv4(),
    name: vendorData.name,
    url: vendorData.url,
    logo: vendorData.logo || '/assets/logos/default.png',
    categories: vendorData.categories || [],
    status: vendorData.status || 'active'
  };
  
  vendors.push(newVendor);
  
  res.status(201).json(newVendor);
});

// Update a vendor
router.put('/vendors/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  
  const index = vendors.findIndex(vendor => vendor.id === id);
  
  if (index === -1) {
    return res.status(404).json({
      error: 'Vendor not found',
      message: `Vendor with ID ${id} not found`
    });
  }
  
  // Update vendor data
  vendors[index] = {
    ...vendors[index],
    ...updatedData,
    id // Ensure ID remains the same
  };
  
  res.json(vendors[index]);
});

// Delete a vendor
router.delete('/vendors/:id', (req, res) => {
  const { id } = req.params;
  
  const index = vendors.findIndex(vendor => vendor.id === id);
  
  if (index === -1) {
    return res.status(404).json({
      error: 'Vendor not found',
      message: `Vendor with ID ${id} not found`
    });
  }
  
  // Remove vendor
  vendors.splice(index, 1);
  
  res.status(204).end();
});

module.exports = router;