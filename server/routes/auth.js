import { Router } from 'express';
import { createUser, loginUser, validateToken } from '../services/auth.js';

const router = Router();

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

router.post('/logout', (req, res) => {
  // Session cleanup handled client-side by removing token
  res.json({ success: true });
});

export { router as authRoutes };
