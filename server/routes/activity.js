import { Router } from 'express';
import { getProfileFeed, getAllFeed } from '../services/activityFeed.js';

const router = Router();

// Get feed for a specific profile
router.get('/:profileId', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const events = getProfileFeed(req.params.profileId, limit);
  res.json(events);
});

// Get all events across profiles
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const events = getAllFeed(limit);
  res.json(events);
});

export { router as activityRoutes };
