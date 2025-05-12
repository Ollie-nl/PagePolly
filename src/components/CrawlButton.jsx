// src/components/CrawlButton.jsx
import React, { useState, useEffect } from 'react';
import crawlerService from '../services/crawlerService';
import scrapingBeeService from '../services/scrapingBeeService';
import supabaseClient from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CrawlButton = ({ vendorId, settings, onCrawlComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  
  // Validate settings on component mount
  useEffect(() => {
    // Check if settings are properly loaded
    if (!settings) {
      console.warn('Settings not provided to CrawlButton component');
      setError('Settings not configured properly');
    } else if (!settings.api_key) {
      console.warn('API key not found in settings');
      setError('API key is missing in settings');
    }
  }, [settings]);
  
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

      // Update progress - ensure settings.max_pages exists
      if (settings && settings.max_pages) {
        const pagesScraped = results.filter(r => r.status === 'completed').length;
        const progressPercent = Math.round((pagesScraped / settings.max_pages) * 100);
        setProgress(progressPercent);
      }
      
      return 'running';
    } catch (err) {
      console.error('Error checking crawl status:', err);
      clearInterval(window.statusInterval);
      setError(err.message);
      setIsLoading(false);
      return 'failed';
    }
  };

  const redirectToSettings = () => {
    toast.success('Please configure your API settings first'); // Changed from toast.info
    navigate('/settings');
  };

  const startCrawl = async () => {
    try {
      // Check for valid settings first
      if (!settings) {
        throw new Error('Settings not configured');
      }
      
      if (!settings.api_key) {
        toast.error('ScrapingBee API key is missing. Please configure in Settings.');
        redirectToSettings();
        return;
      }

      setIsLoading(true);
      setError(null);
      setCrawlStatus('starting');
      setProgress(0);
      
      // Get current user
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First test the ScrapingBee connection with error handling
      try {
        const testResult = await scrapingBeeService.getCreditBalance(settings.api_key);
        if (!testResult.success) {
          throw new Error(`Failed to connect to ScrapingBee API: ${testResult.message}`);
        }
        console.log('ScrapingBee API connection successful, credits:', testResult.credits);
      } catch (apiError) {
        throw new Error(`ScrapingBee API error: ${apiError.message}`);
      }

      // Start new crawl job
      console.log('Starting crawl for vendor:', vendorId);
      console.log('Using API key (masked):', settings.api_key ? '****' + settings.api_key.substring(settings.api_key.length - 4) : 'MISSING');
      
      // Make absolutely sure the API key is passed correctly
      // First, check and validate the API key
      if (!settings.api_key) {
        throw new Error('API key is missing in settings');
      }
      
      // Now pass it explicitly to startCrawl
      const apiKey = settings.api_key.trim();
      console.log('About to call startCrawl with vendor ID and API key (masked):', vendorId, '****' + apiKey.slice(-4));
      const { sessionId } = await crawlerService.startCrawl(vendorId, apiKey);
      
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
    // Disable button if settings are missing
    if (!settings || !settings.api_key) {
      return 'bg-gray-400 cursor-not-allowed';
    }
    
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

  // If settings are missing, show a more helpful message
  if (!settings || !settings.api_key) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={redirectToSettings}
          className="px-4 py-2 rounded-md text-white transition-colors bg-yellow-600 hover:bg-yellow-700"
        >
          Configure Settings First
        </button>
        <div className="text-amber-500 text-sm mt-1 p-2 bg-amber-50 rounded border border-amber-200">
          <p>ScrapingBee API key is required to start crawling.</p>
          <p>Click the button above to configure your settings.</p>
        </div>
      </div>
    );
  }

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