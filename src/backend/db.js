const { Pool } = require('pg');

// Controleer of cruciale variabelen bestaan
const requiredEnvVars = [
  'POSTGRES_USER',
  'POSTGRES_HOST',
  'POSTGRES_DB',
  'POSTGRES_PASSWORD',
  'POSTGRES_PORT',
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`${varName} is not set in the environment variables.`);
    process.exit(1); // Stop het proces als variabelen ontbreken
  }
});

// Maak een nieuwe database pool
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST, // Zorg dat dit overeenkomt met .env
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT || 5432,
});

module.exports = pool;
