const { Pool } = require('pg');

const pool = new Pool({
    user: 'pagepolly_user', // PostgreSQL-gebruiker
    host: 'localhost', // Host van de database
    database: 'pagepolly', // Naam van de database
    password: 'yourpassword', // Wachtwoord voor de gebruiker
    port: 5432, // Standaardpoort van PostgreSQL
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};