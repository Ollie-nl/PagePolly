# PagePolly Puppeteer Crawler System Design

## Implementation approach

To address the current 503 error issues in PagePolly, we'll implement a robust Puppeteer-based crawler with advanced anti-blocking mechanisms. This approach offers several advantages over the current implementation:

1. **Full browser automation**: Puppeteer provides a complete browser environment, making detection more difficult for anti-bot systems.
2. **Anti-detection capabilities**: We'll implement various techniques to mimic human behavior and avoid common fingerprinting methods.
3. **Configurable settings**: The system will allow per-vendor customization of crawling parameters to optimize for different websites.
4. **Resilient architecture**: Our design includes retry mechanisms, proxy rotation, and other reliability features.

### Technology Stack

- **Core Crawler**: Puppeteer with puppeteer-extra plugins (stealth, adblocker)
- **Server**: Node.js with Express.js
- **Database**: PostgreSQL via Supabase
- **Backend Architecture**: Modular design with separation of concerns
- **Monitoring**: Custom dashboard for crawl statistics and performance metrics

### Key Components

1. **PuppeteerManager**: Handles browser lifecycle, page creation, and anti-detection techniques
2. **CrawlerService**: Core service for executing crawl jobs with retry logic
3. **AntiDetectionService**: Manages various techniques to avoid detection
4. **ProxyRotationService**: Handles proxy management and rotation
5. **HumanBehaviorSimulator**: Simulates realistic user behavior
6. **CrawlAPI**: RESTful endpoints for managing crawl jobs
7. **ConfigurationManager**: Manages per-vendor crawl settings

## Data structures and interfaces

The system will use a modular architecture with clear interfaces between components. The core data structures and interfaces are defined in our class diagram (see puppeteer_crawler_class_diagram.mermaid).

### Key Data Structures

- **PuppeteerConfig**: Configuration for browser instances and anti-detection techniques
- **CrawlJob**: Represents a crawling task with settings, status, and results
- **CrawlResult**: Represents the result of crawling a single URL
- **VendorConfig**: Vendor-specific settings for the crawler

### API Interfaces

#### Create a new crawl job
```
POST /api/crawls

Request:
{
  "vendorId": "vendor-123",
  "urls": [
    "https://example.com/product1",
    "https://example.com/product2"
  ],
  "settings": {
    "simulateHumanBehavior": true,
    "maxRetries": 5
  }
}

Response: 202 Accepted
{
  "jobId": "job-456",
  "status": "pending",
  "message": "Crawl job created successfully"
}
```

#### Get crawl job status
```
GET /api/crawls/{jobId}

Response: 200 OK
{
  "jobId": "job-456",
  "status": "running",
  "progress": 45,
  "stats": {
    "total": 10,
    "completed": 4,
    "failed": 0,
    "pending": 6
  },
  "creationTime": "2023-05-13T11:30:00Z",
  "estimatedCompletionTime": "2023-05-13T11:40:00Z"
}
```

#### Cancel a crawl job
```
DELETE /api/crawls/{jobId}

Response: 200 OK
{
  "message": "Crawl job cancelled successfully"
}
```

#### Get crawl results
```
GET /api/crawls/{jobId}/results

Response: 200 OK
{
  "jobId": "job-456",
  "results": [
    {
      "id": "result-789",
      "url": "https://example.com/product1",
      "status": "completed",
      "data": {
        "title": "Example Product",
        "price": "$99.99",
        "description": "This is an example product"
      },
      "screenshot": "data:image/jpeg;base64,...",
      "timestamp": "2023-05-13T11:32:15Z",
      "crawlDuration": 2543,
      "retryCount": 0,
      "success": true
    }
  ]
}
```

#### Get/Update vendor configuration
```
GET /api/vendors/{vendorId}/config
PUT /api/vendors/{vendorId}/config
```

## Program call flow

The program call flow is detailed in our sequence diagram (see puppeteer_crawler_sequence_diagram.mermaid), which illustrates the interactions between components during a crawl job.

## Implementation details

### Server-side Puppeteer Component

The server-side Puppeteer component will be implemented as a Node.js service with the following key features:

1. **Browser Instance Pool**: A pool of Puppeteer browser instances for efficient resource usage
2. **Page Management**: Creation and configuration of browser pages with anti-detection measures
3. **Resource Management**: Intelligent handling of browser resources to prevent memory leaks

### Anti-Detection Strategies

1. **User-Agent Rotation**: Randomizing browser user-agent strings from a pool of common browsers
2. **Browser Fingerprinting Protection**: Modifying WebGL, Canvas, and other fingerprinting vectors
3. **Human-like Behavior**: Simulating natural scrolling, mouse movements, and user interactions
4. **Timing Variability**: Adding randomized delays between actions to mimic human timing patterns
5. **Proxy Rotation**: Using multiple IP addresses to distribute requests (optional)

### Sample Anti-Detection Code Implementation

```javascript
// Setup Puppeteer with stealth plugin
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');

// Add stealth plugin and adblocker
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

class AntiDetectionService {
  constructor(options = {}) {
    this.userAgents = options.userAgents || DEFAULT_USER_AGENTS;
    // Additional initialization...
  }
  
  async applyToPage(page) {
    // Random user agent
    const userAgent = this.rotateUserAgent();
    await page.setUserAgent(userAgent);
    
    // WebGL fingerprinting protection
    await page.evaluateOnNewDocument(() => {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        // Modify specific fingerprinting parameters
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter.call(this, parameter);
      };
    });
    
    // Canvas fingerprinting protection
    await page.evaluateOnNewDocument(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(contextType, ...args) {
        const context = originalGetContext.call(this, contextType, ...args);
        if (context && contextType === '2d') {
          const originalFillText = context.fillText;
          context.fillText = function(...args) {
            args[0] = args[0] + ' ';
            return originalFillText.call(this, ...args);
          };
        }
        return context;
      };
    });
    
    // Additional protections...
    return page;
  }
  
  rotateUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
}
```

### Human Behavior Simulation

```javascript
class HumanBehaviorSimulator {
  constructor(config = {}) {
    this.config = {
      scrollDelay: config.scrollDelay || { min: 500, max: 1500 },
      mouseMovements: config.mouseMovements || { min: 3, max: 10 },
      // Additional configuration...
    };
  }
  
  async simulateHumanBehavior(page) {
    // Random scrolling
    await this.simulateScrolling(page);
    
    // Random mouse movements
    await this.simulateMouseMovements(page);
    
    // Additional behaviors...
  }
  
  async simulateScrolling(page) {
    await page.evaluate((config) => {
      return new Promise((resolve) => {
        const totalHeight = document.body.scrollHeight;
        let scrollPosition = 0;
        const scrollStep = Math.floor(Math.random() * 100) + 50;
        
        const scrollInterval = setInterval(() => {
          window.scrollBy(0, scrollStep);
          scrollPosition += scrollStep;
          
          if (scrollPosition >= totalHeight) {
            clearInterval(scrollInterval);
            resolve();
          }
        }, Math.floor(Math.random() * 
          (config.scrollDelay.max - config.scrollDelay.min)) + 
          config.scrollDelay.min);
      });
    }, this.config);
  }
  
  async simulateMouseMovements(page) {
    // Implementation details...
  }
}
```

### Error Handling and Retry Mechanism

```javascript
async crawlWithRetry(url, settings = {}) {
  const maxRetries = settings.maxRetries || 3;
  let retryCount = 0;
  let lastError;
  
  while (retryCount < maxRetries) {
    try {
      // Get page with anti-detection applied
      const page = await this.puppeteerManager.getPage();
      
      // Add random delay before request
      await this.puppeteerManager.randomDelay();
      
      // Attempt to crawl
      const result = await this.crawlSinglePage(page, url, settings);
      await page.close();
      
      return {
        ...result,
        retryCount,
        success: true
      };
    } catch (error) {
      lastError = error;
      retryCount++;
      console.log(`Retry ${retryCount}/${maxRetries} for ${url}: ${error.message}`);
      
      // Exponential backoff
      const backoffTime = Math.pow(2, retryCount) * 1000 + Math.floor(Math.random() * 1000);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      // Try with enhanced anti-detection if blocking detected
      if (this.isBlockingError(error)) {
        await this.enhanceAntiDetection();
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries: ${lastError.message}`);
}

