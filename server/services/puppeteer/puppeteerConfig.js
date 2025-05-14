// server/services/puppeteer/puppeteerConfig.js

/**
 * Configuration settings for Puppeteer crawler
 * Includes options to manage anti-detection strategies, browser settings, and resource handling
 */

const puppeteerConfig = {
  // Browser launch options
  launchOptions: {
    headless: 'new', // Use new headless mode for better performance
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  },

  // Page navigation settings
  navigationOptions: {
    waitUntil: 'networkidle2',
    timeout: 30000, // Default timeout of 30 seconds
  },

  // Anti-detection settings
  antiDetection: {
    // User agent rotation (set to false to use random user agents)
    userAgent: false,
    
    // List of user agents to randomly select from when userAgent is false
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0'
    ],
    
    // Configure random delays between actions to simulate human behavior
    humanBehavior: {
      enabled: true,
      minDelay: 300, // Minimum delay in ms
      maxDelay: 1200, // Maximum delay in ms
      mouseMoveDelay: 1000, // Move mouse before clicking (ms)
      scrollDelay: 500, // Delay between scroll events
    },
    
    // WebGL fingerprinting protection
    webglFingerprinting: true,
    
    // Canvas fingerprinting protection
    canvasFingerprinting: true,
    
    // Hardware concurrency and device memory
    hardwareConcurrency: 4,
    deviceMemory: 8,
    
    // Browser plugins randomization
    plugins: [],
  },

  // Resource management
  resourceManagement: {
    // Block resource types for faster crawling and to avoid detection
    blockedResources: ['image', 'media', 'font'],
    
    // Exceptions - resources that should always be loaded
    allowedDomains: [], // e.g. ['cdn.example.com', 'api.example.com']
  },
  
  // Proxy settings (when enabled)
  proxy: {
    enabled: false,
    rotationEnabled: false, // Set to true to rotate proxies
    rotationInterval: 5, // Number of requests before rotating proxy
    pool: [
      // Example proxy entries - replace with actual proxies if using
      // { host: 'proxy.example.com', port: 8080, username: 'user', password: 'pass' },
    ],
  },
  
  // Retry settings for failed requests
  retry: {
    maxRetries: 3,
    initialDelay: 2000, // Initial retry delay in ms
    maxDelay: 10000, // Maximum retry delay in ms
    factor: 2, // Exponential backoff factor
  },
  
  // Screenshot settings
  screenshots: {
    enabled: true,
    fullPage: true,
    encoding: 'base64',
    quality: 80,
  },
  
  // Cookie settings
  cookies: {
    preserve: true, // Preserve cookies between sessions
  },
  
  // Storage settings (localStorage, sessionStorage)
  storage: {
    preserve: true,
  },
  
  // Timeout settings
  timeouts: {
    navigation: 30000, // Navigation timeout in ms
    waitForSelector: 10000, // Wait for selector timeout in ms
    execution: 120000, // Total execution timeout per URL in ms
  }
};

module.exports = puppeteerConfig;