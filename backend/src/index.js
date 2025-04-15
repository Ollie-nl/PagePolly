const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Sites endpoints
app.get('/api/sites', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sites');
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sites', async (req, res) => {
  const { url, crawlFrequency } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO sites (url, crawl_frequency) VALUES ($1, $2) RETURNING *',
      [url, crawlFrequency]
    );
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating site:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});