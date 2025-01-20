const express = require('express'); // Import Express
const app = express(); // Initialiseer de Express-app
const PORT = 5003;
const bodyParser = require('body-parser');
const { startCrawl } = require('./crawler');
const cors = require('cors');
const fs = require('fs'); // Voor bestandsopslag

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Variabele om de voortgang bij te houden
let crawlProgress = null;

// Helperfunctie om gegevens in een bestand op te slaan
const saveToFile = (data, filename = 'crawled_data.json') => {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
};

// Routes
app.post('/api/crawl', async (req, res) => {
  const { url, depth = 1, maxPages = 1000 } = req.body;

  // Initialiseer voortgang
  crawlProgress = {
    totalPages: maxPages,
    crawledPages: 0,
    currentUrl: null,
  };

  try {
    console.log(`Crawling URL: ${url} with depth: ${depth} and maxPages: ${maxPages}`);

    // Start de crawl en gebruik een callback om de voortgang bij te werken
    const crawledPages = await startCrawl(url, maxPages, (progress) => {
      crawlProgress = { ...crawlProgress, ...progress }; // Update voortgang
    });

    if (!Array.isArray(crawledPages)) {
      throw new Error('Invalid data format. Expected an array.');
    }

    // Opslaan in bestand
    saveToFile(crawledPages);

    res.json(crawledPages);
  } catch (error) {
    console.error('Error during crawl:', error.message);
    res.status(500).json({ error: `Failed to crawl the site: ${error.message}` });
  }
});

// Endpoint voor voortgang
app.get('/api/progress', (req, res) => {
  res.json(crawlProgress || { totalPages: 0, crawledPages: 0, currentUrl: null });
});

// Start server
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
