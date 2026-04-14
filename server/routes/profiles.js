import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbSet, dbDelete, dbList } from '../services/db.js';
import { validateToken } from '../services/auth.js';

const router = Router();

function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return validateToken(token);
}

// Check if user can access a specific profile
function canAccessProfile(user, profile) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'manager') return true;
  if (profile.userId === user.id) return true;
  if (profile.allowedUsers?.includes(user.id)) return true;
  return false;
}

router.post('/', (req, res) => {
  const user = getUser(req);
  // Clients cannot create profiles
  if (user?.role === 'client') return res.status(403).json({ error: 'Clients cannot create profiles' });

  const id = uuidv4();
  const profile = {
    id,
    userId: user?.id || 'anonymous',
    mode: req.body.mode,
    intake: req.body.intake,
    research: null,
    assets: {},
    allowedUsers: req.body.allowedUsers || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  dbSet('profiles', id, profile);
  res.json(profile);
});

router.get('/:id', (req, res) => {
  const user = getUser(req);
  const profile = dbGet('profiles', req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  if (!canAccessProfile(user, profile)) return res.status(403).json({ error: 'Access denied' });
  res.json(profile);
});

router.patch('/:id', (req, res) => {
  const user = getUser(req);
  const profile = dbGet('profiles', req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  if (!canAccessProfile(user, profile)) return res.status(403).json({ error: 'Access denied' });

  // Clients can only update connections (OAuth connect flow), not intake/research
  if (user?.role === 'client') {
    const allowed = {};
    if (req.body.connections) allowed.connections = { ...profile.connections, ...req.body.connections };
    const updated = { ...profile, ...allowed, updatedAt: Date.now() };
    dbSet('profiles', req.params.id, updated);
    return res.json(updated);
  }

  const updated = { ...profile, ...req.body, updatedAt: Date.now() };
  dbSet('profiles', req.params.id, updated);
  res.json(updated);
});

router.get('/', (req, res) => {
  const user = getUser(req);
  if (!user) return res.json([]);

  let profiles;
  if (user.role === 'admin' || user.role === 'manager') {
    // Admin/manager sees all profiles
    profiles = dbList('profiles');
  } else if (user.role === 'client') {
    // Client sees only profiles they're assigned to
    profiles = dbList('profiles', (p) => p.allowedUsers?.includes(user.id));
  } else {
    // Employee sees profiles created by them or assigned to them
    profiles = dbList('profiles', (p) => p.userId === user.id || p.allowedUsers?.includes(user.id));
  }

  res.json(profiles.sort((a, b) => b.createdAt - a.createdAt));
});

// Assign users to a profile (admin/manager only)
router.post('/:id/assign', (req, res) => {
  const user = getUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return res.status(403).json({ error: 'Admin or manager required' });
  }
  const profile = dbGet('profiles', req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const { userIds } = req.body;
  if (!Array.isArray(userIds)) return res.status(400).json({ error: 'userIds array required' });

  profile.allowedUsers = [...new Set([...(profile.allowedUsers || []), ...userIds])];
  profile.updatedAt = Date.now();
  dbSet('profiles', profile.id, profile);
  res.json({ allowedUsers: profile.allowedUsers });
});

// Remove user from profile
router.post('/:id/unassign', (req, res) => {
  const user = getUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return res.status(403).json({ error: 'Admin or manager required' });
  }
  const profile = dbGet('profiles', req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const { userId } = req.body;
  profile.allowedUsers = (profile.allowedUsers || []).filter(id => id !== userId);
  profile.updatedAt = Date.now();
  dbSet('profiles', profile.id, profile);
  res.json({ allowedUsers: profile.allowedUsers });
});

router.delete('/:id', (req, res) => {
  const user = getUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return res.status(403).json({ error: 'Admin or manager required' });
  }
  dbDelete('profiles', req.params.id);
  res.json({ success: true });
});

export { router as profileRoutes };
