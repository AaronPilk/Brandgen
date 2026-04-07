import { Router } from 'express';
import {
  getAllPlatforms,
  buildAuthUrl,
  exchangeCode,
  saveConnection,
  getConnection,
  removeConnection,
  getAllConnections,
} from '../services/oauth.js';

const router = Router();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// List all platforms and their status
router.get('/platforms', (req, res) => {
  const platforms = getAllPlatforms();
  res.json(platforms);
});

// Get user's connections
router.get('/connections/:userId', (req, res) => {
  const connections = getAllConnections(req.params.userId);
  res.json(connections);
});

// Start OAuth flow — returns URL for frontend to redirect to
router.get('/connect/:platform', (req, res) => {
  const { platform } = req.params;
  const userId = req.query.userId || 'default';
  const redirectUri = `${BASE_URL}/api/oauth/callback/${platform}`;
  const state = Buffer.from(JSON.stringify({ userId, platform })).toString('base64');

  const url = buildAuthUrl(platform, redirectUri, state);
  if (!url) {
    return res.status(400).json({
      error: 'Platform not configured',
      message: `Add ${platform.toUpperCase()}_CLIENT_ID and ${platform.toUpperCase()}_CLIENT_SECRET to your .env file`,
    });
  }

  res.json({ url });
});

// OAuth callback — platform redirects here after user authorizes
router.get('/callback/:platform', async (req, res) => {
  const { platform } = req.params;
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${CLIENT_URL}/connections?error=${encodeURIComponent(error)}`);
  }

  let userId = 'default';
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64').toString());
    userId = parsed.userId;
  } catch {}

  try {
    const redirectUri = `${BASE_URL}/api/oauth/callback/${platform}`;
    const tokenData = await exchangeCode(platform, code, redirectUri);
    saveConnection(userId, platform, tokenData);
    res.redirect(`${CLIENT_URL}/connections?connected=${platform}`);
  } catch (err) {
    res.redirect(`${CLIENT_URL}/connections?error=${encodeURIComponent(err.message)}`);
  }
});

// Disconnect
router.delete('/disconnect/:platform', (req, res) => {
  const userId = req.query.userId || 'default';
  removeConnection(userId, req.params.platform);
  res.json({ success: true });
});

// Check single connection
router.get('/status/:platform', (req, res) => {
  const userId = req.query.userId || 'default';
  const conn = getConnection(userId, req.params.platform);
  res.json({ connected: !!conn, data: conn });
});

export { router as oauthRoutes };
