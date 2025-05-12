// src/components/CrawlButton.jsx
import React, { useState, useEffect } from 'react';
import crawlerService from '../services/crawlerService';
import scrapingBeeService from '../services/scrapingBeeService';
import supabaseClient from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const CrawlButton = ({ vendorId, settings, onCrawlComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  // Cleanup status check interval on unmount
  useEffect(() => {
    let statusInterval;
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, []);

  const checkCrawlStatus = async (sessionId) => {
    try {
      const results = await crawlerService.getCrawlResults(sessionId);
      
      if (!results || results.length === 0) {
        return 'running';
      }

      const latestResult = results[results.length - 1];
      
      if (latestResult.status === 'completed') {
        clearInterval(window.statusInterval);
        setIsLoading(false);
        setCrawlStatus('completed');
        if (onCrawlComplete) {
          onCrawlComplete(results);
        }
        return 'completed';
      }
      
      if (latestResult.status === 'failed') {
        clearInterval(window.statusInterval);
        setIsLoading(false);
        setCrawlStatus('failed');
        setError(latestResult.error || 'Crawl failed');
        return 'failed';
      }

      // Update progress
      const pagesScraped = results.filter(r => r.status === 'completed').length;
      const progressPercent = Math.round((pagesScraped / settings.max_pages) * 100);
      setProgress(progressPercent);
      
      return 'running';
    } catch (err) {
      console.error('Error checking crawl status:', err);
      clearInterval(window.statusInterval);
      setError(err.message);
      setIsLoading(false);
      return 'failed';
    }
  };

  const startCrawl = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCrawlStatus('starting');
      setProgress(0);
      
      // Get current user
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First test the ScrapingBee connection
      const testResult = await scrapingBeeService.getCreditBalance(settings.api_key);
      if (!testResult.success) {
        throw new Error('Failed to connect to ScrapingBee API');
      }

      // Start new crawl job
      console.log('Starting crawl for vendor:', vendorId);
      const { sessionId } = await crawlerService.startCrawl(vendorId);
      
      setCrawlStatus('running');
      toast.success('Crawl started successfully');

      // Start polling for status updates
      window.statusInterval = setInterval(() => {
        checkCrawlStatus(sessionId);
      }, 5000);

    } catch (err) {
      console.error('Error starting crawl:', err);
      setError(err.message);
      setCrawlStatus('failed');
      setIsLoading(false);
      toast.error(`Failed to start crawl: ${err.message}`);
    }
  };

  const getButtonText = () => {
    if (isLoading && crawlStatus === 'starting') return 'Starting Crawl...';
    switch (crawlStatus) {
      case 'running':
        return `Crawling... ${progress}%`;
      case 'completed':
        return 'Crawl Completed';
      case 'failed':
        return 'Crawl Failed';
      default:
        return 'Start Crawl';
    }
  };

  const getButtonStyle = () => {
    if (isLoading || crawlStatus === 'running') {
      return 'bg-blue-400 cursor-not-allowed';
    }
    if (crawlStatus === 'completed') {
      return 'bg-green-600 hover:bg-green-700';
    }
    if (crawlStatus === 'failed') {
      return 'bg-red-600 hover:bg-red-700';
    }
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={startCrawl}
        disabled={isLoading || crawlStatus === 'running'}
        className={`px-4 py-2 rounded-md text-white transition-colors ${getButtonStyle()}`}
      >
        {getButtonText()}
      </button>
      
      {/* Progress Bar */}
      {crawlStatus === 'running' && (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-500 text-sm mt-1 p-2 bg-red-50 rounded border border-red-200">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Status Message */}
      {crawlStatus === 'running' && (
        <p className="text-sm text-gray-600">
          Crawling in progress... This may take several minutes.
        </p>
      )}

      {/* Completion Message */}
      {crawlStatus === 'completed' && (
        <p className="text-sm text-green-600">
          Crawl completed successfully! ✓
        </p>
      )}
    </div>
  );
};

export default CrawlButton;