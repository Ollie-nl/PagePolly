const express = require('express');
const cors = require('cors');
const { startCrawler } = require('./crawler');

const app = express();
const port = 5003;

// Configureer CORS met specifieke regels
const corsOptions = {
  origin: 'http://localhost:3000', // Sta alleen verzoeken van de frontend toe
  methods: ['GET', 'POST'], // Toegestane methoden
  allowedHeaders: ['Content-Type'], // Toegestane headers
};

app.use(cors(corsOptions));
app.use(express.json());

// Start een crawl
app.post('/api/crawl', async (req, res) => {
  const { url, depth } = req.body;

  if (!url || !depth) {
    return res.status(400).json({ error: 'URL and depth are required.' });
  }

  try {
    const results = await startCrawler(url, depth);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to crawl the site.' });
  }
});

// Start de server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
