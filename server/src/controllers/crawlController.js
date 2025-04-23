// server/src/controllers/crawlController.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ScrapingBee API key
const SCRAPING_BEE_API_KEY = process.env.SCRAPING_BEE_API_KEY;

// In-memory storage for active crawl jobs (for development)
// In production, this should be replaced with a more persistent solution
const activeJobs = new Map();

/**
 * Extracts page metadata and structure using a custom JavaScript snippet
 * @returns {string} - JavaScript code to be executed in the browser
 */
const getExtractionScript = () => {
  return `
    () => {
      try {
        // Extract metadata
        const metadata = {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || 
                      document.querySelector('meta[property="og:description"]')?.content || 
                      '',
          url: window.location.href,
          domain: window.location.hostname
        };
        
        // Extract key elements with their position and dimensions
        const elements = [];
        const selectors = [
          'header', 'nav', 'main', 'footer', 'article', 'section', 
          'h1', 'h2', 'h3', '.hero', '.container', '.content',
          'form', 'button[type="submit"]', 'input[type="text"]',
          'a.btn, a.button, button.btn'
        ];
        
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            // Skip if element is not visible
            if (el.offsetWidth === 0 || el.offsetHeight === 0) return;
            
            const rect = el.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(el);
            
            // Get element text content with fallbacks for special elements
            let text = '';
            if (el.tagName === 'INPUT') {
              text = el.placeholder || el.value || el.name || '';
            } else if (el.tagName === 'BUTTON') {
              text = el.innerText || el.value || el.name || '';
            } else {
              text = el.innerText || '';
            }
            
            // Trim text to reasonable length
            text = text.trim().substring(0, 200);
            
            elements.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className || null,
              text: text,
              position: {
                x: Math.round(rect.left + window.scrollX),
                y: Math.round(rect.top + window.scrollY),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              styles: {
                backgroundColor: computedStyle.backgroundColor,
                color: computedStyle.color,
                fontSize: computedStyle.fontSize,
                fontWeight: computedStyle.fontWeight
              }
            });
          });
        });
        
        return { metadata, structure: elements };
      } catch (error) {
        return { 
          metadata: { 
            title: document.title || 'Unknown', 
            url: window.location.href 
          }, 
          structure: [],
          error: error.message 
        };
      }
    }
  `;
};

