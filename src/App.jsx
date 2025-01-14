import React, { useState } from 'react';
import CrawlForm from './components/CrawlForm';
import ResultsList from './components/ResultsList';

function App() {
  const [results, setResults] = useState([]);

  const handleCrawl = async ({ url, depth }) => {
    try {
      const response = await fetch('http://localhost:5003/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, depth }),
      });

      const data = await response.json();
      setResults(data);
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
