// server/config/db.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Database interface for managing crawl jobs and results
 */
const db = {
  /**
   * Creates a new crawl job in the database
   * @param {Object} job - Job details
   * @returns {Promise<Object>} - Created job
   */
  async createCrawlJob(job) {
    const { id, userId, vendorId, urls, status, progress, settings } = job;
    
    // Ensure tables exist
    await this.ensureTables();
    
    // Insert into crawl_jobs_ohxp1d table
    const { data, error } = await supabase
      .from('crawl_jobs_ohxp1d')
      .insert({
        id,
        user_email: userId,
        vendor_id: vendorId,
        urls,
        status,
        progress,
        settings,
        creation_time: new Date(),
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating crawl job:', error);
      throw new Error(`Failed to create crawl job: ${error.message}`);
    }
    
    return data;
  },
  
  /**
   * Updates an existing crawl job
   * @param {string} jobId - ID of the job to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Updated job
   */
  async updateCrawlJob(jobId, updates) {
    const updateData = {};
    
    // Map updates to database fields
    if (updates.status) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.error) updateData.error = updates.error;
    if (updates.completionTime) updateData.completion_time = updates.completionTime;
    
    // Update job in database
    const { data, error } = await supabase
      .from('crawl_jobs_ohxp1d')
      .update(updateData)
      .eq('id', jobId)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating crawl job:', error);
      throw new Error(`Failed to update crawl job: ${error.message}`);
    }
    
    return data;
  },
  
  /**
   * Gets details of a specific crawl job
   * @param {string} jobId - ID of the job to retrieve
   * @returns {Promise<Object>} - Job details
   */
  async getCrawlJob(jobId) {
    // Get job data
    const { data: job, error: jobError } = await supabase
      .from('crawl_jobs_ohxp1d')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (jobError) {
      console.error('Error retrieving crawl job:', jobError);
      throw new Error(`Failed to retrieve crawl job: ${jobError.message}`);
    }
    
    if (!job) {
      return null;
    }
    
    // Get job results if completed
    if (job.status === 'completed' || job.status === 'partial') {
      const { data: results, error: resultsError } = await supabase
        .from('crawl_results_ohxp1d')
        .select('*')
        .eq('job_id', jobId);
      
      if (resultsError) {
        console.error('Error retrieving crawl results:', resultsError);
      } else {
        job.results = results;
      }
      
      // Get job errors
      const { data: errors, error: errorsError } = await supabase
        .from('crawl_errors_ohxp1d')
        .select('*')
        .eq('job_id', jobId);
      
      if (errorsError) {
        console.error('Error retrieving crawl errors:', errorsError);
      } else {
        job.errors = errors;
      }
    }
    
    return this.formatJobData(job);
  },
  
  /**
   * Store a successful crawl result
   * @param {Object} result - Crawl result data
   * @returns {Promise<Object>} - Stored result
   */
  async storeCrawlResult(result) {
    const { 
      jobId, vendorId, url, status, data, 
      screenshot, crawlDuration, retryCount, timestamp 
    } = result;
    
    const { data: storedResult, error } = await supabase
      .from('crawl_results_ohxp1d')
      .insert({
        job_id: jobId,
        vendor_id: vendorId,
        url,
        status,
        data,
        screenshot,
        crawl_duration: crawlDuration,
        retry_count: retryCount,
        timestamp
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error storing crawl result:', error);
      throw new Error(`Failed to store crawl result: ${error.message}`);
    }
    
    return storedResult;
  },
  
  /**
   * Record a crawl error
   * @param {string} jobId - ID of the job
   * @param {string} url - URL that failed
   * @param {string} error - Error message
   * @param {boolean} isBlocking - Whether it's a blocking error
   * @returns {Promise<Object>} - Stored error
   */
  async recordCrawlError(jobId, url, error, isBlocking = false) {
    const { data: storedError, error: dbError } = await supabase
      .from('crawl_errors_ohxp1d')
      .insert({
        job_id: jobId,
        url,
        error,
        is_blocking: isBlocking,
        timestamp: new Date()
      })
      .select('*')
      .single();
    
    if (dbError) {
      console.error('Error recording crawl error:', dbError);
      throw new Error(`Failed to record crawl error: ${dbError.message}`);
    }
    
    return storedError;
  },
  
  /**
   * Get crawl history for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filters and pagination options
   * @returns {Promise<Array>} - Crawl history
   */
  async getCrawlHistory(userId, filters = {}) {
    let query = supabase
      .from('crawl_jobs_ohxp1d')
      .select('*')
      .eq('user_email', userId)
      .order('creation_time', { ascending: false });
    
    // Apply filters
    if (filters.vendorId) {
      query = query.eq('vendor_id', filters.vendorId);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset !== undefined) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error retrieving crawl history:', error);
      throw new Error(`Failed to retrieve crawl history: ${error.message}`);
    }
    
    // Format and return results
    return data.map(job => this.formatJobData(job));
  },
  
  /**
   * Get vendor-specific configuration
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Object>} - Vendor configuration
   */
  async getVendorConfig(vendorId) {
    if (!vendorId) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('vendor_configs_ohxp1d')
      .select('*')
      .eq('vendor_id', vendorId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error retrieving vendor config:', error);
      throw new Error(`Failed to retrieve vendor config: ${error.message}`);
    }
    
    return data || null;
  },
  
  /**
   * Update vendor-specific configuration
   * @param {string} vendorId - Vendor ID
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} - Updated configuration
   */
  async updateVendorConfig(vendorId, config) {
    // Check if vendor config exists
    const existing = await this.getVendorConfig(vendorId);
    
    if (existing) {
      // Update existing config
      const { data, error } = await supabase
        .from('vendor_configs_ohxp1d')
        .update({ config })
        .eq('vendor_id', vendorId)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error updating vendor config:', error);
        throw new Error(`Failed to update vendor config: ${error.message}`);
      }
      
      return data;
    } else {
      // Create new config
      const { data, error } = await supabase
        .from('vendor_configs_ohxp1d')
        .insert({
          vendor_id: vendorId,
          config,
          created_at: new Date()
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating vendor config:', error);
        throw new Error(`Failed to create vendor config: ${error.message}`);
      }
      
      return data;
    }
  },
  
  /**
   * Ensure all required tables exist in the database
   * @returns {Promise<void>}
   */
  async ensureTables() {
    try {
      // Check if tables exist
      const { data: existingTables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['crawl_jobs_ohxp1d', 'crawl_results_ohxp1d', 'crawl_errors_ohxp1d', 'vendor_configs_ohxp1d', 'test_crawls_ohxp1d']);
      
      if (error) {
        console.error('Error checking tables:', error);
        throw new Error(`Failed to check tables: ${error.message}`);
      }
      
      const tables = existingTables.map(t => t.table_name);
      
      // Create missing tables if needed
      if (!tables.includes('crawl_jobs_ohxp1d')) {
        await this.createJobsTable();
      }
      
      if (!tables.includes('crawl_results_ohxp1d')) {
        await this.createResultsTable();
      }
      
      if (!tables.includes('crawl_errors_ohxp1d')) {
        await this.createErrorsTable();
      }
      
      if (!tables.includes('vendor_configs_ohxp1d')) {
        await this.createVendorConfigsTable();
      }

      if (!tables.includes('test_crawls_ohxp1d')) {
        await supabase.rpc('create_test_crawls_table_ohxp1d');
      }
    } catch (error) {
      console.error('Error ensuring tables exist:', error);
      throw error;
    }
  },
  
  /**
   * Create the crawl jobs table
   * @returns {Promise<void>}
   */
  async createJobsTable() {
    const { error } = await supabase.rpc('create_crawl_jobs_table_ohxp1d');
    
    if (error) {
      console.error('Error creating crawl jobs table:', error);
      throw new Error(`Failed to create crawl jobs table: ${error.message}`);
    }
  },
  
  /**
   * Create the crawl results table
   * @returns {Promise<void>}
   */
  async createResultsTable() {
    const { error } = await supabase.rpc('create_crawl_results_table_ohxp1d');
    
    if (error) {
      console.error('Error creating crawl results table:', error);
      throw new Error(`Failed to create crawl results table: ${error.message}`);
    }
  },
  
  /**
   * Create the crawl errors table
   * @returns {Promise<void>}
   */
  async createErrorsTable() {
    const { error } = await supabase.rpc('create_crawl_errors_table_ohxp1d');
    
    if (error) {
      console.error('Error creating crawl errors table:', error);
      throw new Error(`Failed to create crawl errors table: ${error.message}`);
    }
  },
  
  /**
   * Create the vendor configs table
   * @returns {Promise<void>}
   */
  async createVendorConfigsTable() {
    const { error } = await supabase.rpc('create_vendor_configs_table_ohxp1d');
    
    if (error) {
      console.error('Error creating vendor configs table:', error);
      throw new Error(`Failed to create vendor configs table: ${error.message}`);
    }
  },
  
  /**
   * Record a test crawl
   * @param {Object} params - Test crawl details
   * @returns {Promise<Object>} - Created test crawl record
   */
  async recordTestCrawl(params) {
    const { url, method, user_email, success, duration, error, data, screenshot, timestamp } = params;

    // Record the test crawl
    const { data: result, error: insertError } = await supabase
      .from('test_crawls_ohxp1d')
      .insert({
        url,
        method,
        user_email,
        success,
        duration,
        error,
        data,
        screenshot,
        timestamp: timestamp || new Date()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error recording test crawl:', insertError);
      throw new Error(`Failed to record test crawl: ${insertError.message}`);
    }

    return result;
  },

  formatJobData(job) {
    if (!job) return null;
    
    return {
      id: job.id,
      userId: job.user_email,
      vendorId: job.vendor_id,
      urls: job.urls,
      status: job.status,
      progress: job.progress,
      creationTime: job.creation_time,
      completionTime: job.completion_time,
      error: job.error,
      settings: job.settings,
      results: job.results ? job.results.map(result => ({
        url: result.url,
        status: result.status,
        data: result.data,
        screenshot: result.screenshot,
        crawlDuration: result.crawl_duration,
        retryCount: result.retry_count,
        timestamp: result.timestamp
      })) : undefined,
      errors: job.errors ? job.errors.map(error => ({
        url: error.url,
        error: error.error,
        isBlocking: error.is_blocking,
        timestamp: error.timestamp
      })) : undefined
    };
  },

  /**
   * Record a test crawl attempt
   * @param {Object} params - Test parameters
   * @returns {Promise<Object>} - Recorded test data
   */
  async recordTestCrawl(params) {
    const { url, method, user_email, success, duration, error, timestamp } = params;

    // Create test_crawls table if it doesn't exist
    const { error: tableError } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS test_crawls_ohxp1d (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        url TEXT NOT NULL,
        method TEXT NOT NULL,
        user_email TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        duration INTEGER,
        error TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT fk_user
          FOREIGN KEY (user_email)
          REFERENCES auth.users (email)
          ON DELETE CASCADE
      );

      -- Add RLS policies
      ALTER TABLE test_crawls_ohxp1d ENABLE ROW LEVEL SECURITY;
      
      -- Users can only read their own test crawls
      CREATE POLICY test_crawls_select_policy ON test_crawls_ohxp1d
        FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
      
      -- Users can only insert their own test crawls
      CREATE POLICY test_crawls_insert_policy ON test_crawls_ohxp1d
        FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
    `);

    if (tableError) {
      console.warn('Note: Table might already exist:', tableError);
    }

    // Record the test crawl
    const { data, error: insertError } = await supabase
      .from('test_crawls_ohxp1d')
      .insert({
        url,
        method,
        user_email,
        success,
        duration,
        error,
        timestamp
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error recording test crawl:', insertError);
      throw new Error(`Failed to record test crawl: ${insertError.message}`);
    }

    return data;
  }
};

// Initialize tables on startup
(async () => {
  try {
    // Execute stored procedures to create required functions
    // Create function to create the jobs table
    await supabase.rpc('create_function_create_crawl_jobs_table_ohxp1d');
    
    // Create function to create the results table
    await supabase.rpc('create_function_create_crawl_results_table_ohxp1d');
    
    // Create function to create the errors table
    await supabase.rpc('create_function_create_crawl_errors_table_ohxp1d');
    
    // Create function to create the vendor configs table
    await supabase.rpc('create_function_create_vendor_configs_table_ohxp1d');
    
    // Ensure tables exist
    await db.ensureTables();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
})();

module.exports = db;