import { Router } from 'express';
import { createUser, loginUser, validateToken, listUsers, updateUserRole, deleteUser, updateUser } from '../services/auth.js';

const router = Router();

// Admin middleware
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = validateToken(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  req.user = user;
  next();
}

router.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = createUser(email, password, name || '');
    const { token, user: userData } = loginUser(email, password);
    res.json({ token, user: userData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const { token, user } = loginUser(email, password);
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = validateToken(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(user);
});

// Update own account (name, email, password)
router.patch('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const currentUser = validateToken(token);
  if (!currentUser) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const updated = updateUser(currentUser.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true });
});

// Admin: list all users
router.get('/users', requireAdmin, (req, res) => {
  res.json(listUsers());
});

// Admin: create employee account
router.post('/users', requireAdmin, (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = createUser(email, password, name || '', role || 'employee');
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: update user role
router.patch('/users/:id/role', requireAdmin, (req, res) => {
  try {
    const user = updateUserRole(req.params.id, req.body.role);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete user
router.delete('/users/:id', requireAdmin, (req, res) => {
  deleteUser(req.params.id);
  res.json({ success: true });
});

export { router as authRoutes };
