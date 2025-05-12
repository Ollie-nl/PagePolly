// src/services/database.js
import supabaseClient from '../lib/supabaseClient';

export class DatabaseService {
  // Projects
  static async createProject({ name, description }) {
    try {
      const { data: project, error } = await supabaseClient
        .from('projects')
        .insert([{ name, description }])
        .select()
        .single();

      if (error) throw error;
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  static async getProjects() {
    try {
      const { data: projects, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  static async getProject(id) {
    try {
      const { data: project, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return project;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  static async updateProject(id, updates) {
    try {
      const { data: project, error } = await supabaseClient
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return project;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  static async deleteProject(id) {
    try {
      const { error } = await supabaseClient
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Pages
  static async createPage({ projectId, title }) {
    try {
      const { data: page, error } = await supabaseClient
        .from('pages')
        .insert([{ project_id: projectId, title }])
        .select()
        .single();

      if (error) throw error;
      return page;
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  }

  static async getPages(projectId) {
    try {
      const { data: pages, error } = await supabaseClient
        .from('pages')
        .select('*')
        .eq('project_id', projectId)
        .order('order', { ascending: true });

      if (error) throw error;
      return pages;
    } catch (error) {
      console.error('Error fetching pages:', error);
      throw error;
    }
  }

  static async updatePage(id, updates) {
    try {
      const { data: page, error } = await supabaseClient
        .from('pages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return page;
    } catch (error) {
      console.error('Error updating page:', error);
      throw error;
    }
  }

  static async deletePage(id) {
    try {
      const { error } = await supabaseClient
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting page:', error);
      throw error;
    }
  }

  static async updatePageOrder(pageId, newOrder) {
    try {
      const { data: page, error } = await supabaseClient
        .from('pages')
        .update({ order: newOrder })
        .eq('id', pageId)
        .select()
        .single();

      if (error) throw error;
      return page;
    } catch (error) {
      console.error('Error updating page order:', error);
      throw error;
    }
  }

  // Elements
  static async createElement({ pageId, type, content }) {
    try {
      const { data: element, error } = await supabaseClient
        .from('elements')
        .insert([{ page_id: pageId, type, content }])
        .select()
        .single();

      if (error) throw error;
      return element;
    } catch (error) {
      console.error('Error creating element:', error);
      throw error;
    }
  }

  static async getElements(pageId) {
    try {
      const { data: elements, error } = await supabaseClient
        .from('elements')
        .select('*')
        .eq('page_id', pageId)
        .order('order', { ascending: true });

      if (error) throw error;
      return elements;
    } catch (error) {
      console.error('Error fetching elements:', error);
      throw error;
    }
  }

  static async updateElement(id, updates) {
    try {
      const { data: element, error } = await supabaseClient
        .from('elements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return element;
    } catch (error) {
      console.error('Error updating element:', error);
      throw error;
    }
  }

  static async deleteElement(id) {
    try {
      const { error } = await supabaseClient
        .from('elements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting element:', error);
      throw error;
    }
  }

  static async updateElementOrder(elementId, newOrder) {
    try {
      const { data: element, error } = await supabaseClient
        .from('elements')
        .update({ order: newOrder })
        .eq('id', elementId)
        .select()
        .single();

      if (error) throw error;
      return element;
    } catch (error) {
      console.error('Error updating element order:', error);
      throw error;
    }
  }

  // Vendors
  static async createVendor({ name, url, description }) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user?.email) throw new Error('User not authenticated');

      const { data: vendor, error } = await supabaseClient
        .from('pagepolly_el57ad_vendors')
        .insert([{ 
          name, 
          url, 
          description,
          user_email: user.email
        }])
        .select()
        .single();

      if (error) throw error;
      return vendor;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  }

  static async getVendors() {
    try {
      const { data: vendors, error } = await supabaseClient
        .from('pagepolly_el57ad_vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return vendors;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  }

  static async updateVendor(id, updates) {
    try {
      const { data: vendor, error } = await supabaseClient
        .from('pagepolly_el57ad_vendors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return vendor;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  }

  static async deleteVendor(id) {
    try {
      const { error } = await supabaseClient
        .from('pagepolly_el57ad_vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  }
}