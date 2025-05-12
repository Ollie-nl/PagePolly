// src/services/databaseService.js
import supabaseClient from '../lib/supabaseClient';

class DatabaseService {
  // Sites
  async createSite(siteData) {
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const { data, error } = await supabaseClient
        .from('pagepolly_o27hnd_sites')
        .insert([{ ...siteData, user_email: session.session.user.email }])
        .select();
      
      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async getSites() {
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const { data, error } = await supabaseClient
        .from('pagepolly_o27hnd_sites')
        .select('*')
        .eq('user_email', session.session.user.email);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async updateSite(siteId, updates) {
    try {
      const { data, error } = await supabaseClient
        .from('pagepolly_o27hnd_sites')
        .update(updates)
        .eq('id', siteId)
        .select();
      
      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async deleteSite(siteId) {
    try {
      const { error } = await supabaseClient
        .from('pagepolly_o27hnd_sites')
        .delete()
        .eq('id', siteId);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Crawls
  async createCrawl(crawlData) {
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const { data, error } = await supabaseClient
        .from('pagepolly_o27hnd_crawls')
        .insert([{ ...crawlData, user_email: session.session.user.email }])
        .select();
      
      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async getCrawls(siteId = null) {
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      let query = supabaseClient
        .from('pagepolly_o27hnd_crawls')
        .select('*')
        .eq('user_email', session.session.user.email);
      
      if (siteId) {
        query = query.eq('site_id', siteId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async updateCrawl(crawlId, updates) {
    try {
      const { data, error } = await supabaseClient
        .from('pagepolly_o27hnd_crawls')
        .update(updates)
        .eq('id', crawlId)
        .select();
      
      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async deleteCrawl(crawlId) {
    try {
      const { error } = await supabaseClient
        .from('pagepolly_o27hnd_crawls')
        .delete()
        .eq('id', crawlId);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }
}

export default new DatabaseService();