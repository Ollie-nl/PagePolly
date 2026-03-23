// server/config/db.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const db = {
  // ── Crawl Jobs ──────────────────────────────────────────────

  async createCrawlJob(job) {
    const { id, userId, userEmail, vendorId, urls, status, progress, settings } = job;
    const { data, error } = await supabase
      .from('crawl_jobs')
      .insert({
        id,
        user_id:    userId,
        user_email: userEmail || userId,
        vendor_id:  vendorId || null,
        urls,
        status,
        progress,
        settings: settings || {},
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create crawl job: ${error.message}`);
    return data;
  },

  async updateCrawlJob(jobId, updates) {
    const updateData = {};
    if (updates.status !== undefined)         updateData.status = updates.status;
    if (updates.progress !== undefined)       updateData.progress = updates.progress;
    if (updates.error !== undefined)          updateData.error = updates.error;
    if (updates.completionTime !== undefined) updateData.completed_at = updates.completionTime;

    const { data, error } = await supabase
      .from('crawl_jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update crawl job: ${error.message}`);
    return data;
  },

  async getCrawlJob(jobId) {
    const { data: job, error } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw new Error(`Failed to get crawl job: ${error.message}`);
    if (!job) return null;

    if (['completed', 'partial'].includes(job.status)) {
      const [{ data: results }, { data: errors }] = await Promise.all([
        supabase.from('crawl_results').select('*').eq('job_id', jobId),
        supabase.from('crawl_errors').select('*').eq('job_id', jobId),
      ]);
      job.results = results || [];
      job.errors = errors || [];
    }

    return this._formatJob(job);
  },

  async getCrawlHistory(userId, filters = {}) {
    let query = supabase
      .from('crawl_jobs')
      .select('*')
      .eq('user_email', userId)
      .order('created_at', { ascending: false });

    if (filters.vendorId) query = query.eq('vendor_id', filters.vendorId);
    if (filters.status)   query = query.eq('status', filters.status);
    if (filters.limit)    query = query.limit(filters.limit);
    if (filters.offset)   query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get crawl history: ${error.message}`);
    return (data || []).map(j => this._formatJob(j));
  },

  // ── Crawl Results ───────────────────────────────────────────

  async storeCrawlResult(result) {
    const { jobId, vendorId, url, status, data, crawlDuration, retryCount } = result;
    const { data: stored, error } = await supabase
      .from('crawl_results')
      .insert({
        job_id: jobId,
        vendor_id: vendorId || null,
        url,
        status,
        data: data || {},
        crawl_duration: crawlDuration || 0,
        retry_count: retryCount || 0,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to store crawl result: ${error.message}`);
    return stored;
  },

  // ── Crawl Errors ────────────────────────────────────────────

  async recordCrawlError(jobId, url, errorMsg, isBlocking = false) {
    const { data, error } = await supabase
      .from('crawl_errors')
      .insert({ job_id: jobId, url, error: errorMsg, is_blocking: isBlocking })
      .select()
      .single();

    if (error) throw new Error(`Failed to record crawl error: ${error.message}`);
    return data;
  },

  // ── Vendors ─────────────────────────────────────────────────

  async getVendor(vendorId) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (error) throw new Error(`Failed to get vendor: ${error.message}`);
    return data;
  },

  async getVendors(userId) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get vendors: ${error.message}`);
    return data || [];
  },

  async createVendor(userId, vendorData) {
    const { data, error } = await supabase
      .from('vendors')
      .insert({ user_id: userId, ...vendorData })
      .select()
      .single();

    if (error) throw new Error(`Failed to create vendor: ${error.message}`);
    return data;
  },

  async updateVendor(vendorId, userId, updates) {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update vendor: ${error.message}`);
    return data;
  },

  async deleteVendor(vendorId, userId) {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendorId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete vendor: ${error.message}`);
  },

  // ── Helpers ─────────────────────────────────────────────────

  _formatJob(job) {
    return {
      id:             job.id,
      userId:         job.user_email,
      vendorId:       job.vendor_id,
      urls:           job.urls,
      status:         job.status,
      progress:       job.progress,
      settings:       job.settings,
      error:          job.error,
      startTime:      job.created_at,
      completionTime: job.completed_at,
      results:        job.results,
      errors:         job.errors,
    };
  },
};

module.exports = db;
