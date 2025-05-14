// server/services/puppeteer/proxyRotationService.js
/**
 * ProxyRotationService manages a pool of proxies and rotation for the crawler
 */
class ProxyRotationService {
  /**
   * Create a new ProxyRotationService instance
   * @param {Array<string>} proxies - List of proxy URLs
   * @param {Object} proxyAuth - Proxy authentication credentials
   */
  constructor(proxies = [], proxyAuth = null) {
    this.proxies = proxies;
    this.proxyAuth = proxyAuth;
    this.currentProxyIndex = 0;
    this.failedProxies = new Set();
    this.proxyStatus = new Map(); // Store status and performance metrics
  }

  /**
   * Get the next available proxy from the list
   * @returns {string|null} Next proxy URL or null if none available
   */
  getNextProxy() {
    if (!this.proxies || this.proxies.length === 0) {
      return null;
    }

    // Skip failed proxies
    let attempts = 0;
    while (attempts < this.proxies.length) {
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
      const proxy = this.proxies[this.currentProxyIndex];
      
      // Skip if this proxy has been marked as failed
      if (this.failedProxies.has(proxy)) {
        attempts++;
        continue;
      }
      
      return proxy;
    }

    // If all proxies failed, try to recover the least recently failed one
    if (this.failedProxies.size > 0) {
      this.recoverFailedProxy();
      return this.getNextProxy();
    }
    
    return null;
  }

  /**
   * Apply the current proxy to a Puppeteer page
   * @param {Page} page - Puppeteer page
   * @returns {Promise<void>}
   */
  async applyToPage(page) {
    const proxy = this.getNextProxy();
    
    if (!proxy) {
      console.log('No proxy available, connecting directly');
      return;
    }
    
    console.log(`Applying proxy: ${this.maskProxyUrl(proxy)}`);
    
    try {
      // Extract username and password if provided in proxy URL
      // Format: protocol://username:password@host:port
      let proxyAuth = this.proxyAuth;
      const proxyUrlRegex = /^(https?:\/\/)?(?:(.+):(.+)@)?(.+?)(?::(\d+))?$/i;
      const match = proxy.match(proxyUrlRegex);
      
      if (match && match[2] && match[3]) {
        proxyAuth = { username: match[2], password: match[3] };
      }
      
      // If authentication is needed, set it
      if (proxyAuth) {
        await page.authenticate({
          username: proxyAuth.username,
          password: proxyAuth.password
        });
      }
      
      // Note: The actual proxy server needs to be set when launching the browser
      // This method is mainly for authentication, the proxy URL itself is used
      // in the puppeteerManager when launching the browser
      
      // Store the active proxy with the page for reference
      page._activeProxy = proxy;
      
    } catch (error) {
      console.error(`Error applying proxy ${this.maskProxyUrl(proxy)}:`, error);
      this.handleProxyFailure(proxy);
    }
  }

  /**
   * Test if a proxy is working
   * @param {string} proxy - Proxy URL to test
   * @returns {Promise<boolean>} Whether the proxy is working
   */
  async testProxy(proxy) {
    const fetch = require('node-fetch');
    const HttpsProxyAgent = require('https-proxy-agent');

    try {
      // Set up proxy agent
      const proxyAgent = new HttpsProxyAgent(proxy);
      
      // Test with a reliable endpoint
      const startTime = Date.now();
      const response = await fetch('https://httpbin.org/ip', {
        agent: proxyAgent,
        timeout: 10000 // 10 seconds timeout
      });
      const endTime = Date.now();
      
      if (response.ok) {
        const data = await response.json();
        
        // Update proxy status metrics
        this.proxyStatus.set(proxy, {
          lastChecked: Date.now(),
          responseTime: endTime - startTime,
          lastStatus: 'ok',
          origin: data.origin // IP address reported by the test service
        });
        
        // If previously failed, remove from failed list
        if (this.failedProxies.has(proxy)) {
          this.failedProxies.delete(proxy);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Proxy test failed for ${this.maskProxyUrl(proxy)}:`, error.message);
      
      // Update status
      this.proxyStatus.set(proxy, {
        lastChecked: Date.now(),
        lastStatus: 'failed',
        error: error.message
      });
      
      return false;
    }
  }

  /**
   * Refresh the proxy list from the provider or configuration
   * @returns {Promise<void>}
   */
  async refreshProxyList() {
    // Implement proxy list refresh logic here
    // This could fetch from an API, read from a file, etc.
    
    // For demonstration, we'll just log and test existing proxies
    console.log('Refreshing proxy list...');
    
    // Test all proxies in parallel
    const testResults = await Promise.allSettled(
      this.proxies.map(proxy => this.testProxy(proxy))
    );
    
    // Count working proxies
    const workingProxies = testResults.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;
    
    console.log(`Proxy refresh complete. ${workingProxies}/${this.proxies.length} proxies working`);
  }

  /**
   * Handle a proxy failure by marking it and potentially rotating
   * @param {string} proxy - Failed proxy URL
   */
  handleProxyFailure(proxy) {
    if (!proxy) return;
    
    console.log(`Marking proxy as failed: ${this.maskProxyUrl(proxy)}`);
    
    // Add to failed set
    this.failedProxies.add(proxy);
    
    // Update status
    this.proxyStatus.set(proxy, {
      ...(this.proxyStatus.get(proxy) || {}),
      lastChecked: Date.now(),
      lastStatus: 'failed',
      failureTime: Date.now()
    });
    
    // If too many failed proxies, try to recover some
    if (this.failedProxies.size > this.proxies.length / 2) {
      this.recoverFailedProxy();
    }
  }

  /**
   * Attempt to recover the oldest failed proxy
   */
  recoverFailedProxy() {
    if (this.failedProxies.size === 0) return;
    
    // Find the oldest failed proxy to recover (first in, first out)
    let oldestFailureTime = Infinity;
    let proxyToRecover = null;
    
    for (const proxy of this.failedProxies) {
      const status = this.proxyStatus.get(proxy);
      if (status && status.failureTime && status.failureTime < oldestFailureTime) {
        oldestFailureTime = status.failureTime;
        proxyToRecover = proxy;
      }
    }
    
    if (proxyToRecover) {
      console.log(`Attempting to recover proxy: ${this.maskProxyUrl(proxyToRecover)}`);
      this.failedProxies.delete(proxyToRecover);
    }
  }

  /**
   * Mask a proxy URL for safe logging (hide credentials)
   * @param {string} proxyUrl - Proxy URL to mask
   * @returns {string} Masked proxy URL
   */
  maskProxyUrl(proxyUrl) {
    if (!proxyUrl) return 'null';
    
    try {
      // Replace username:password with ***:***
      return proxyUrl.replace(/(https?:\/\/)?([^:@]+:[^@]+@)?(.+)/, (_match, protocol, auth, rest) => {
        return `${protocol || ''}${auth ? '***:***@' : ''}${rest}`;
      });
    } catch (error) {
      return 'invalid-proxy-url';
    }
  }
}

module.exports = ProxyRotationService;