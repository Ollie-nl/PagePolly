// server/middlewares/supabaseEdgeProxy.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables if not already loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

const router = express.Router();

// Create Supabase client with service role key for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Proxy endpoint for 'start-crawler' Edge Function
router.post('/start-crawler', async (req, res) => {
  try {
    console.log('Proxy received request for start-crawler with body:', JSON.stringify(req.body));
    
    const { vendor_id, user_email, session_id, api_key } = req.body;
    
    if (!vendor_id || !user_email || !session_id || !api_key) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        message: 'Vendor ID, user email, session ID, and API key are required' 
      });
    }
    
    // Forward the request to Supabase Edge Function
    const { data, error } = await supabaseAdmin.functions.invoke('start-crawler', {
      body: {
        vendor_id,
        user_email,
        session_id,
        api_key
      }
    });
    
    if (error) {
      console.error('Supabase Edge Function error:', error);
      return res.status(500).json({ 
        error: 'Edge Function Error',
        message: error.message || 'Failed to invoke Edge Function'
      });
    }
    
    return res.json(data);
  } catch (err) {
    console.error('Error in Edge Function proxy:', err);
    return res.status(500).json({ 
      error: 'Proxy Error',
      message: err.message || 'An unexpected error occurred' 
    });
  }
});

// Proxy endpoint for 'stop-crawler' Edge Function
router.post('/stop-crawler', async (req, res) => {
  try {
    console.log('Proxy received request for stop-crawler with body:', JSON.stringify(req.body));
    
    const { session_id, user_email } = req.body;
    
    if (!session_id || !user_email) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        message: 'Session ID and user email are required' 
      });
    }
    
    // Forward the request to Supabase Edge Function
    const { data, error } = await supabaseAdmin.functions.invoke('stop-crawler', {
      body: {
        session_id,
        user_email
      }
    });
    
    if (error) {
      console.error('Supabase Edge Function error:', error);
      return res.status(500).json({ 
        error: 'Edge Function Error',
        message: error.message || 'Failed to invoke Edge Function'
      });
    }
    
    return res.json(data);
  } catch (err) {
    console.error('Error in Edge Function proxy:', err);
    return res.status(500).json({ 
      error: 'Proxy Error',
      message: err.message || 'An unexpected error occurred' 
    });
  }
});

module.exports = router;
