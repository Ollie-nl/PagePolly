// src/pages/crawler/CrawlerPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCrawlerSettings,
  startCrawl,
  stopCrawl,
  fetchCrawlResults,
  resetCrawlState
} from '../../store/slices/crawlerSlice';
import CrawlerSettings from '../../components/crawler/CrawlerSettings';

const CrawlerPage = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const {
    settings,
    crawlStatus,
    currentSession,
    crawlResults,
    error
  } = useSelector((state) => state.crawler);
  const [resultsPolling, setResultsPolling] = useState(null);

  useEffect(() => {
    dispatch(fetchCrawlerSettings(projectId));
    return () => {
      dispatch(resetCrawlState());
      if (resultsPolling) clearInterval(resultsPolling);
    };
  }, [dispatch, projectId]);

  useEffect(() => {
    if (crawlStatus === 'running' && currentSession) {
      const polling = setInterval(() => {
        dispatch(fetchCrawlResults(currentSession.sessionId));
      }, 5000);
      setResultsPolling(polling);
    } else if (resultsPolling) {
      clearInterval(resultsPolling);
      setResultsPolling(null);
    }
  }, [crawlStatus, currentSession, dispatch]);

  const handleStartCrawl = async () => {
    if (settings?.id) {
      await dispatch(startCrawl(settings.id));
    }
  };

  const handleStopCrawl = async () => {
    if (currentSession) {
      await dispatch(stopCrawl(currentSession.sessionId));
    }
  };

  const statusClass = {
    running:   'badge-info',
    completed: 'badge-success',
    failed:    'badge-error',
  }[crawlStatus] || 'badge-default';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Crawler</h1>
          <p>Project ID: {projectId}</p>
        </div>
      </div>

      <div className="grid grid-2 gap-lg">
        {/* Left: settings + controls */}
        <div>
          <CrawlerSettings vendorId={projectId} />

          {error && (
            <div className="alert alert-error mt-md">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-sm mt-lg">
            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={handleStartCrawl}
              disabled={crawlStatus === 'running' || !settings}
            >
              ▶ Start Crawl
            </button>

            {crawlStatus === 'running' && (
              <button
                className="btn btn-danger btn-full"
                onClick={handleStopCrawl}
              >
                ■ Stop Crawl
              </button>
            )}
          </div>
        </div>

        {/* Right: results */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="h3">Crawl Results</h2>
              <span className={`badge ${statusClass}`}>
                {crawlStatus.charAt(0).toUpperCase() + crawlStatus.slice(1)}
              </span>
            </div>

            <div className="card-body">
              {crawlResults.length > 0 ? (
                <div>
                  {crawlResults.map((result) => (
                    <div key={result.id} className="result-item">
                      <h3 className="h5">{result.title || 'Untitled'}</h3>
                      <a
                        href={result.url}
                        className="text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {result.url}
                      </a>
                      {result.description && (
                        <p className="text-muted text-sm mt-xs">{result.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--spacing-xl) 0' }}>
                  <div className="empty-state-icon">🔍</div>
                  <p>No results available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrawlerPage;
