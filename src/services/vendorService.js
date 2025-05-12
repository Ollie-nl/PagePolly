// src/services/vendorService.js
import supabaseClient from '../lib/supabaseClient';

export const vendorService = {
  async createVendor(name, websiteUrl) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabaseClient
      .from('pagepolly_9gmsvd_vendors')
      .insert([
        {
          name,
          website_url: websiteUrl,
          user_email: user.email,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getVendors() {
    const { data, error } = await supabaseClient
      .from('pagepolly_9gmsvd_vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getVendorById(id) {
    const { data, error } = await supabaseClient
      .from('pagepolly_9gmsvd_vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateVendorStatus(id, status) {
    const { data, error } = await supabaseClient
      .from('pagepolly_9gmsvd_vendors')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};