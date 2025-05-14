// server/services/puppeteer/humanBehaviorSimulator.js
/**
 * Human Behavior Simulator
 * Implements techniques to simulate human-like behavior during web crawling
 * to avoid detection by anti-bot systems
 */
const humanBehaviorSimulator = {
  /**
   * Simulate human-like browsing behavior
   * @param {Object} page - Puppeteer page object
   * @param {Object} options - Human behavior simulation options
   * @returns {Promise<void>}
   */
  async simulateHumanBehavior(page, options = {}) {
    try {
      // Default behavior options
      const settings = {
        minDelay: options.minDelay || 300,
        maxDelay: options.maxDelay || 1200,
        mouseMoveDelay: options.mouseMoveDelay || 1000,
        scrollDelay: options.scrollDelay || 500,
      };

      // Get page dimensions
      const dimensions = await page.evaluate(() => {
        return {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight,
          scrollHeight: document.documentElement.scrollHeight,
        };
      });

      // Random scroll behavior
      await this.simulateScrolling(page, dimensions, settings);

      // Random mouse movements
      await this.simulateMouseMovements(page, dimensions, settings);

      // Look for interactive elements and possibly interact with them
      await this.simulateElementInteractions(page, settings);

      // Final natural pause
      await this.randomDelay(settings.minDelay, settings.maxDelay);
    } catch (error) {
      console.error('Error simulating human behavior:', error);
    }
  },

  /**
   * Simulate realistic scrolling behavior
   * @param {Object} page - Puppeteer page object
   * @param {Object} dimensions - Page dimensions
   * @param {Object} settings - Behavior settings
   * @returns {Promise<void>}
   */
  async simulateScrolling(page, dimensions, settings) {
    try {
      const { scrollHeight, height } = dimensions;
      if (scrollHeight <= height) {
        // No need to scroll on short pages
        return;
      }

      // Calculate a realistic number of scroll actions based on page length
      const scrollRatio = scrollHeight / height;
      const scrollActions = Math.min(
        Math.max(2, Math.floor(scrollRatio * (0.5 + Math.random() * 0.5))),
        8 // Cap at 8 scroll actions to avoid excessive scrolling
      );

      // Calculate approximate scroll distances
      const scrollDistances = [];
      let remainingDistance = scrollHeight - height;
      let currentPosition = 0;

      // Generate random scroll distances that sum up to total scroll height
      for (let i = 0; i < scrollActions - 1; i++) {
        // Random proportion of remaining distance to scroll
        const proportion = 0.1 + Math.random() * 0.3; // 10-40% of remaining
        const distance = Math.floor(remainingDistance * proportion);
        scrollDistances.push(distance);
        remainingDistance -= distance;
        currentPosition += distance;
      }

      // Add final scroll to reach bottom if needed
      if (remainingDistance > 0) {
        scrollDistances.push(remainingDistance);
      }

      // Execute scrolls with natural delays
      for (const distance of scrollDistances) {
        // Scroll with a smooth behavior
        await page.evaluate((scrollDistance) => {
          window.scrollBy({
            top: scrollDistance,
            behavior: 'smooth'
          });
        }, distance);

        // Pause as if reading content
        const readingTime = settings.minDelay + Math.random() * (settings.maxDelay - settings.minDelay);
        await page.waitForTimeout(readingTime);
      }

      // Occasionally scroll back up a bit
      if (Math.random() < 0.5) {
        const upScrollDistance = -Math.floor((200 + Math.random() * 300));
        await page.evaluate((scrollDistance) => {
          window.scrollBy({
            top: scrollDistance,
            behavior: 'smooth'
          });
        }, upScrollDistance);
        await page.waitForTimeout(settings.scrollDelay);
      }
    } catch (error) {
      console.error('Error simulating scrolling:', error);
    }
  },

  /**
   * Simulate realistic mouse movements
   * @param {Object} page - Puppeteer page object
   * @param {Object} dimensions - Page dimensions
   * @param {Object} settings - Behavior settings
   * @returns {Promise<void>}
   */
  async simulateMouseMovements(page, dimensions, settings) {
    try {
      const { width, height } = dimensions;

      // Generate 2-4 random points on the page
      const movementCount = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < movementCount; i++) {
        // Generate random coordinates
        const x = Math.floor(Math.random() * (width - 100) + 50); // Stay away from edges
        const y = Math.floor(Math.random() * (Math.min(height, 800) - 100) + 50); // Limit to visible area

        // Move mouse to point with smooth motion
        await page.mouse.move(x, y, { steps: 10 + Math.floor(Math.random() * 15) });
        
        // Small pause between movements
        await page.waitForTimeout(50 + Math.random() * 200);
      }
    } catch (error) {
      console.error('Error simulating mouse movements:', error);
    }
  },

  /**
   * Simulate interactions with page elements
   * @param {Object} page - Puppeteer page object
   * @param {Object} settings - Behavior settings
   * @returns {Promise<void>}
   */
  async simulateElementInteractions(page, settings) {
    try {
      // Find visible, interactive elements like buttons and links
      // but avoid actually clicking links that navigate away
      const interactiveElements = await page.evaluate(() => {
        const elements = [];
        
        // Find buttons that don't look like submit buttons
        const buttons = document.querySelectorAll('button:not([type="submit"]):not([form]), [role="button"]');
        
        // Look for elements that appear to be tabs, accordions, or expandable sections
        const clickableItems = document.querySelectorAll('[role="tab"], [aria-expanded], .accordion-header, .tab');
        
        // Convert to array and filter to visible elements
        const allElements = [...buttons, ...clickableItems];
        
        for (const el of allElements) {
          // Skip invisible elements or those that look like navigation
          if (!isElementVisible(el) || 
              el.textContent.toLowerCase().includes('sign') || 
              el.textContent.toLowerCase().includes('login') ||
              el.textContent.toLowerCase().includes('submit')) {
            continue;
          }
          
          const rect = el.getBoundingClientRect();
          elements.push({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height,
            tagName: el.tagName,
            textContent: el.textContent.trim().substring(0, 20)
          });
        }
        
        // Function to check if an element is visible
        function isElementVisible(el) {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 style.opacity !== '0' &&
                 el.offsetWidth > 0 &&
                 el.offsetHeight > 0;
        }
        
        return elements;
      });
      
      // Maybe interact with some random element
      if (interactiveElements.length > 0 && Math.random() < 0.3) {
        // Select a random element
        const element = interactiveElements[Math.floor(Math.random() * interactiveElements.length)];
        
        // Move mouse to element
        await page.mouse.move(element.x, element.y, { steps: 10 });
        await page.waitForTimeout(200 + Math.random() * 300);
        
        // Click element
        await page.mouse.click(element.x, element.y);
        
        // Wait for potential animations or content changes
        await page.waitForTimeout(500 + Math.random() * 1000);
      }
    } catch (error) {
      console.error('Error simulating element interactions:', error);
      // Continue even if this fails - it's optional behavior
    }
  },

  /**
   * Helper function to introduce random delays
   * @param {number} min - Minimum delay in milliseconds
   * @param {number} max - Maximum delay in milliseconds
   * @returns {Promise<void>}
   */
  async randomDelay(min, max) {
    const delay = Math.floor(min + Math.random() * (max - min));
    return new Promise(resolve => setTimeout(resolve, delay));
  }
};

module.exports = humanBehaviorSimulator;