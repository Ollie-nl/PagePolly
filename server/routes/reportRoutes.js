// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, vendorId } = req.query;
    const userEmail = req.user.email;

    let query = supabase
      .from('crawl_jobs')
      .select(`
        id, created_at, completed_at, status, vendor_id, urls, settings,
        vendors ( name, url ),
        crawl_results ( id, url, status, crawl_duration ),
        crawl_errors ( id, url, error )
      `)
      .eq('user_email', userEmail)
      .in('status', ['completed', 'partial', 'failed'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (vendorId) query = query.eq('vendor_id', vendorId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate)   query = query.lte('created_at', endDate);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const reports = (data || []).map(job => ({
      id:         job.id,
      vendor:     job.vendors?.name || 'Unknown',
      vendorUrl:  job.vendors?.url || null,
      vendorId:   job.vendor_id,
      date:       job.created_at,
      completedAt: job.completed_at,
      pages:      job.crawl_results?.length || 0,
      errors:     job.crawl_errors?.length || 0,
      status:     job.status === 'completed' && (job.crawl_errors?.length || 0) === 0
                    ? 'success'
                    : job.status === 'partial' || (job.crawl_errors?.length || 0) > 0
                    ? 'warning'
                    : 'error',
      duration:   job.completed_at
                    ? new Date(job.completed_at) - new Date(job.created_at)
                    : null,
      urls:       job.urls || [],
      settings:   job.settings || {},
      crawlResults: (job.crawl_results || []).map(r => ({ url: r.url, status: r.status, duration: r.crawl_duration })),
      crawlErrors:  (job.crawl_errors || []).map(e => ({ url: e.url, error: e.error })),
    }));

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: job, error } = await supabase
      .from('crawl_jobs')
      .select(`
        *,
        vendors ( name, url ),
        crawl_results ( * ),
        crawl_errors ( * )
      `)
      .eq('id', req.params.id)
      .eq('user_email', req.user.email)
      .single();

    if (error) return res.status(404).json({ error: 'Report not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
