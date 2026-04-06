import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory store (swap for DB later)
const profiles = new Map();

router.post('/', (req, res) => {
  const id = uuidv4();
  const profile = {
    id,
    mode: req.body.mode, // 'lead-gen' | 'build-brand' | 'discover-build'
    intake: req.body.intake,
    research: null,
    assets: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  profiles.set(id, profile);
  res.json(profile);
});

router.get('/:id', (req, res) => {
  const profile = profiles.get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

router.patch('/:id', (req, res) => {
  const profile = profiles.get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  Object.assign(profile, req.body, { updatedAt: Date.now() });
  profiles.set(req.params.id, profile);
  res.json(profile);
});

router.get('/', (req, res) => {
  res.json([...profiles.values()].sort((a, b) => b.createdAt - a.createdAt));
});

router.delete('/:id', (req, res) => {
  profiles.delete(req.params.id);
  res.json({ success: true });
});

export { router as profileRoutes };