isBlockingError(error) {
  return error.message.includes('403') || 
         error.message.includes('503') || 
         error.message.includes('captcha') ||
         error.message.includes('blocked');
}
```

### Database Schema Extensions

```sql
-- Vendor Configuration Table Extension
ALTER TABLE pagepolly_vendors
ADD COLUMN IF NOT EXISTS anti_blocking_settings JSONB DEFAULT '{}'::JSONB;

-- Create Puppeteer Crawl Jobs Table
CREATE TABLE IF NOT EXISTS pagepolly_puppeteer_crawl_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES pagepolly_vendors(id),
  user_id UUID REFERENCES auth.users(id),
  urls TEXT[] NOT NULL,
  settings JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  progress INT NOT NULL DEFAULT 0,
  results JSONB[] DEFAULT '{}',
  errors JSONB[] DEFAULT '{}',
  creation_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_time TIMESTAMP WITH TIME ZONE,
  CONSTRAINT status_check CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

-- Create Puppeteer Crawl Results Table
CREATE TABLE IF NOT EXISTS pagepolly_puppeteer_crawl_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES pagepolly_puppeteer_crawl_jobs(id),
  url TEXT NOT NULL,
  vendor_id UUID REFERENCES pagepolly_vendors(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  data JSONB DEFAULT '{}',
  screenshot TEXT, -- Base64 encoded screenshot
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  crawl_duration INT,
  retry_count INT DEFAULT 0,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  blocking_detected BOOLEAN DEFAULT FALSE,
  block_type VARCHAR(50)
);
```

## Integration with Existing System

The new Puppeteer-based crawler will be designed to seamlessly integrate with the existing PagePolly system:

1. **API Compatibility**: The crawler will implement APIs compatible with the existing frontend
2. **Data Structure Consistency**: Results will maintain the same format expected by the frontend
3. **Progressive Migration**: We'll implement a strategy to gradually migrate from the current crawler to the Puppeteer solution

### Integration API Example

```javascript
// routes/crawlRoutes.js
const express = require('express');
const router = express.Router();
const puppeteerCrawlerService = require('../services/puppeteerCrawlerService');

router.post('/', async (req, res) => {
  try {
    const { vendorId, urls, settings } = req.body;
    const jobId = await puppeteerCrawlerService.createJob(vendorId, urls, settings);
    res.status(202).json({ jobId, status: 'pending', message: 'Crawl job created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await puppeteerCrawlerService.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Additional routes...
module.exports = router;
```

## Performance Considerations

1. **Resource Management**: Efficiently manage browser instances to limit memory usage
2. **Concurrent Crawling**: Implement throttling to avoid overloading the server
3. **Result Streaming**: Stream large results to avoid memory issues with large datasets
4. **Browser Cleanup**: Proper cleanup of browser resources to prevent memory leaks

## Security Considerations

1. **Input Validation**: Validate all user inputs (URLs, settings) before processing
2. **Sandbox Enforcement**: Ensure Puppeteer runs in a sandboxed environment
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Content Security**: Sanitize crawled content before storing/returning it

## Monitoring and Metrics

1. **Crawling Statistics**: Track success rates, block rates, and performance metrics
2. **Anti-blocking Effectiveness**: Measure effectiveness of anti-blocking techniques
3. **Resource Usage**: Monitor memory and CPU usage of the crawler
4. **Error Tracking**: Detailed logging of errors and their causes

## Anything UNCLEAR

1. **Proxy Integration**: The implementation plan mentions proxy rotation, but it's unclear if there's a preferred proxy provider or existing proxy infrastructure.

2. **Deployment Environment**: We need to clarify whether the Puppeteer crawler will be deployed in a containerized environment (Docker) or directly on a server.

3. **Resource Limitations**: We should define the maximum number of concurrent browser instances based on the available server resources.

4. **Authentication Requirements**: Some vendor websites might require authentication - we need to determine how to handle this in the crawler.

5. **Data Extraction Customization**: We should clarify if vendors need specific data extraction rules beyond the basic content scraping.