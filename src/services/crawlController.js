// src/services/crawlController.js
import supabaseClient from '../lib/supabaseClient';
import scrapingBeeService from './scrapingBeeService';

class CrawlController {
  constructor() {
    this.activeJobs = new Map();
  }

  async startCrawl(config, urls) {
    try {
      console.log('Starting crawl with config:', config);
      
      // Get current user
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const jobId = `crawl_${Date.now()}`;
      console.log('Generated jobId:', jobId);

      // Store job info
      this.activeJobs.set(jobId, {
        status: 'running',
        progress: 0,
        totalUrls: urls.length,
        completedUrls: 0,
        errors: []
      });

      // Create crawl session record
      const { data: session, error: sessionError } = await supabaseClient
        .from('pagepolly_x65isd_crawler_sessions')
        .insert([{
          job_id: jobId,
          user_email: user.email,
          status: 'running',
          config: config,
          start_time: new Date().toISOString(),
          urls: urls
        }])
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw new Error(`Failed to create crawl session: ${sessionError.message}`);
      }

      console.log('Created crawl session:', session);

      // Start crawling process
      this._processCrawl(jobId, session.id, config, urls);

      return {
        jobId,
        sessionId: session.id,
        status: 'started'
      };
    } catch (error) {
      console.error('Error in startCrawl:', error);
      throw new Error(`Failed to start crawl job: ${error.message}`);
    }
  }

  async _processCrawl(jobId, sessionId, config, urls) {
    const job = this.activeJobs.get(jobId);
    let lastError = null;

    try {
      console.log(`Starting crawl process for job ${jobId} with ${urls.length} URLs`);

      for (const url of urls) {
        if (job.status === 'stopped') {
          console.log(`Job ${jobId} was stopped, ending crawl`);
          break;
        }

        console.log(`Processing URL: ${url}`);

        try {
          const result = await scrapingBeeService.scrape(url, config.api_key, {
            renderJs: config.render_js || false,
            waitTime: config.crawl_delay || 1000,
            premiumProxy: config.premium_proxy || false
          });

          // Update progress
          job.completedUrls++;
          job.progress = Math.round((job.completedUrls / job.totalUrls) * 100);
          
          console.log(`Successfully crawled ${url}. Progress: ${job.progress}%`);

          // Save result to database
          await this._saveResult(sessionId, url, result);

        } catch (error) {
          console.error(`Error crawling ${url}:`, error);
          lastError = error;
          job.errors.push({ url, error: error.message });
          
          // Save error to database
          await this._saveResult(sessionId, url, null, error.message);
        }

        // Wait for specified delay
        const delay = config.crawl_delay || 2000;
        console.log(`Waiting ${delay}ms before next URL`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Update job status
      const finalStatus = job.errors.length === urls.length ? 'failed' : 'completed';
      await this._updateJobStatus(sessionId, finalStatus, lastError?.message);
      console.log(`Crawl job ${jobId} ${finalStatus}`);
      
    } catch (error) {
      console.error(`Fatal error in crawl job ${jobId}:`, error);
      await this._updateJobStatus(sessionId, 'failed', error.message);
      throw error;
    }
  }

  async _saveResult(sessionId, url, result, error = null) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      const { data, error: dbError } = await supabaseClient
        .from('pagepolly_x65isd_crawler_results')
        .insert([{
          session_id: sessionId,
          user_email: user.email,
          url: url,
          content: result?.data || null,
          status: error ? 'error' : 'success',
          error_message: error,
          credits_used: result?.credits || 0,
          crawled_at: new Date().toISOString()
        }]);

      if (dbError) {
        console.error('Error saving crawl result:', dbError);
        throw dbError;
      }

      return data;
    } catch (error) {
      console.error('Error in _saveResult:', error);
      throw new Error(`Failed to save crawl result: ${error.message}`);
    }
  }

  async _updateJobStatus(sessionId, status, error = null) {
    try {
      const { error: updateError } = await supabaseClient
        .from('pagepolly_x65isd_crawler_sessions')
        .update({
          status: status,
          end_time: new Date().toISOString(),
          error_message: error
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error updating job status:', updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('Error in _updateJobStatus:', error);
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  async stopCrawl(jobId) {
    try {
      console.log(`Stopping crawl job ${jobId}`);
      
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = 'stopped';
        this.activeJobs.delete(jobId);
        return { success: true, message: 'Crawl job stopped successfully' };
      } else {
        return { success: false, message: 'Crawl job not found' };
      }
    } catch (error) {
      console.error('Error stopping crawl:', error);
      throw new Error(`Failed to stop crawl job: ${error.message}`);
    }
  }

  getJobStatus(jobId) {
    const job = this.activeJobs.get(jobId);
    console.log(`Getting status for job ${jobId}:`, job);
    return job || null;
  }
}

export default new CrawlController();