const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { startCrawl } = require('./crawler');

const PORT = 5003;

let crawlProgress = null;

// Helperfunctie om data op te slaan in een bestand
const saveToFile = (data, filename = 'crawled_data.json') => {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
};

app.use(cors());
app.use(bodyParser.json());

app.post('/api/crawl', async (req, res) => {
  const { url, depth = 1, maxPages = 1000 } = req.body;

  // Initialiseer voortgang
  crawlProgress = {
    totalPages: maxPages,
    crawledPages: 0,
    currentUrl: null,
    completed: false, // Voeg een 'completed'-status toe
  };

  try {
    console.log(`Crawling URL: ${url} with depth: ${depth} and maxPages: ${maxPages}`);

    // Start de crawl en gebruik een callback om de voortgang bij te werken
    const crawledPages = await startCrawl(url, maxPages, depth, (progress) => {
      crawlProgress = { ...crawlProgress, ...progress };

      // Update logs voor debugging
      console.log('Updated crawl progress:', crawlProgress);

      // Controleer of het crawlen voltooid is
      if (crawlProgress.crawledPages >= crawlProgress.totalPages) {
        crawlProgress.completed = true; // Markeer als voltooid
        console.log('Crawl completed.');
        console.log('Updated crawl progress:', crawlProgress);
      }
    });

    if (!Array.isArray(crawledPages)) {
      throw new Error('Invalid data format. Expected an array.');
    }

    // Opslaan in bestand
    saveToFile(crawledPages);

    res.json({ message: 'Crawl started successfully', crawledPages });
  } catch (error) {
    console.error('Error during crawl:', error.message);
    res.status(500).json({ error: `Failed to crawl the site: ${error.message}` });
  }
});

app.get('/api/progress', (req, res) => {
  console.log('Progress data sent:', crawlProgress); // Log progress data
  res.json(crawlProgress || { totalPages: 0, crawledPages: 0, currentUrl: null, completed: false });
});

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