/**
 * Start a new crawl job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.startCrawl = async (req, res) => {
  try {
    const { projectId, urls } = req.body;
    const userId = req.user.id;
    
    // Validate inputs
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ message: 'At least one URL is required' });
    }
    
    // Validate ScrapingBee API key
    if (!SCRAPING_BEE_API_KEY) {
      return res.status(500).json({ message: 'ScrapingBee API key is not configured' });
    }
    
    // Create a unique ID for this crawl job
    const jobId = uuidv4();
    const startTime = new Date().toISOString();
    
    // Create a new job record in the database
    const { data: jobData, error: jobError } = await supabase
      .from('crawl_jobs')
      .insert({
        id: jobId,
        user_id: userId,
        project_id: projectId,
        urls,
        status: 'pending',
        progress: 0,
        start_time: startTime,
        results: [],
        errors: []
      })
      .select()
      .single();
    
    if (jobError) {
      console.error('Error creating crawl job in database:', jobError);
      return res.status(500).json({ message: 'Error creating crawl job in database', error: jobError.message });
    }
    
    // Store job information in memory (for non-persistent development)
    activeJobs.set(jobId, {
      id: jobId,
      userId,
      projectId,
      urls,
      status: 'pending',
      progress: 0,
      startTime,
      completedUrls: 0,
      results: [],
      errors: []
    });
    
    // Process the URLs in the background
    processCrawlJob(jobId).catch(err => {
      console.error(`Error processing crawl job ${jobId}:`, err);
      updateJobStatus(jobId, 'failed', {
        error: err.message || 'Unknown error during crawl processing'
      });
    });
    
    // Return the job information to the client
    res.status(201).json({
      id: jobId,
      projectId,
      urls,
      status: 'pending',
      progress: 0,
      startTime
    });
    
  } catch (error) {
    console.error('Error starting crawl:', error);
    res.status(500).json({ message: 'Error starting crawl', error: error.message });
  }
};

/**
 * Get details of a specific crawl job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCrawlJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    // Get job from database
    const { data: jobData, error: jobError } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();
    
    if (jobError) {
      return res.status(404).json({ message: 'Crawl job not found' });
    }
    
    // Format and return the job data
    res.json({
      id: jobData.id,
      projectId: jobData.project_id,
      urls: jobData.urls,
      status: jobData.status,
      progress: jobData.progress,
      startTime: jobData.start_time,
      completionTime: jobData.completion_time,
      results: jobData.results,
      errors: jobData.errors
    });
    
  } catch (error) {
    console.error('Error getting crawl job details:', error);
    res.status(500).json({ message: 'Error getting crawl job details', error: error.message });
  }
};

/**
 * Get all active crawl jobs for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getActiveCrawlJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get active jobs from database
    const { data: jobsData, error: jobsError } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'running'])
      .order('start_time', { ascending: false });
    
    if (jobsError) {
      return res.status(500).json({ message: 'Error fetching active crawl jobs', error: jobsError.message });
    }
    
    // Format and return the jobs
    const formattedJobs = jobsData.map(job => ({
      id: job.id,
      projectId: job.project_id,
      urls: job.urls,
      status: job.status,
      progress: job.progress,
      startTime: job.start_time
    }));
    
    res.json(formattedJobs);
    
  } catch (error) {
    console.error('Error getting active crawl jobs:', error);
    res.status(500).json({ message: 'Error getting active crawl jobs', error: error.message });
  }
};

/**
 * Get crawl history for a user with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCrawlHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId, status, limit = 10, page = 0 } = req.query;
    
    // Build the query
    let query = supabase
      .from('crawl_jobs')
      .select('id, project_id, urls, status, start_time, completion_time, progress')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .range(page * limit, (page * limit) + limit - 1);
    
    // Add filters if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute the query
    const { data: jobsData, error: jobsError } = await query;
    
    if (jobsError) {
      return res.status(500).json({ message: 'Error fetching crawl history', error: jobsError.message });
    }
    
    // Add counts for results and errors
    const { data: countData, error: countError } = await Promise.all(
      jobsData.map(job => {
        return supabase
          .from('crawl_jobs')
          .select('id, results:results(count), errors:errors(count)')
          .eq('id', job.id)
          .single();
      })
    );
    
    // Format and return the jobs
    const formattedJobs = jobsData.map((job, index) => {
      const counts = countData?.[index] || { results: [], errors: [] };
      
      return {
        id: job.id,
        projectId: job.project_id,
        urlCount: job.urls?.length || 0,
        status: job.status,
        startTime: job.start_time,
        completionTime: job.completion_time,
        progress: job.progress,
        resultsCount: counts.results?.length || 0,
        errorsCount: counts.errors?.length || 0
      };
    });
    
    res.json(formattedJobs);
    
  } catch (error) {
    console.error('Error getting crawl history:', error);
    res.status(500).json({ message: 'Error getting crawl history', error: error.message });
  }
};

/**
 * Cancel an active crawl job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.cancelCrawl = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    // Check if job exists and belongs to user
    const { data: jobData, error: jobError } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();
    
    if (jobError || !jobData) {
      return res.status(404).json({ message: 'Crawl job not found' });
    }
    
    // Check if job is active and can be cancelled
    if (jobData.status !== 'pending' && jobData.status !== 'running') {
      return res.status(400).json({ message: `Cannot cancel a job with status: ${jobData.status}` });
    }
    
    // Update the job status in the database
    const completionTime = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('crawl_jobs')
      .update({
        status: 'cancelled',
        completion_time: completionTime
      })
      .eq('id', jobId);
    
    if (updateError) {
      return res.status(500).json({ message: 'Error cancelling crawl job', error: updateError.message });
    }
    
    // Update in-memory job status (for development)
    if (activeJobs.has(jobId)) {
      const job = activeJobs.get(jobId);
      job.status = 'cancelled';
      job.completionTime = completionTime;
    }
    
    // Return the updated job information
    res.json({
      id: jobId,
      status: 'cancelled',
      completionTime
    });
    
  } catch (error) {
    console.error('Error cancelling crawl job:', error);
    res.status(500).json({ message: 'Error cancelling crawl job', error: error.message });
  }
};

/**
 * Process a crawl job by sending URLs to ScrapingBee
 * @param {string} jobId - ID of the job to process
 */
