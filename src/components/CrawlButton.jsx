// CrawlButton.jsx
import React, { useState, useEffect, useRef } from 'react';
import PuppeteerCrawlOption from './PuppeteerCrawlOption';
import supabaseClient from '../lib/supabaseClient';

const STATUS_LABELS = {
  pending:   'Waiting to start...',
  running:   'Crawling...',
  completed: 'Completed',
  failed:    'Failed',
  cancelled: 'Cancelled',
};

const CrawlButton = ({ vendorId, onCrawlComplete }) => {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('config'); // 'config' | 'running' | 'done'
  const [error, setError] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // { status, progress }
  const [puppeteerSettings, setPuppeteerSettings] = useState({
    maxPages: 10,
    maxRetries: 3,
    waitTime: 2000,
  });
  const pollRef = useRef(null);

  // Stop polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  const stopPolling = () => {
    clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const startPolling = (jobId, token) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/crawls/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const job = await res.json();

        setJobStatus({ status: job.status, progress: job.progress ?? 0 });

        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
          stopPolling();
          setPhase('done');
          onCrawlComplete?.(job);
        }
      } catch {
        // silently ignore poll errors
      }
    }, 2000);
  };

  const handleOpen = () => {
    setOpen(true);
    setPhase('config');
    setError(null);
    setJobStatus(null);
  };

  const handleClose = () => {
    stopPolling();
    setOpen(false);
    setPhase('config');
    setError(null);
    setJobStatus(null);
  };

  const handleStartCrawl = async () => {
    setError(null);
    setPhase('running');
    setJobStatus({ status: 'pending', progress: 0 });

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/crawls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vendorId, settings: puppeteerSettings }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${response.status}`);
      }

      const { id: jobId } = await response.json();
      startPolling(jobId, token);
    } catch (err) {
      setError(err.message);
      setPhase('config');
      setJobStatus(null);
    }
  };

  const progress = jobStatus?.progress ?? 0;
  const status   = jobStatus?.status ?? 'pending';

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={handleOpen}>
        Crawl
      </button>

      {open && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Crawl">
          <div className="modal">
            <div className="modal-header">
              <h3>{phase === 'config' ? 'Configure Crawl' : 'Crawl Progress'}</h3>
              <button className="modal-close-btn" onClick={handleClose} aria-label="Close">&times;</button>
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-error mb-md">{error}</div>}

              {phase === 'config' && (
                <div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="maxPages">
                      Max pages to crawl
                      <span className="text-muted text-sm" style={{ marginLeft: '0.5rem' }}>(follows internal links)</span>
                    </label>
                    <input
                      id="maxPages"
                      type="number"
                      min="1"
                      max="100"
                      className="input"
                      value={puppeteerSettings.maxPages}
                      onChange={(e) => setPuppeteerSettings(s => ({ ...s, maxPages: parseInt(e.target.value) || 1 }))}
                    />
                    <p className="text-xs text-muted mt-xs">
                      The crawler starts at the vendor URL and follows links on the same domain until the limit is reached.
                    </p>
                  </div>
                </div>
              )}

              {(phase === 'running' || phase === 'done') && (
                <div>
                  <p className="text-sm text-muted mb-sm">
                    {STATUS_LABELS[status] || status}
                    {status === 'running' && progress > 0 && (
                      <span> — page {Math.round(progress / 100 * puppeteerSettings.maxPages)}/{puppeteerSettings.maxPages}</span>
                    )}
                  </p>

                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted mt-xs text-right">{progress}%</p>

                  {phase === 'done' && status === 'completed' && (
                    <div className="alert alert-success mt-md">
                      Crawl completed successfully.
                    </div>
                  )}
                  {phase === 'done' && status === 'failed' && (
                    <div className="alert alert-error mt-md">
                      Crawl failed. Check the reports for details.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              {phase === 'config' && (
                <>
                  <button className="btn btn-secondary" onClick={handleClose}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleStartCrawl}>
                    Start Crawl
                  </button>
                </>
              )}
              {phase === 'running' && (
                <button className="btn btn-secondary" onClick={handleClose}>
                  Run in background
                </button>
              )}
              {phase === 'done' && (
                <button className="btn btn-primary" onClick={handleClose}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CrawlButton;
