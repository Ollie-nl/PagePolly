import React, { useState } from 'react';

function CrawlForm({ onSubmit }) {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ url, depth });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        URL:
        <input
          type="url"
          placeholder="Enter URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </label>
      <label>
        Depth:
        <input
          type="number"
          min="1"
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          required
        />
      </label>
      <button type="submit">Start Crawl</button>
    </form>
  );
}

export default CrawlForm;
