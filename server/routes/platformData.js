import { Router } from 'express';
import { getBrandOverview, DATE_PRESETS } from '../services/platformData.js';

const router = Router();

// Get aggregated brand overview for a profile
router.get('/overview/:profileId', async (req, res) => {
  try {
    const datePreset = req.query.datePreset || 'last_30d';
    const data = await getBrandOverview(req.params.profileId, datePreset);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available date presets
router.get('/date-presets', (req, res) => {
  res.json(DATE_PRESETS);
});

export { router as platformDataRoutes };
