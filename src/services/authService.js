// src/services/authService.js
import supabaseClient from '../lib/supabaseClient';

class AuthService {
  async signUp(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async signOut() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      return { session: null, error: error.message };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }
}

export default new AuthService();