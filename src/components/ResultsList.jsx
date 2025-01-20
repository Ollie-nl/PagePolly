import React, { useState, useEffect } from 'react';

function ResultsList({ results = [] }) {
  const [progress, setProgress] = useState({ totalPages: 0, crawledPages: 0, currentUrl: null });

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:5003/api/progress')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log('Progress data:', data); // Log voortgangsdata
          setProgress(data);
        })
        .catch((err) => console.error('Error fetching progress:', err));
    }, 1000);

    return () => clearInterval(interval); // Stop polling wanneer de component wordt verwijderd
  }, []);

  if (!Array.isArray(results)) {
    return <p>No results to display yet. Start a crawl to see data.</p>;
  }

  return (
    <div>
      <h2>Crawl Progress</h2>
      <p>
        Crawled {progress.crawledPages || 0} of {progress.totalPages || 0} pages.
      </p>
      <p>Current URL: {progress.currentUrl || 'N/A'}</p>

      <h2>Crawl Results</h2>
      <ul>
        {results.map((result, index) => (
          <li key={index}>
            <h3>{result.title || 'No Title'}</h3>
            <p><strong>URL:</strong> {result.url || 'No URL'}</p>
            <p><strong>Meta Description:</strong> {result.meta?.description || 'No Description'}</p>
            <p><strong>Meta Keywords:</strong> {result.meta?.keywords || 'No Keywords'}</p>
            <h4>Headings:</h4>
            <ul>
              {result.headings?.map((heading, i) => (
                <li key={i}>{heading}</li>
              )) || <li>No Headings</li>}
            </ul>
            <h4>Paragraphs:</h4>
            <ul>
              {result.paragraphs?.map((paragraph, i) => (
                <li key={i}>{paragraph}</li>
              )) || <li>No Paragraphs</li>}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ResultsList;
