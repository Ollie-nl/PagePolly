// server/config/db.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

// Get current directory (ESM doesn't have __dirname)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Check for required environment variables
const SUPABASE_URL = process.env?.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env?.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  // In ESM context, we need to handle process differently
  if (typeof process !== 'undefined') {
    process.exit(1);
  }
}

// Initialize Supabase client
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
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
      console.log('Initialiseren van database tabellen...');
      
      // In plaats van te controleren of tabellen bestaan, maken we ze direct aan
      // We gebruiken try-catch om fouten af te vangen als ze al bestaan
      try {
        await this.createJobsTable();
        console.log('Crawl jobs tabel aangemaakt of bestaat al');
      } catch (e) {
        // Table might already exist, ignore error
        console.log('Crawl jobs tabel fout (mogelijk bestaat deze al):', e.message);
      }
      
      try {
        await this.createResultsTable();
        console.log('Crawl results tabel aangemaakt of bestaat al');
      } catch (e) {
        console.log('Crawl results tabel fout (mogelijk bestaat deze al):', e.message);
      }
      
      try {
        await this.createErrorsTable();
        console.log('Crawl errors tabel aangemaakt of bestaat al');
      } catch (e) {
        console.log('Crawl errors tabel fout (mogelijk bestaat deze al):', e.message);
      }
      
      try {
        await this.createVendorConfigsTable();
        console.log('Vendor configs tabel aangemaakt of bestaat al');
      } catch (e) {
        console.log('Vendor configs tabel fout (mogelijk bestaat deze al):', e.message);
      }
      
      try {
        await this.createVendorsTable();
        console.log('Vendors tabel aangemaakt of bestaat al');
      } catch (e) {
        console.log('Vendors tabel fout (mogelijk bestaat deze al):', e.message);
      }

      try {
        // We gebruiken SQL rechtstreeks omdat RPC misschien niet werkt
        await supabase.rpc('create_test_crawls_table_ohxp1d').catch(async () => {
          // Als RPC niet werkt, proberen we een directe SQL query
          const { error } = await supabase.from('test_crawls_ohxp1d').select('count(*)').limit(1);
          if (error && error.code === '42P01') { // Table doesn't exist
            // Create table here with raw SQL if needed
            console.log('Test crawls tabel moet handmatig worden aangemaakt');
          }
        });
        console.log('Test crawls tabel aangemaakt of bestaat al');
      } catch (e) {
        console.log('Test crawls tabel fout (mogelijk bestaat deze al):', e.message);
      }
      
      console.log('Database tabellen initialisatie voltooid');
    } catch (error) {
      console.error('Error ensuring tables exist:', error);
      throw new Error(`Failed to check tables: ${error.message}`);
    }
  },
  
  /**
   * Create the crawl jobs table
   * @returns {Promise<void>}
   */
  async createJobsTable() {
    // In plaats van RPC, gebruiken we directe SQL-query
    const { error } = await supabase.from('crawl_jobs_ohxp1d').insert({
      id: 'setup',
      user_id: 'system',
      vendor_id: 'system',
      urls: [],
      status: 'setup',
      progress: 0,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select();
    
    // Als de insert mislukt omdat de tabel niet bestaat, maken we deze aan
    if (error && error.code === '42P01') {
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql_string: `
          CREATE TABLE IF NOT EXISTS crawl_jobs_ohxp1d (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL,
            vendor_id TEXT NOT NULL,
            urls TEXT[] NOT NULL,
            status TEXT NOT NULL,
            progress NUMERIC DEFAULT 0,
            settings JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (sqlError) {
        console.error('Error creating crawl_jobs_ohxp1d table:', sqlError);
        throw sqlError;
      }
    }
  },

  /**
   * Create the crawl results table
   * @returns {Promise<void>}
   */
  async createResultsTable() {
    // In plaats van RPC, gebruiken we directe SQL-query
    const { error } = await supabase.from('crawl_results_ohxp1d').insert({
      id: 'setup',
      job_id: 'setup',
      url: 'https://example.com',
      content: 'setup',
      metadata: {},
      created_at: new Date().toISOString()
    }).select();
    
    if (error && error.code === '42P01') {
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql_string: `
          CREATE TABLE IF NOT EXISTS crawl_results_ohxp1d (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            job_id UUID NOT NULL,
            url TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (sqlError) {
        console.error('Error creating crawl_results_ohxp1d table:', sqlError);
        throw sqlError;
      }
    }
  },

  /**
   * Create the crawl errors table
   * @returns {Promise<void>}
   */
  async createErrorsTable() {
    // In plaats van RPC, gebruiken we directe SQL-query
    const { error } = await supabase.from('crawl_errors_ohxp1d').insert({
      id: 'setup',
      job_id: 'setup',
      url: 'https://example.com',
      error: 'setup',
      is_blocking: false,
      created_at: new Date().toISOString()
    }).select();
    
    if (error && error.code === '42P01') {
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql_string: `
          CREATE TABLE IF NOT EXISTS crawl_errors_ohxp1d (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            job_id UUID NOT NULL,
            url TEXT NOT NULL,
            error TEXT NOT NULL,
            is_blocking BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (sqlError) {
        console.error('Error creating crawl_errors_ohxp1d table:', sqlError);
        throw sqlError;
      }
    }
  },

  /**
   * Create the vendor configs table
   * @returns {Promise<void>}
   */
  async createVendorConfigsTable() {
    // In plaats van RPC, gebruiken we directe SQL-query
    const { error } = await supabase.from('vendor_configs_ohxp1d').insert({
      id: 'setup',
      config: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select();
    
    if (error && error.code === '42P01') {
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql_string: `
          CREATE TABLE IF NOT EXISTS vendor_configs_ohxp1d (
            id TEXT PRIMARY KEY,
            config JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (sqlError) {
        console.error('Error creating vendor_configs_ohxp1d table:', sqlError);
        throw sqlError;
      }
    }
  },
  
  /**
   * Create the vendors table for storing vendor information
   * @returns {Promise<void>}
   */
  async createVendorsTable() {
    try {
      console.log('Aanmaken vendors_ohxp1d tabel...');
      
      // Probeer eerst een query uit te voeren om te zien of de tabel bestaat
      const { error: checkError } = await supabase
        .from('vendors_ohxp1d')
        .select('count(*)')
        .limit(1);
      
      // Als de tabel niet bestaat, maken we deze aan
      if (checkError && checkError.code === '42P01') {
        console.log('Vendors tabel bestaat niet, wordt nu aangemaakt...');
        
        // Maak de tabel aan met een directe SQL query via de REST API
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }
        
        // Gebruik Postgres SQL via een POST request met de service role key
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.VITE_SUPABASE_ANON_KEY,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS public.vendors_ohxp1d (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              -- Voeg enkele testvendors toe voor ontwikkeling
              INSERT INTO public.vendors_ohxp1d (name, url, description)
              VALUES 
                ('ScrapingBee', 'https://www.scrapingbee.com', 'ScrapingBee API voor web scraping'),
                ('Puppeteer', 'https://pptr.dev', 'Directe browser crawling met Puppeteer'),
                ('Ferrum Audio', 'https://ferrum.audio', 'Voorbeeld website voor crawling tests')
              ON CONFLICT DO NOTHING;
            `
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error creating vendors_ohxp1d table:', errorData);
          throw new Error(`Failed to create vendors_ohxp1d table: ${JSON.stringify(errorData)}`);
        }
        
        console.log('vendors_ohxp1d tabel succesvol aangemaakt');
      } else {
        console.log('vendors_ohxp1d tabel bestaat al');
      }
    } catch (error) {
      console.error('Fout bij aanmaken vendors_ohxp1d tabel:', error);
      
      // Als alternatief, laten we een fallback implementatie proberen
      try {
        // Implementeer een fallback door direct een insert te doen en te kijken of het werkt
        const { error: insertError } = await supabase
          .from('vendors_ohxp1d')
          .insert([
            { name: 'ScrapingBee', url: 'https://www.scrapingbee.com', description: 'ScrapingBee API voor web scraping' },
            { name: 'Puppeteer', url: 'https://pptr.dev', description: 'Directe browser crawling met Puppeteer' },
            { name: 'Ferrum Audio', url: 'https://ferrum.audio', description: 'Voorbeeld website voor crawling tests' }
          ])
          .select();
        
        if (!insertError) {
          console.log('vendors_ohxp1d tabel bestaat en vendors toegevoegd');
        } else {
          throw insertError;
        }
      } catch (fallbackError) {
        console.error('Fallback voor vendors_ohxp1d tabel mislukt:', fallbackError);
        throw error; // Gooi de originele fout
      }
    }
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

export default db;