// server/middleware/scrapingBeeProxy.js
import { createProxyMiddleware } from 'http-proxy-middleware';
import axios from 'axios';

/**
 * Creates a middleware that proxies requests to ScrapingBee API
 * 
 * @returns {Function} Express middleware that handles ScrapingBee proxy requests
 */
const createScrapingBeeProxy = () => {
  // ScrapingBee API key should be in environment variables
  const apiKey = process.env.SCRAPINGBEE_KEY;
  
  if (!apiKey) {
    console.error('ScrapingBee API key is not set in environment variables');
    // Rather than failing, we'll log a warning and continue with a null key
    // This will cause requests to fail, but the server can still start
  }

  // Create a proxy middleware for ScrapingBee
  const scrapingBeeProxy = createProxyMiddleware('/api/scrapingbee', {
    target: 'https://app.scrapingbee.com/api/v1',
    changeOrigin: true,
    pathRewrite: { '^/api/scrapingbee': '' },
    timeout: 30000,
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req) => {
      // Clean up the request URL and append the necessary ScrapingBee parameters
      const key = apiKey;
      const originalUrl = encodeURIComponent(req.query.url || '');
      const renderJs = req.query.render_js === 'true' || req.query.render_js === true ? 'true' : 'false';
      
      // Construct the query string for ScrapingBee
      const query = `?api_key=${key}&url=${originalUrl}&render_js=${renderJs}&json_response=true`;
      
      // Set the path for the proxy request
      proxyReq.path = query;
      
      // Log the proxy request for debugging
      console.log('ScrapingBee request path:', proxyReq.path);
      console.log('ScrapingBee target URL:', `https://app.scrapingbee.com/api/v1${proxyReq.path}`);
    },
    onProxyRes: (proxyRes) => {
      console.log('ScrapingBee response status:', proxyRes.statusCode);
      
      // Log response headers for debugging if needed
      if (process.env.NODE_ENV === 'development') {
        console.log('ScrapingBee response headers:', proxyRes.headers);
      }
    },
    onError: (err, req, res) => {
      console.error('ScrapingBee proxy error:', err);
      
      // Return a proper error response
      res.status(500).json({
        success: false,
        error: 'ScrapingBee Proxy Error',
        message: 'Failed to fetch data from ScrapingBee API',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // Create a wrapper that will handle both proxy requests and fallback to direct axios if needed
  return (req, res, next) => {
    // Extract the URL from the query parameters
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'URL parameter is required'
      });
    }

    // Use the proxy middleware as the primary method
    try {
      scrapingBeeProxy(req, res, async (err) => {
        // If the proxy fails, try a direct axios call as fallback
        if (err) {
          console.warn('ScrapingBee proxy failed, attempting direct axios fallback:', err.message);
          
          try {
            const response = await axios.get('https://app.scrapingbee.com/api/v1', { 
              params: { 
                api_key: apiKey, 
                url: targetUrl, 
                render_js: req.query.render_js === 'true' || req.query.render_js === true,
                json_response: true 
              },
              timeout: 30000
            });
            
            console.log('ScrapingBee axios fallback successful');
            return res.json(response.data);
          } catch (axiosError) {
            console.error('ScrapingBee axios fallback failed:', axiosError.message);
            
            return res.status(axiosError.response?.status || 500).json({
              success: false,
              error: 'ScrapingBee Request Failed',
              message: axiosError.message,
              details: process.env.NODE_ENV === 'development' 
                ? axiosError.response?.data || axiosError.message 
                : undefined
            });
          }
        }
      });
    } catch (proxySetupError) {
      console.error('Failed to setup ScrapingBee proxy:', proxySetupError);
      next(proxySetupError);
    }
  };
};

export default createScrapingBeeProxy;