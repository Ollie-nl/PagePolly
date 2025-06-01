// src/pages/crawler/CrawlerPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings } from '../../store/reducers/settingSlice';
import { startCrawl, fetchCrawlStatus, fetchCrawlResults, stopCrawl, resetCrawl } from '../../store/reducers/crawlSlice';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CrawlerPage = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.settings.current);
  
  // Gebruik de crawl state vanuit Redux
  const { 
    currentSession,
    crawlStatus,
    loading: isLoading,
    progress,
    pagesCrawled,
    results,
    error
  } = useSelector((state) => state.crawl);
  
  const [statusMessage, setStatusMessage] = useState('');
  const [resultsPolling, setResultsPolling] = useState(null);
  
  // Crawl configuratie
  const [crawlConfig, setCrawlConfig] = useState({
    maxDepth: 2,
    maxPages: 50,
    stealthMode: true
  });
  
  useEffect(() => {
    console.log('CrawlerPage component geladen');
    dispatch(fetchSettings());
    
    // Reset crawl state wanneer component wordt geladen
    dispatch(resetCrawl());
  }, [dispatch]);
  
  // Poll voor resultaten tijdens het crawlen
  useEffect(() => {
    console.log('Effect voor polling, status:', crawlStatus, 'session:', currentSession);
    if (crawlStatus === 'running' && currentSession) {
      const polling = setInterval(() => {
        console.log('Polling voor crawl status...');
        dispatch(fetchCrawlResults(currentSession.sessionId));
      }, 2000);
      setResultsPolling(polling);
      return () => clearInterval(polling);
    } else if (resultsPolling) {
      clearInterval(resultsPolling);
      setResultsPolling(null);
    }
  }, [crawlStatus, currentSession, dispatch]);
  
  // Update statusMessage wanneer pagesCrawled verandert
  useEffect(() => {
    if (pagesCrawled > 0) {
      setStatusMessage(`Pagina's gecrawld: ${pagesCrawled}`);
    }
  }, [pagesCrawled]);
  
  // Toon errors van Redux als toast
  useEffect(() => {
    if (error) {
      toast.error(`Fout: ${error}`);
    }
  }, [error]);
  
  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCrawlConfig({
      ...crawlConfig,
      [name]: type === 'checkbox' ? checked : parseInt(value, 10)
    });
  };
  
  const handleStartCrawl = async () => {
    if (!settings?.website) {
      toast.error('Geen website URL gevonden in de instellingen');
      return;
    }
    
    setStatusMessage('Starten met crawlen...');
    
    // We gebruiken de Redux thunk met de settings ID
    // De API zal de website URL ophalen op basis van deze ID
    dispatch(startCrawl(settings.id));
  };
  
  const handleStopCrawl = async () => {
    if (!currentSession) return;
    dispatch(stopCrawl(currentSession.sessionId));
  };

  return (
    <div className="container mx-auto p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <h1 className="text-2xl font-bold mb-6">Website Crawler</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Crawl Instellingen</h2>
        
        <div className="space-y-4">
          {settings?.website ? (
            <p className="text-gray-700">
              <strong>Website URL:</strong> {settings.website}
            </p>
          ) : (
            <p className="text-red-500">Geen website URL ingesteld</p>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximale diepte: {crawlConfig.maxDepth}
            </label>
            <input
              type="range"
              name="maxDepth"
              min="1"
              max="5"
              value={crawlConfig.maxDepth}
              onChange={handleConfigChange}
              className="w-full"
              disabled={crawlStatus === 'running'}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 (Alleen hoofdpagina)</span>
              <span>5 (Diep crawlen)</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum aantal pagina's: {crawlConfig.maxPages}
            </label>
            <input
              type="number"
              name="maxPages"
              min="1"
              max="500"
              value={crawlConfig.maxPages}
              onChange={handleConfigChange}
              className="w-full p-2 border rounded"
              disabled={crawlStatus === 'running'}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="stealthMode"
              name="stealthMode"
              checked={crawlConfig.stealthMode}
              onChange={handleConfigChange}
              className="h-4 w-4 text-blue-600"
              disabled={crawlStatus === 'running'}
            />
            <label htmlFor="stealthMode" className="ml-2 text-sm text-gray-700">
              Stealth Mode (langzamer maar minder detecteerbaar)
            </label>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleStartCrawl}
            disabled={isLoading || crawlStatus === 'running' || !settings?.website}
            className={`px-4 py-2 rounded ${
              isLoading || crawlStatus === 'running' || !settings?.website
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? 'Bezig...' : 'Start Crawl'}
          </button>
          
          <button
            onClick={handleStopCrawl}
            disabled={isLoading || crawlStatus !== 'running'}
            className={`px-4 py-2 rounded ${
              isLoading || crawlStatus !== 'running'
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Stop Crawl
          </button>
        </div>
      </div>
      
      {(crawlStatus !== 'idle') && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Crawl Status</h2>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium">Status: 
                <span className={`ml-1 ${
                  crawlStatus === 'running' ? 'text-blue-600' :
                  crawlStatus === 'completed' ? 'text-green-600' :
                  crawlStatus === 'failed' ? 'text-red-600' :
                  crawlStatus === 'cancelled' ? 'text-yellow-600' : 'text-yellow-600'
                }`}>
                  {crawlStatus === 'running' ? 'Bezig met crawlen' :
                   crawlStatus === 'completed' ? 'Voltooid' :
                   crawlStatus === 'failed' ? 'Mislukt' :
                   crawlStatus === 'cancelled' ? 'Geannuleerd' : 'Onbekend'}
                </span>
              </p>
              <p className="text-sm text-gray-600">{statusMessage}</p>
            </div>
            
            <div>
              <p className="font-medium">Voortgang: {progress}%</p>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {results && results.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Crawl Resultaten</h2>
          
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="p-3 border rounded hover:bg-gray-50">
                <p className="font-medium truncate">{result.url}</p>
                <p className="text-sm text-gray-500">
                  <span>Diepte: {result.depth}</span>
                  <span className="mx-2">•</span>
                  <span>Links: {result.links?.length || 0}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrawlerPage;