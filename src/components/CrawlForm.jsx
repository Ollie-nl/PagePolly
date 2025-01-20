import React, { useState } from 'react';

function CrawlForm({ onCrawl }) {
  const [url, setUrl] = useState('https://ferrum.audio');
  const [depth, setDepth] = useState(1);
  const [maxPages, setMaxPages] = useState(1000); // Nieuw state voor maxPages
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCrawl({ url, depth, maxPages }); // Voeg maxPages toe aan het verzoek
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          URL:
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Depth:
          <input
            type="number"
            min="1"
            max="10"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Max Pages:
          <input
            type="number"
            min="1"
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
          />
        </label>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Crawling...' : 'Crawl'}
      </button>
    </form>
  );
}

export default CrawlForm;
