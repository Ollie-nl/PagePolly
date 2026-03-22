// CrawlerInterface.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  startCrawl,
  getCrawlHistory,
  getCrawlDetails,
  cancelCrawl,
  clearCrawlState
} from '../../store/reducers/crawlSlice';
import PuppeteerCrawlOption from '../PuppeteerCrawlOption';

const statusBadgeClass = {
  pending:   'badge-warning',
  running:   'badge-info',
  completed: 'badge-success',
  failed:    'badge-error',
  cancelled: 'badge-default',
};

const CrawlerInterface = ({ projectId }) => {
  const dispatch = useDispatch();
  const [urls, setUrls] = useState(['']);
  const [error, setError] = useState('');
  const [puppeteerSettings, setPuppeteerSettings] = useState({
    simulateHumanBehavior: true,
    takeScreenshots: true,
    maxRetries: 3,
    waitTime: 2000,
  });

  const crawlState = useSelector((state) => state.crawl);
  const { activeJob, history, loading } = crawlState;

  useEffect(() => {
    dispatch(getCrawlHistory({ projectId }));
    return () => { dispatch(clearCrawlState()); };
  }, [dispatch, projectId]);

  useEffect(() => {
    let interval;
    if (activeJob?.id && ['pending', 'running'].includes(activeJob.status)) {
      interval = setInterval(() => {
        dispatch(getCrawlDetails(activeJob.id));
      }, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [dispatch, activeJob]);

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addUrlField = () => setUrls([...urls, '']);

  const removeUrlField = (index) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    setUrls(newUrls);
  };

  const handleStartCrawl = () => {
    const validUrls = urls.filter(url => url.trim() !== '');
    if (validUrls.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }
    setError('');
    dispatch(startCrawl({
      projectId,
      urls: validUrls,
      crawlerType: 'puppeteer',
      settings: puppeteerSettings
    }));
  };

  const handleCancelCrawl = () => {
    if (activeJob) dispatch(cancelCrawl(activeJob.id));
  };

  const handleViewJobDetails = (jobId) => {
    dispatch(getCrawlDetails(jobId));
  };

  const handleRefreshHistory = () => {
    dispatch(getCrawlHistory({ projectId }));
  };

  return (
    <div>
      {/* New Crawl card */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="h3">Start New Crawl</h2>
        </div>
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
              disabled={loading}
            />
          </div>

          {urls.map((url, index) => (
            <div key={index} className="flex items-center gap-sm mb-sm">
              <input
                className="input"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                placeholder={`URL ${index + 1} — https://example.com`}
                disabled={loading}
              />
              <button
                className="btn-icon"
                onClick={() => removeUrlField(index)}
                disabled={urls.length === 1 || loading}
                aria-label="Remove URL"
                title="Remove URL"
              >
                &times;
              </button>
            </div>
          ))}

          <div className="flex gap-sm mt-md">
            <button
              className="btn btn-secondary btn-sm"
              onClick={addUrlField}
              disabled={loading}
            >
              + Add URL
            </button>

            <button
              className="btn btn-primary"
              onClick={handleStartCrawl}
              disabled={loading || (activeJob && ['pending', 'running'].includes(activeJob.status))}
            >
              {loading ? (
                <><span className="spinner spinner-sm spinner-inline" />Starting...</>
              ) : 'Start Crawling'}
            </button>
          </div>
        </div>
      </div>

      {/* Active job */}
      {activeJob && (
        <div className="card mb-lg">
          <div className="card-header">
            <h2 className="h3">Active Job</h2>
            <span className={`badge ${statusBadgeClass[activeJob.status] || 'badge-default'}`}>
              {activeJob.status}
            </span>
          </div>
          <div className="card-body">
            <div className="progress mb-sm">
              <div
                className="progress-bar"
                style={{ width: `${activeJob.progress || 0}%` }}
              />
            </div>
            <p className="text-sm text-muted mb-md">{activeJob.progress || 0}% complete</p>

            {['pending', 'running'].includes(activeJob.status) && (
              <button
                className="btn btn-danger btn-sm"
                onClick={handleCancelCrawl}
              >
                &times; Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Crawl History */}
      {history && history.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="h3">Crawl History</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleRefreshHistory}
            >
              ↺ Refresh
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Started</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <span className={`badge ${statusBadgeClass[job.status] || 'badge-default'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(job.startTime).toLocaleString()}
                    </td>
                    <td className="table-cell-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleViewJobDetails(job.id)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrawlerInterface;
