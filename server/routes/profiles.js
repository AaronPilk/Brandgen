import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbSet, dbDelete, dbList } from '../services/db.js';
import { validateToken } from '../services/auth.js';

const router = Router();

// Auth middleware — optional, falls back to 'anonymous'
function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return validateToken(token);
}

router.post('/', (req, res) => {
  const user = getUser(req);
  const id = uuidv4();
  const profile = {
    id,
    userId: user?.id || 'anonymous',
    mode: req.body.mode,
    intake: req.body.intake,
    research: null,
    assets: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  dbSet('profiles', id, profile);
  res.json(profile);
});

router.get('/:id', (req, res) => {
  const profile = dbGet('profiles', req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

router.patch('/:id', (req, res) => {
  const profile = dbGet('profiles', req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  const updated = { ...profile, ...req.body, updatedAt: Date.now() };
  dbSet('profiles', req.params.id, updated);
  res.json(updated);
});

router.get('/', (req, res) => {
  const user = getUser(req);
  const userId = user?.id || 'anonymous';
  const profiles = dbList('profiles', (p) => p.userId === userId || p.userId === 'anonymous');
  res.json(profiles.sort((a, b) => b.createdAt - a.createdAt));
});

router.delete('/:id', (req, res) => {
  dbDelete('profiles', req.params.id);
  res.json({ success: true });
});

export { router as profileRoutes };
