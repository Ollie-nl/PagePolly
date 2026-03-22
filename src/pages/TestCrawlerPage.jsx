// src/pages/TestCrawlerPage.jsx
import React from 'react';
import TestCrawler from '../components/TestCrawler';

const TestCrawlerPage = () => {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Test Crawler</h1>
          <p>Test crawling capabilities with both Puppeteer and API methods on any URL.</p>
        </div>
      </div>
      <TestCrawler />
    </div>
  );
};

export default TestCrawlerPage;
