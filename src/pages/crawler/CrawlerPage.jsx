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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <CrawlerSettings vendorId={projectId} />
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <button
              onClick={handleStartCrawl}
              disabled={crawlStatus === 'running' || !settings}
              className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Start Crawl
            </button>
            
            {crawlStatus === 'running' && (
              <button
                onClick={handleStopCrawl}
                className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Stop Crawl
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Crawl Results</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <span className="font-semibold">Status: </span>
              <span className={`
                ${crawlStatus === 'running' ? 'text-blue-600' : ''}
                ${crawlStatus === 'completed' ? 'text-green-600' : ''}
                ${crawlStatus === 'failed' ? 'text-red-600' : ''}
              `}>
                {crawlStatus.charAt(0).toUpperCase() + crawlStatus.slice(1)}
              </span>
            </div>

            {crawlResults.length > 0 ? (
              <div className="space-y-4">
                {crawlResults.map((result) => (
                  <div key={result.id} className="border-b pb-4">
                    <h3 className="font-medium text-lg">{result.title || 'Untitled'}</h3>
                    <a href={result.url} className="text-blue-600 hover:underline text-sm" target="_blank" rel="noopener noreferrer">
                      {result.url}
                    </a>
                    {result.description && (
                      <p className="text-gray-600 mt-2">{result.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No results available yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrawlerPage;