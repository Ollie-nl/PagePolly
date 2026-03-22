// CrawlButton.jsx
import React, { useState } from 'react';
import PuppeteerCrawlOption from './PuppeteerCrawlOption';
import supabaseClient from '../lib/supabaseClient';

const CrawlButton = ({ vendorId, onCrawlComplete }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [puppeteerSettings, setPuppeteerSettings] = useState({
    simulateHumanBehavior: true,
    takeScreenshots: true,
    maxRetries: 3,
    waitTime: 2000,
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleStartCrawl = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      const { data: { session } } = await supabaseClient.auth.getSession();

      const response = await fetch('/api/crawls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          vendorId,
          settings: puppeteerSettings,
          user_email: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      onCrawlComplete?.(data);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={handleOpen}>
        Crawl
      </button>

      {open && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Configure Crawl">
          <div className="modal">
            <div className="modal-header">
              <h3>Configure Crawl</h3>
              <button className="modal-close-btn" onClick={handleClose} aria-label="Close">&times;</button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-error mb-md">
                  {error}
                </div>
              )}
              <PuppeteerCrawlOption
                settings={puppeteerSettings}
                onSettingsChange={setPuppeteerSettings}
                disabled={loading}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartCrawl}
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner spinner-sm spinner-inline" />Starting...</>
                ) : 'Start Crawl'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CrawlButton;
