// src/services/crawlerService.js
import supabaseClient from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

class CrawlerService {
  async saveSettings(settings) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const { data, error } = await supabaseClient
      .from('pagepolly_x65isd_crawler_settings')
      .upsert({
        user_email: user.email,
        vendor_id: settings.vendor_id,
        max_pages: settings.max_pages,
        crawl_delay: settings.crawl_delay,
        allowed_domains: settings.allowed_domains,
        start_urls: settings.start_urls,
        exclude_patterns: settings.exclude_patterns
      }, { onConflict: 'vendor_id,user_email' });

    if (error) throw error;
    return data;
  }

  async getSettings(vendorId) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const { data, error } = await supabaseClient
      .from('pagepolly_x65isd_crawler_settings')
      .select('*')
      .eq('user_email', user.email)
      .eq('vendor_id', vendorId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async startCrawl(vendorId, apiKey) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const sessionId = uuidv4();
    
    // Debug log to verify parameters
    console.log('startCrawl called with:', { vendorId, apiKeyProvided: !!apiKey });
    
    if (!apiKey) {
      console.error('API key is undefined or null in startCrawl');
      throw new Error('API key is required to start a crawl');
    }
    
    // Ensure API key doesn't have any extra whitespace
    // Make sure apiKey is a string before calling trim()
    const cleanApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    
    // Additional validation
    if (!cleanApiKey) {
      console.error('API key is empty after trimming');
      throw new Error('API key cannot be empty');
    }
    
    console.log(`Using API key (last 4 chars): ...${cleanApiKey.slice(-4)}`);
    
    try {
      // Use our server-side proxy instead of direct Supabase Edge Function call
      const response = await fetch('/api/edge-functions/start-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendor_id: vendorId,
          user_email: user.email,
          session_id: sessionId,
          api_key: cleanApiKey  // Pass the cleaned API key to our proxy
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start crawler');
      }
      
      const data = await response.json();
      return { sessionId, ...data };
    } catch (error) {
      console.error('Error starting crawl:', error);
      throw error;
    }
  }

  async getCrawlResults(sessionId) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const { data, error } = await supabaseClient
      .from('pagepolly_x65isd_crawler_results')
      .select('*')
      .eq('user_email', user.email)
      .eq('crawl_session_id', sessionId);

    if (error) throw error;
    return data;
  }

  async stopCrawl(sessionId) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    try {
      // Use our server-side proxy instead of direct Supabase Edge Function call
      const response = await fetch('/api/edge-functions/stop-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_email: user.email
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to stop crawler');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error stopping crawl:', error);
      throw error;
    }
  }
}

export default new CrawlerService();