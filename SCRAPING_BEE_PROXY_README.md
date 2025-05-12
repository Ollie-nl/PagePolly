# ScrapingBee Server-Side Proxy Solution

This implementation provides a server-side proxy for ScrapingBee API calls to avoid potential CORS issues and browser limitations when making API requests directly from the client.

## Why a Server-Side Proxy?

1. **Avoids CORS issues**: Browser same-origin policy blocks direct API calls to ScrapingBee from client-side code
2. **Hides API keys**: Keeps your API keys on the server side instead of exposing them in client-side code
3. **Bypasses Browser Limitations**: Some browsers block or limit certain types of requests
4. **Improved Error Handling**: Centralized error handling on the server side
5. **IP Restrictions**: If ScrapingBee has IP restrictions, using a server proxy ensures requests come from a consistent IP

## Files Created

1. `/server/middlewares/scrapingBeeProxy.js` - The main proxy middleware for handling ScrapingBee API requests
2. `/src/services/scrapingBeeProxyService.js` - Client-side service to interact with the server proxy
3. Updates to `/server/index.js` - Added the proxy middleware route

## How to Use

### Server Setup

1. Make sure Express server is running with the middleware registered
2. The proxy endpoint will be available at `/api/scrapingbee/scrape`

### Client-Side Integration

Replace direct ScrapingBee API calls with the proxy service:

```javascript
// Import the proxy service
import scrapingBeeProxyService from '../services/scrapingBeeProxyService';

// Example usage
async function scrapeWebsite(url) {
  try {
    // Use the proxy service instead of direct API call
    const result = await scrapingBeeProxyService.scrape(url);
    
    if (result.success) {
      console.log('Scraping successful:', result.data);
      return result.data;
    } else {
      console.error('Scraping failed:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error during scraping:', error);
    return null;
  }
}

// Test connection
async function testConnection() {
  const testResult = await scrapingBeeProxyService.testConnection();
  console.log('Connection test result:', testResult);
  return testResult.success;
}
```

## How It Works

1. Client makes a request to the server-side proxy endpoint
2. Server receives the request and forwards it to ScrapingBee with proper parameters
3. ScrapingBee processes the request and returns results to the server
4. Server formats the response and sends it back to the client

## Benefits

- **Security**: API keys remain on the server and aren't exposed to users
- **Reliability**: Avoids browser-based restrictions and limitations
- **Consistency**: Single point of integration for all ScrapingBee API calls
- **Flexibility**: Easy to add additional parameters or features as needed

## Troubleshooting

If you encounter issues:

1. Check server logs for detailed error messages
2. Verify the API key is valid and has sufficient credits
3. Ensure the target URL is properly encoded
4. Check network connectivity between the server and ScrapingBee API

## Next Steps

1. Add authentication to the proxy endpoint if needed
2. Implement caching to reduce API calls for frequently requested URLs
3. Add rate limiting to prevent abuse