async function processCrawlJob(jobId) {
  try {
    // Get job from database
    const { data: jobData, error: jobError } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (jobError || !jobData) {
      console.error(`Job ${jobId} not found or error fetching:`, jobError);
      return;
    }
    
    // Update job status to running
    await updateJobStatus(jobId, 'running');
    
    const urls = jobData.urls;
    const results = [];
    const errors = [];
    let completedUrls = 0;
    
    // Process URLs sequentially to avoid overwhelming the API
    for (const url of urls) {
      try {
        // Skip processing if job has been cancelled
        const { data: currentJob } = await supabase
          .from('crawl_jobs')
          .select('status')
          .eq('id', jobId)
          .single();
        
        if (currentJob.status === 'cancelled') {
          console.log(`Job ${jobId} has been cancelled, stopping processing`);
          break;
        }
        
        console.log(`Processing URL: ${url} for job ${jobId}`);
        
        // Crawl the URL using ScrapingBee
        const result = await crawlUrl(url);
        results.push({
          url,
          timestamp: new Date().toISOString(),
          ...result
        });
        
        // Update progress
        completedUrls++;
        const progress = Math.floor((completedUrls / urls.length) * 100);
        
        // Update the job in the database with new progress and results
        await updateJobProgress(jobId, progress, results, errors);
        
      } catch (error) {
        console.error(`Error crawling URL ${url}:`, error);
        errors.push({
          url,
          timestamp: new Date().toISOString(),
          error: error.message || 'Unknown error'
        });
        
        // Update the job with the error
        await updateJobProgress(jobId, 
          Math.floor((completedUrls / urls.length) * 100), 
          results, 
          errors
        );
      }
    }
    
    // Mark job as completed if not cancelled
    const { data: finalJob } = await supabase
      .from('crawl_jobs')
      .select('status')
      .eq('id', jobId)
      .single();
    
    if (finalJob.status !== 'cancelled') {
      await updateJobStatus(jobId, 'completed', { results, errors });
    }
    
    console.log(`Job ${jobId} processing completed`);
    
  } catch (error) {
    console.error(`Error processing crawl job ${jobId}:`, error);
    await updateJobStatus(jobId, 'failed', { error: error.message || 'Unknown error during processing' });
  }
}

/**
 * Update the status of a crawl job
 * @param {string} jobId - ID of the job to update
 * @param {string} status - New status ('running', 'completed', 'failed', 'cancelled')
 * @param {Object} additionalData - Additional data to update
 */
