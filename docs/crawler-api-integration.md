# PagePolly Crawler - ScrapingBee API Integration Guide

This document provides comprehensive documentation for integrating and using the ScrapingBee API within the PagePolly web crawler service.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Integration Setup](#integration-setup)
4. [API Configuration](#api-configuration)
5. [Key Features](#key-features)
6. [Code Examples](#code-examples)
7. [Error Handling](#error-handling)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting](#troubleshooting)

## Overview

PagePolly's crawler service uses ScrapingBee as the backend web scraping solution. ScrapingBee is a web scraping API that handles proxies, JavaScript rendering, and CAPTCHAs for you, allowing reliable data extraction from any website.

## Prerequisites

- ScrapingBee API key (sign up at [ScrapingBee.com](https://www.scrapingbee.com))
- Node.js v16+
- PagePolly application with Supabase configured

## Integration Setup

### 1. Environment Setup

Add your ScrapingBee API key to your `.env` file:

```
SCRAPING_BEE_API_KEY=your_scraping_bee_api_key_here
```

### 2. Install Required Dependencies

Ensure you have the necessary dependencies installed:

```bash
pnpm add axios uuid
```

## API Configuration

The crawler service is configured to use specific ScrapingBee API parameters for optimal results:

### Basic Configuration

- **API Endpoint**: `https://app.scrapingbee.com/api/v1`
- **Authentication**: API key-based authentication
- **Response Format**: JSON

### ScrapingBee Parameters

| Parameter | Description |
|-----------|-------------|
| `api_key` | Your ScrapingBee API key |
| `url` | Target URL to scrape |
| `screenshot` | Boolean to take a screenshot (set to true) |
| `screenshot_full_page` | Capture full page (set to true) |
| `premium_proxy` | Use premium proxies for better success rate |
| `wait_for` | CSS selectors to wait for before capturing data |
| `timeout` | Maximum time in milliseconds to wait for response |

## Key Features

### 1. Web Page Scanning

The crawler captures the following information from each web page:

- Full-page screenshots
- Page metadata (title, description)
- Basic page structure (headers, navigation, main content areas)
- Element positioning and dimensions

### 2. Custom JavaScript Extraction

ScrapingBee's `js_scenario` feature allows for custom JavaScript execution on the target page, which PagePolly uses to extract detailed page structure information.

### 3. Parallel Processing

Multiple URLs can be processed in parallel, with job progress tracking and real-time status updates.

## Code Examples

### Starting a Crawl Job

```javascript
// Frontend API call to start a crawl job
async function startCrawlJob(projectId, urls) {
  try {
    const response = await fetch('/api/crawls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        urls
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error starting crawl job:', error);
    throw error;
  }
}
```

### Checking Crawl Status

```javascript
// Frontend API call to check status of a crawl job
async function checkCrawlStatus(jobId) {
  try {
    const response = await fetch(`/api/crawls/${jobId}`);
    return await response.json();
  } catch (error) {
    console.error('Error checking crawl status:', error);
    throw error;
  }
}
```

## Error Handling

### Common ScrapingBee Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| 401 | Unauthorized - Invalid API key | Verify your API key in .env file |
| 402 | Payment Required - Credits depleted | Refill your ScrapingBee account credits |
| 403 | Forbidden | Check URL access permissions |
| 429 | Too Many Requests | Implement rate limiting in your application |
| 5xx | Server errors | Retry with backoff strategy |

### Crawler Service Error Handling

The PagePolly crawler service implements:

1. **Job-level error tracking**: Each crawl job maintains an array of errors encountered
2. **URL-level error tracking**: Individual URL crawling errors are captured
3. **Graceful degradation**: If one URL fails, others continue to be processed
4. **Error reporting**: Detailed error information is stored in the database for review

## Performance Considerations

### ScrapingBee Credit Usage

Be mindful of your ScrapingBee credit usage:

- Each API call consumes credits based on the complexity of the request
- Screenshots and JavaScript execution require additional credits
- Consider implementing credit usage monitoring

### Rate Limiting

Implement appropriate rate limiting to prevent API quota exhaustion:

- Limit concurrent crawl jobs
- Add delay between processing URLs
- Monitor response times and adjust accordingly

## Troubleshooting

### Common Issues

1. **API Key Not Found Error**
   - Verify that `SCRAPING_BEE_API_KEY` is correctly set in your .env file
   - Restart the server after updating environment variables

2. **Screenshot Missing**
   - Ensure `screenshot` parameter is set to `true`
   - Check if the target site blocks screenshots
   - Try adjusting the `wait_for` parameter

3. **Structure Extraction Failed**
   - The custom JavaScript scenario may need adjustments for certain websites
   - Check browser console for JS errors
   - Consider adding specific selectors for the target website

### Logging

All API requests and responses are logged for debugging purposes. Check server logs for detailed information about each crawl operation.