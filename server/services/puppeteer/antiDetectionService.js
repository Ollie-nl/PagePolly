// server/services/puppeteer/antiDetectionService.js
/**
 * Anti-Detection Service
 * Implements techniques to avoid bot detection during web crawling
 */
const antiDetectionService = {
  /**
   * Apply basic anti-detection measures to a page
   * @param {Object} page - Puppeteer page object
   * @param {Object} options - Anti-detection options
   */
  async applyAntiDetection(page, options = {}) {
    try {
      // Set a random user agent if specified
      if (options.userAgent === false) {
        // Use a random user agent from the list
        const randomUserAgent = options.userAgents[Math.floor(Math.random() * options.userAgents.length)];
        await page.setUserAgent(randomUserAgent);
      } else if (typeof options.userAgent === 'string') {
        // Use the specified user agent
        await page.setUserAgent(options.userAgent);
      }

      // Apply basic evasion techniques
      await page.evaluateOnNewDocument(() => {
        // Override navigator properties
        const originalNavigator = window.navigator;
        const modifiedNavigator = {};
        
        // Copy native navigator properties
        for (const prop in originalNavigator) {
          modifiedNavigator[prop] = originalNavigator[prop];
        }
        
        // Modify properties that are commonly used for fingerprinting
        Object.defineProperty(modifiedNavigator, 'webdriver', {
          get: () => false
        });
        
        Object.defineProperty(modifiedNavigator, 'plugins', {
          get: () => {
            const plugins = [];
            // Add fake plugins here if needed
            return plugins;
          }
        });
        
        Object.defineProperty(window, 'navigator', {
          value: modifiedNavigator,
          writable: false
        });
        
        // Hide automation
        if (window.chrome) {
          // Modify properties of chrome.runtime to avoid detection
          window.chrome.runtime = {};
        }
        
        // Overwrite permissions to prevent prompting
        if (navigator.permissions) {
          navigator.permissions.query = (parameters) => {
            return Promise.resolve({ state: "granted" });
          };
        }
      });
      
      // Apply WebGL fingerprinting protection
      if (options.webglFingerprinting) {
        await page.evaluateOnNewDocument(() => {
          // Modify WebGL to return random values
          const getParameterProto = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function(parameter) {
            // Randomize vendor and renderer info
            if (parameter === 37445) {
              return 'Intel Inc.';
            }
            if (parameter === 37446) {
              return 'Intel Iris Graphics 6100';
            }
            return getParameterProto.apply(this, arguments);
          };
        });
      }
      
      // Apply Canvas fingerprinting protection
      if (options.canvasFingerprinting) {
        await page.evaluateOnNewDocument(() => {
          // Add subtle noise to canvas data to prevent fingerprinting
          const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
          HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
            if (this.width > 16 && this.height > 16) {
              const ctx = this.getContext('2d');
              
              // Add a single pixel of random color
              const randomColor = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.1)`;
              ctx.fillStyle = randomColor;
              ctx.fillRect(
                Math.floor(Math.random() * this.width), 
                Math.floor(Math.random() * this.height), 
                1, 1
              );
            }
            return originalToDataURL.apply(this, arguments);
          };
          
          // Override getImageData to add noise
          const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
          CanvasRenderingContext2D.prototype.getImageData = function(x, y, width, height) {
            const imageData = originalGetImageData.call(this, x, y, width, height);
            
            // Add subtle noise to a few pixels
            if (width > 16 && height > 16) {
              for (let i = 0; i < 10; i++) {
                const offset = Math.floor(Math.random() * width * height * 4);
                if (offset < imageData.data.length - 4) {
                  imageData.data[offset] = imageData.data[offset] + (Math.random() * 2 - 1);
                  imageData.data[offset + 1] = imageData.data[offset + 1] + (Math.random() * 2 - 1);
                  imageData.data[offset + 2] = imageData.data[offset + 2] + (Math.random() * 2 - 1);
                }
              }
            }
            
            return imageData;
          };
        });
      }
      
      // Set hardware concurrency
      if (options.hardwareConcurrency) {
        await page.evaluateOnNewDocument((concurrency) => {
          Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => concurrency
          });
        }, options.hardwareConcurrency);
      }
      
      // Set device memory
      if (options.deviceMemory) {
        await page.evaluateOnNewDocument((memory) => {
          Object.defineProperty(navigator, 'deviceMemory', {
            get: () => memory
          });
        }, options.deviceMemory);
      }
      
      // Add mandatory HTTP headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Upgrade-Insecure-Requests': '1',
      });
      
      // Set viewport to standard desktop
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: true,
        isMobile: false,
      });
      
    } catch (error) {
      console.error('Error applying anti-detection measures:', error);
    }
  },
  
  /**
   * Apply enhanced anti-detection for when basic measures fail
   * @param {Object} page - Puppeteer page object
   * @param {Object} options - Anti-detection options
   */
  async applyEnhancedAntiDetection(page, options = {}) {
    try {
      // Apply basic measures first
      await this.applyAntiDetection(page, options);
      
      // Additional enhanced measures
      await page.evaluateOnNewDocument(() => {
        // Override Date to prevent time-based fingerprinting
        const originalDate = Date;
        const dateOverride = class extends originalDate {
          constructor(...args) {
            if (args.length === 0) {
              // Add a small random offset to the current time
              // This makes it harder to detect automation by timing patterns
              const offset = Math.floor(Math.random() * 100);
              super(Date.now() + offset);
            } else {
              super(...args);
            }
          }
        };
        
        // Replace Date constructor
        window.Date = dateOverride;
        
        // Override performance.now() to add jitter
        const originalPerformanceNow = performance.now;
        performance.now = function() {
          return originalPerformanceNow.call(this) + (Math.random() * 0.01);
        };
        
        // Override AudioContext to prevent audio fingerprinting
        if (window.AudioContext) {
          const originalAudioContext = window.AudioContext;
          window.AudioContext = class extends originalAudioContext {
            constructor(options) {
              super(options);
            }
            
            createOscillator() {
              const oscillator = super.createOscillator();
              oscillator.frequency.value += (Math.random() * 0.01);
              return oscillator;
            }
            
            getChannelData() {
              const result = super.getChannelData.apply(this, arguments);
              for (let i = 0; i < result.length; i += 100) {
                result[i] += Math.random() * 0.0001;
              }
              return result;
            }
          };
        }
        
        // Override WebRTC APIs to prevent IP leaks
        if (window.RTCPeerConnection) {
          const originalRTCPeerConnection = window.RTCPeerConnection;
          window.RTCPeerConnection = function(...args) {
            // Prevent WebRTC from exposing local IP
            const connection = new originalRTCPeerConnection(...args);
            
            const origCreateOffer = connection.createOffer;
            connection.createOffer = function(options) {
              // Modify SDP to mask IP addresses
              return origCreateOffer.apply(this, arguments)
                .then(offer => {
                  if (offer && offer.sdp) {
                    offer.sdp = offer.sdp.replace(/IP4 \d+\.\d+\.\d+\.\d+/g, 'IP4 0.0.0.0');
                  }
                  return offer;
                });
            };
            
            return connection;
          };
        }
        
        // Spoof screen properties
        const screenProps = {
          width: 1920,
          height: 1080,
          availWidth: 1920,
          availHeight: 1040,
          colorDepth: 24,
          pixelDepth: 24
        };
        
        for (const prop in screenProps) {
          Object.defineProperty(screen, prop, {
            get: () => screenProps[prop]
          });
        }
      });
      
      // Add random cookies to simulate previous browsing
      const commonCookies = [
        { name: '_ga', value: `GA1.2.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Math.random() * 1000000000)}` },
        { name: '_gid', value: `GA1.2.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Math.random() * 1000000000)}` },
        { name: 'visitor_id', value: `${Math.floor(Math.random() * 1000000000)}` }
      ];
      
      for (const cookie of commonCookies) {
        try {
          await page.setCookie({
            name: cookie.name,
            value: cookie.value,
            domain: (new URL(page.url())).hostname,
            path: '/',
            expires: Date.now() / 1000 + 3600
          });
        } catch (err) {
          // Ignore cookie errors - page might not have loaded yet
        }
      }
      
      // Change viewport to a slightly different size
      await page.setViewport({
        width: 1920 - Math.floor(Math.random() * 100),
        height: 1080 - Math.floor(Math.random() * 80),
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: true,
        isMobile: false,
      });
      
    } catch (error) {
      console.error('Error applying enhanced anti-detection measures:', error);
    }
  }
};

module.exports = antiDetectionService;