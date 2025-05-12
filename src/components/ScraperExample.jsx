import React, { useState } from 'react';
import scrapingBeeProxyService from '../services/scrapingBeeProxyService';
import LoadingSpinner from './LoadingSpinner';

/**
 * ScraperExample - A component that demonstrates using the ScrapingBee proxy service
 * to scrape web content and display the results
 */
const ScraperExample = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [renderJS, setRenderJS] = useState(false);

  /**
   * Handle form submission to scrape a URL
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a URL to scrape');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use our scraping service
      const response = renderJS 
        ? await scrapingBeeProxyService.getRenderedContent(url)
        : await scrapingBeeProxyService.scrape(url);
      
      if (response.success) {
        setResult(response);
      } else {
        setError(response.message || 'Failed to scrape the website');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle URL input change
   */
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  /**
   * Toggle JavaScript rendering option
   */
  const handleRenderJSToggle = () => {
    setRenderJS(!renderJS);
  };

  /**
   * Test the connection to the ScrapingBee API
   */
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await scrapingBeeProxyService.testConnection();
      
      if (response.success) {
        setResult({
          ...response,
          isConnectionTest: true
        });
      } else {
        setError(response.message || 'Connection test failed');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scraper-example">
      <h2>Web Scraper Example</h2>
      <p>This component demonstrates how to use the ScrapingBee proxy service to scrape websites.</p>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label htmlFor="urlInput">URL to scrape:</label>
              <input
                type="url"
                className="form-control"
                id="urlInput"
                placeholder="https://example.com"
                value={url}
                onChange={handleUrlChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="renderJSCheck"
                checked={renderJS}
                onChange={handleRenderJSToggle}
                disabled={loading}
              />
              <label className="form-check-label" htmlFor="renderJSCheck">
                Render JavaScript (uses more credits)
              </label>
            </div>

            <div className="d-flex">
              <button 
                type="submit" 
                className="btn btn-primary me-2" 
                disabled={loading}
              >
                {loading ? <LoadingSpinner small /> : 'Scrape Website'}
              </button>
              
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={testConnection}
                disabled={loading}
              >
                Test Connection
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mt-3">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="results mt-4">
          <h3>Results</h3>
          
          {result.isConnectionTest ? (
            <div className="alert alert-success">
              <p><strong>Connection test successful!</strong></p>
              <p>API connection is working properly.</p>
              <p>Credits used: {result.credits || 'Unknown'}</p>
            </div>
          ) : (
            <>
              <div className="card mb-3">
                <div className="card-header">
                  Scraping Results
                </div>
                <div className="card-body">
                  <p><strong>Status Code:</strong> {result.statusCode || 'N/A'}</p>
                  <p><strong>Credits Used:</strong> {result.credits || 'Unknown'}</p>
                  <p><strong>Content Length:</strong> {result.pageSource?.length || 0} characters</p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  Page Source Preview (first 500 characters)
                </div>
                <div className="card-body">
                  <pre className="source-preview">
                    {result.pageSource?.substring(0, 500) || 'No content'}
                    {result.pageSource?.length > 500 ? '...' : ''}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ScraperExample;