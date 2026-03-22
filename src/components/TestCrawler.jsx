// TestCrawler.jsx
import React, { useState } from 'react';
import PuppeteerCrawlOption from './PuppeteerCrawlOption';
import supabaseClient from '../lib/supabaseClient';
import { crawlerClient } from '../api/crawlerApi';

const TestCrawler = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [puppeteerSettings, setPuppeteerSettings] = useState({
    simulateHumanBehavior: true,
    takeScreenshots: true,
    maxRetries: 3,
    waitTime: 2000,
  });

  const handleStartTest = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setError(null);
    setStatus('running');
    setResult(null);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await crawlerClient.post('/api/crawls/test', {
        url: url.trim(),
        settings: puppeteerSettings,
        user_email: session.user.email
      }, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      setResult(response.data);
      setStatus('completed');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Test crawl failed');
      setStatus('failed');
    }
  };

  return (
    <div className="max-w-lg">
      <div className="card">
        <div className="card-body">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="mb-md">
            <PuppeteerCrawlOption
              settings={puppeteerSettings}
              onSettingsChange={setPuppeteerSettings}
              disabled={status === 'running'}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="test-url">URL to Test</label>
            <input
              id="test-url"
              type="url"
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={status === 'running'}
            />
          </div>

          <button
            className="btn btn-primary mb-md"
            onClick={handleStartTest}
            disabled={status === 'running'}
          >
            {status === 'running' ? (
              <><span className="spinner spinner-sm spinner-inline" />Testing...</>
            ) : '▶ Start Test'}
          </button>

          {status === 'running' && (
            <div className="progress mb-md">
              <div className="progress-bar progress-bar-indeterminate" />
            </div>
          )}

          {result && (
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
              <div className="card-header">
                <h3 className="h4">Test Results</h3>
              </div>
              <div className="card-body">
                {result.screenshot && (
                  <div className="mb-md">
                    <p className="text-sm text-muted mb-xs">Screenshot:</p>
                    <img
                      src={result.screenshot}
                      alt="Page Screenshot"
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: 'var(--radius-md)' }}
                    />
                  </div>
                )}

                <p className="text-sm text-muted mb-xs">Page Data:</p>
                <pre className="code-block">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestCrawler;
