import { Router } from 'express';
import { getBrandOverview, DATE_PRESETS, getProfileConnections, setProfileConnection } from '../services/platformData.js';

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

// Get per-profile connection settings
router.get('/connections/:profileId', (req, res) => {
  res.json(getProfileConnections(req.params.profileId));
});

// Set per-profile connection settings (e.g. ad account ID, IG account ID)
router.patch('/connections/:profileId/:platform', (req, res) => {
  const result = setProfileConnection(req.params.profileId, req.params.platform, req.body);
  if (!result) return res.status(404).json({ error: 'Profile not found' });
  res.json(result);
});

export { router as platformDataRoutes };
