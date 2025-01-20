import React, { useState } from 'react';
import CrawlForm from './CrawlForm'; // Zorg dat de import correct is
import ResultsList from './ResultsList';

function App() {
  const [results, setResults] = useState([]);

  // Definieer de handleCrawl-functie
  const handleCrawl = async ({ url, depth, maxPages }) => {
    try {
      console.log('Sending crawl request:', { url, depth, maxPages }); // Debug-log
      const response = await fetch('http://localhost:5003/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, depth, maxPages }), // Voeg maxPages toe aan het verzoek
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Crawl results received:', data); // Debug-log
      setResults(data);
    } catch (error) {
      console.error('Failed to crawl site:', error);
    }
  };

  return (
    <div>
      <h1>Stealth Crawler</h1>
      {/* Geef de handleCrawl-functie door aan CrawlForm */}
      <CrawlForm onCrawl={handleCrawl} />
      <ResultsList results={results} />
    </div>
  );
}

export default App;