async function updateJobStatus(jobId, status, additionalData = {}) {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };
    
    // Add completion time for terminal states
    if (['completed', 'failed', 'cancelled'].includes(status)) {
      updateData.completion_time = new Date().toISOString();
    }
    
    // Merge with additional data if provided
    if (additionalData.results) {
      updateData.results = additionalData.results;
    }
    
    if (additionalData.errors) {
      updateData.errors = additionalData.errors;
    }
    
    // Update in database
    const { error } = await supabase
      .from('crawl_jobs')
      .update(updateData)
      .eq('id', jobId);
    
    if (error) {
      console.error(`Error updating job ${jobId} status:`, error);
    }
    
    // Update in-memory job status (for development)
    if (activeJobs.has(jobId)) {
      const job = activeJobs.get(jobId);
      job.status = status;
      
      if (updateData.completion_time) {
        job.completionTime = updateData.completion_time;
      }
      
      if (additionalData.results) {
        job.results = additionalData.results;
      }
      
      if (additionalData.errors) {
        job.errors = additionalData.errors;
      }
    }
    
  } catch (error) {
    console.error(`Error updating job ${jobId} status:`, error);
  }
}

/**
 * Update the progress of a crawl job
 * @param {string} jobId - ID of the job to update
 * @param {number} progress - Progress percentage (0-100)
 * @param {Array} results - Current results array
 * @param {Array} errors - Current errors array
 */
async function updateJobProgress(jobId, progress, results = [], errors = []) {
  try {
    // Update in database
    const { error } = await supabase
      .from('crawl_jobs')
      .update({
        progress,
        results,
        errors,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    if (error) {
      console.error(`Error updating job ${jobId} progress:`, error);
    }
    
    // Update in-memory job progress (for development)
    if (activeJobs.has(jobId)) {
      const job = activeJobs.get(jobId);
      job.progress = progress;
      job.results = results;
      job.errors = errors;
    }
    
  } catch (error) {
    console.error(`Error updating job ${jobId} progress:`, error);
  }
}

/**
 * Crawl a single URL using ScrapingBee
 * @param {string} url - URL to crawl
 * @returns {Object} - Crawl result with metadata, content, and screenshot
 */
async function crawlUrl(url) {
  try {
    // Validate URL format
    new URL(url); // This will throw if URL is invalid
    
    // Prepare ScrapingBee API parameters
    const params = {
      api_key: SCRAPING_BEE_API_KEY,
      url,
      premium_proxy: 'true',
      country_code: 'us',
      screenshot: 'true',
      screenshot_full_page: 'true',
      wait_browser: 'networkidle0',
      timeout: '30000', // 30 seconds
      js_scenario: {
        instructions: [
          { wait: 2000 }, // Wait for page to stabilize
          { execute_js: getExtractionScript() }
        ]
      }
    };
    
    console.log(`Sending request to ScrapingBee for URL: ${url}`);
    
    // Make the API request
    const apiUrl = 'https://app.scrapingbee.com/api/v1';
    const response = await axios.get(apiUrl, { params, responseType: 'arraybuffer' });
    
    // Handle and parse the response
    const contentType = response.headers['content-type'];
    
    if (contentType && contentType.includes('application/json')) {
      // JSON response (error or metadata+structure)
      const responseText = response.data.toString('utf8');
      const jsonData = JSON.parse(responseText);
      
      if (jsonData.error) {
        throw new Error(`ScrapingBee API error: ${jsonData.error}`);
      }
      
      return jsonData;
    } else if (contentType && contentType.includes('image/')) {
      // Screenshot response
      const screenshotBase64 = `data:${contentType};base64,${Buffer.from(response.data).toString('base64')}`;
      
      return {
        metadata: {
          title: url,
          url: url
        },
        screenshot: screenshotBase64,
        structure: []
      };
    } else {
      // Handle HTML response
      const htmlContent = response.data.toString('utf8');
      
      // Extract simple metadata from HTML
      const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : url;
      
      const descriptionMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                             htmlContent.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
      const description = descriptionMatch ? descriptionMatch[1] : '';
      
      return {
        metadata: {
          title,
          description,
          url
        },
        htmlContent: htmlContent.substring(0, 5000), // Truncate HTML content
        structure: [] // No structure extraction in this fallback scenario
      };
    }
    
  } catch (error) {
    console.error(`Error in crawlUrl for ${url}:`, error);
    throw new Error(`Failed to crawl URL: ${error.message}`);
  }
}