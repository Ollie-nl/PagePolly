// server/routes/vendorRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await db.getVendors(req.user.id);
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vendors
router.post('/', async (req, res) => {
  try {
    const { name, url, status } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'name and url are required' });
    }
    const vendor = await db.createVendor(req.user.id, { name, url, status: status || 'active' });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/vendors/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, url, status } = req.body;
    const vendor = await db.updateVendor(req.params.id, req.user.id, { name, url, status });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/vendors/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.deleteVendor(req.params.id, req.user.id);
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
