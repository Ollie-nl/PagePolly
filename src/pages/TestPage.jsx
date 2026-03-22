import React from 'react';
import TestCrawler from '../components/TestCrawler';

const TestPage = () => {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Crawler Test</h1>
          <p>Test the Puppeteer crawler with any URL to verify it is working correctly.</p>
        </div>
      </div>
      <TestCrawler />
    </div>
  );
};

export default TestPage;
