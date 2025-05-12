// src/hooks/useAuth.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import supabaseClient from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
        navigate('/');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    try {
      const { session, error } = await authService.getSession();
      if (error) throw error;
      
      if (session) {
        const { user: currentUser } = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await authService.signIn(email, password);
    setLoading(false);
    return { data, error };
  };

  const register = async (email, password) => {
    setLoading(true);
    const { data, error } = await authService.signUp(email, password);
    setLoading(false);
    return { data, error };
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await authService.signOut();
    setLoading(false);
    return { error };
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};