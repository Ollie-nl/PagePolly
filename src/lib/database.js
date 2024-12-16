const db = require('./db');
const { v4: uuidv4 } = require('uuid');

// Sessie aanmaken
async function createSession(rootUrl) {
    const res = await db.query(
        `INSERT INTO sessions (id, start_time, root_url) VALUES ($1, $2, $3) RETURNING *`,
        [uuidv4(), new Date(), rootUrl]
    );
    return res.rows[0];
}

// URL opslaan
async function addCrawledUrl(sessionId, url, productFound, foundIn) {
    const res = await db.query(
        `INSERT INTO crawled_urls (id, session_id, url, product_name_found, found_in) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [uuidv4(), sessionId, url, productFound, foundIn]
    );
    return res.rows[0];
}

// Sessie afronden
async function endSession(sessionId) {
    const res = await db.query(
        `UPDATE sessions SET end_time = $1 WHERE id = $2 RETURNING *`,
        [new Date(), sessionId]
    );
    return res.rows[0];
}

module.exports = {
    createSession,
    addCrawledUrl,
    endSession,
};
