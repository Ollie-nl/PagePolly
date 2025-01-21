'use client';

import React, { useState, useEffect } from 'react';

function ResultsList({ results = [] }) {
  const [progress, setProgress] = useState({ totalPages: 0, crawledPages: 0, currentUrl: null, completed: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = () => {
      fetch('http://localhost:5003/api/progress')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log('Progress data:', data);
          setProgress(data);

          // Stop polling als de crawl voltooid is
          if (data.completed) {
            clearInterval(interval);
            console.log('Crawling completed, stopped polling.');
          }

        })
        .catch((err) => {
          console.error('Error fetching progress:', err.message);
          setError('Failed to fetch progress. Please try again.');
          clearInterval(interval); // Stop polling bij fout
        });
    };

    const interval = setInterval(fetchProgress, 1000);

    return () => clearInterval(interval); // Stop het interval bij demontage
  }, []);

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h2>Crawl Progress</h2>
      {/* Toon realtime voortgang */}
      <p>
        Crawled {progress.crawledPages || 0} of {progress.totalPages || 0} pages.
      </p>
      <p>Current URL: {progress.currentUrl || 'N/A'}</p>

      {/* Visuele voortgangsbalk */}
      <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '5px', marginTop: '10px' }}>
        <div
          style={{
            width: `${(progress.crawledPages / progress.totalPages) * 100 || 0}%`,
            backgroundColor: '#4caf50',
            height: '20px',
            borderRadius: '5px',
            transition: 'width 0.5s ease',
          }}
        ></div>
      </div>
    </div>
  );
}

export default ResultsList;
