// server/config/db.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Database service for crawl operations
 */
class DBService {
  /**
   * Create a new crawl job record
   * @param {Object} job - Job details
   * @returns {Object} - Created job record
   */
  async createCrawlJob(job) {
    const { data, error } = await supabase
      .from('crawl_jobs')
      .insert([{
        id: job.id,
        project_id: job.projectId,
        user_id: job.userId,
        status: job.status,
        progress: job.progress,
        urls: job.urls,
        start_time: job.startTime
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing crawl job
   * @param {string} jobId - ID of job to update
   * @param {Object} updates - Fields to update
   * @returns {Object} - Updated job record
   */
  async updateCrawlJob(jobId, updates) {
    const updateData = {};
    
    // Map updates to database column names
    if (updates.status) updateData.status = updates.status;
    if (updates.progress) updateData.progress = updates.progress;
    if (updates.results) updateData.results = updates.results;
    if (updates.completionTime) updateData.completion_time = updates.completionTime;
    if (updates.error) updateData.error = updates.error;
    
    const { data, error } = await supabase
      .from('crawl_jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get a specific crawl job
   * @param {string} jobId - ID of job to retrieve
   * @returns {Object|null} - Job record or null if not found
   */
  async getCrawlJob(jobId) {
    const { data, error } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Record not found
      throw error;
    }
    
    return {
      id: data.id,
      projectId: data.project_id,
      userId: data.user_id,
      status: data.status,
      progress: data.progress,
      urls: data.urls,
      startTime: data.start_time,
      completionTime: data.completion_time,
      results: data.results || [],
      errors: data.errors || []
    };
  }

  /**
   * Record a crawl error
   * @param {string} jobId - Job ID
   * @param {string} url - URL that caused the error
   * @param {string} errorMessage - Error message
   */
  async recordCrawlError(jobId, url, errorMessage) {
    const { data, error } = await supabase
      .from('crawl_jobs')
      .select('errors')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    
    const errors = data.errors || [];
    errors.push({ url, error: errorMessage, time: new Date() });
    
    await supabase
      .from('crawl_jobs')
      .update({ errors })
      .eq('id', jobId);
  }

  /**
   * Get crawl history for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filters to apply
   * @returns {Array} - List of jobs
   */
  async getCrawlHistory(userId, filters = {}) {
    let query = supabase
      .from('crawl_jobs')
      .select('id, project_id, status, progress, start_time, completion_time, urls, error')
      .eq('user_id', userId);
    
    // Apply filters
    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query
      .order('start_time', { ascending: false })
      .range(from, to);
    
    const { data, error } = await query;

    if (error) throw error;
    
    // Map to camelCase for frontend
    return data.map(job => ({
      id: job.id,
      projectId: job.project_id,
      status: job.status,
      progress: job.progress,
      startTime: job.start_time,
      completionTime: job.completion_time,
      urlCount: job.urls?.length || 0,
      error: job.error
    }));
  }

  /**
   * Initialize database with required tables
   */
  async initializeDatabase() {
    // Check if crawl_jobs table exists, create if not
    const { error: tableExistsError } = await supabase
      .from('crawl_jobs')
      .select('id')
      .limit(1);
    
    if (tableExistsError && tableExistsError.code === 'PGRST104') {
      // Table does not exist, create it
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS crawl_jobs (
          id UUID PRIMARY KEY,
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          status TEXT NOT NULL,
          progress INTEGER DEFAULT 0,
          urls TEXT[] NOT NULL,
          results JSONB DEFAULT '[]',
          errors JSONB DEFAULT '[]',
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          completion_time TIMESTAMP WITH TIME ZONE,
          error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS crawl_jobs_project_id_idx ON crawl_jobs(project_id);
        CREATE INDEX IF NOT EXISTS crawl_jobs_user_id_idx ON crawl_jobs(user_id);
        CREATE INDEX IF NOT EXISTS crawl_jobs_status_idx ON crawl_jobs(status);
        
        ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own crawl jobs"
          ON crawl_jobs FOR SELECT
          USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create crawl jobs for their projects"
          ON crawl_jobs FOR INSERT
          WITH CHECK (auth.uid() = user_id AND EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_id AND user_id = auth.uid()
          ));
        
        CREATE POLICY "Service role can update crawl jobs"
          ON crawl_jobs FOR UPDATE
          USING (auth.uid() = user_id OR auth.jwt() ? auth.jwt()->>'role' = 'service_role');
          
        CREATE POLICY "Users can delete their own crawl jobs"
          ON crawl_jobs FOR DELETE
          USING (auth.uid() = user_id);
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (error) {
        console.error("Failed to create crawl_jobs table:", error);
        throw error;
      }
      
      console.log("Crawl jobs table created successfully");
    }
  }
}

// Create singleton instance
const dbService = new DBService();

// Initialize database on startup
dbService.initializeDatabase()
  .then(() => console.log('Database initialized successfully'))
  .catch(err => console.error('Database initialization failed:', err));

module.exports = dbService;