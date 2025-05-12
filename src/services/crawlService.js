// src/services/crawlService.js
import supabaseClient from '../lib/supabaseClient';

export const crawlService = {
  async startCrawl(url, userEmail) {
    const { data, error } = await supabaseClient
      .from('pagepolly_9gmsvd_crawl_jobs')
      .insert([
        {
          user_email: userEmail,
          url: url,
          status: 'pending',
          progress: 0,
          start_time: new Date().toISOString(),
          results: [],
          errors: []
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCrawlStatus(jobId) {
    const { data, error } = await supabaseClient
      .from('pagepolly_9gmsvd_crawl_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateCrawlStatus(jobId, status, progress = null, results = null, errors = null) {
    const updates = {
      status,
      ...(progress !== null && { progress }),
      ...(results && { results }),
      ...(errors && { errors })
    };

    if (['completed', 'failed'].includes(status)) {
      updates.completion_time = new Date().toISOString();
    }

    const { data, error } = await supabaseClient
      .from('pagepolly_9gmsvd_crawl_jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCrawlHistory(userEmail) {
    const { data, error } = await supabaseClient
      .from('pagepolly_9gmsvd_crawl_jobs')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCrawlResults(jobId) {
    const { data, error } = await supabaseClient
      .from('pagepolly_9gmsvd_crawl_jobs')
      .select('results')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data.results;
  },

  async addCrawlError(jobId, errorMessage) {
    const { data: currentJob } = await this.getCrawlStatus(jobId);
    const currentErrors = currentJob.errors || [];
    
    const { data, error } = await supabaseClient
      .from('pagepolly_9gmsvd_crawl_jobs')
      .update({
        errors: [...currentErrors, {
          timestamp: new Date().toISOString(),
          message: errorMessage
        }]
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};