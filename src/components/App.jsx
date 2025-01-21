'use client'; // Zorgt ervoor dat React hooks zoals useState werken

import React, { useState } from 'react';
import CrawlForm from './CrawlForm';
import ResultsList from './ResultsList';

function App() {
  const [results, setResults] = useState([]); // Voor de crawlresultaten
  const [loading, setLoading] = useState(false); // Voor de laadstatus
  const [error, setError] = useState(null); // Voor foutmeldingen

  const handleCrawl = async ({ url, depth, maxPages }) => {
    try {
      setLoading(true); // Start laadstatus
      setError(null); // Reset eerdere foutmeldingen
      console.log('Sending crawl request:', { url, depth, maxPages }); // Log voor debugging

      const response = await fetch('http://localhost:5003/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, depth, maxPages }),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Lees foutmelding van de server
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Crawl results received:', data); // Log ontvangen resultaten
      setResults(data); // Update resultaten
    } catch (error) {
      console.error('Failed to crawl site:', error); // Log fouten voor debugging
      setError(`Failed to crawl: ${error.message}`); // Update foutmelding
    } finally {
      setLoading(false); // Stop laadstatus
    }
  };

  return (
    <div>
      <h1>Stealth Crawler</h1>
      <CrawlForm onCrawl={handleCrawl} />
      {loading && <p>Loading...</p>} {/* Laadindicator */}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>} {/* Toon foutmelding */}
      <ResultsList results={results} />
    </div>
  );
}

export default App;
