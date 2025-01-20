"use client";

import React, { useState, useEffect } from 'react';
import CrawlForm from './CrawlForm';
import ResultsList from './ResultsList';

function App() {
  const [results, setResults] = useState([]);

  // Ophalen van resultaten uit de database
  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch('http://localhost:5003/api/results');
        const data = await response.json();
  
        console.log('API Response:', data); // Log de response
        if (Array.isArray(data)) {
          setResults(data); // Zet de resultaten als het een array is
        } else {
          console.error('API did not return an array:', data);
          setResults([]); // Fallback naar een lege array
        }
      } catch (err) {
        console.error('Failed to fetch results:', err.message);
        setResults([]); // Fallback naar een lege array
      }
    }
  
    fetchResults();
  }, []);

  const handleCrawl = async ({ url, depth }) => {
    try {
      // Simuleer direct een resultaat
      const newResult = {
        id: Date.now(), // Tijdelijke ID voor mock data
        url,
        title: `Crawled Title for ${url}`, // Mock titel
        date_crawled: new Date().toISOString(),
        depth,
      };
  
      // Voeg het nieuwe resultaat toe aan de bestaande resultaten
      setResults((prevResults) => [newResult, ...prevResults]);
  
      // Stuur de crawl request naar de backend
      const response = await fetch('http://localhost:5003/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, depth }),
      });
  
      if (response.ok) {
        console.log('Crawl initiated successfully');
      } else {
        console.error('Failed to initiate crawl:', response.status);
      }
    } catch (err) {
      console.error('Failed to crawl:', err.message);
    }
  };
  
  return (
    <div>
      <h1>PagePolly Crawler</h1>
      <CrawlForm onSubmit={handleCrawl} />
      <ResultsList results={results} />
    </div>
  );
}

export default App;
