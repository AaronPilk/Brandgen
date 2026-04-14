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
import { setProfileConnection, getProfileConnections } from '../services/platformData.js';
import { dbGet, dbSet } from '../services/db.js';

const router = Router();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// List all platforms and their status
router.get('/platforms', (req, res) => {
  res.json(getAllPlatforms());
});

// Get connections for a profile
router.get('/connections/:profileId', (req, res) => {
  // Return both OAuth connections AND profile-level connections
  const oauthConns = getAllConnections(req.params.profileId);
  const profileConns = getProfileConnections(req.params.profileId);
  // Merge: if profile has connection data, it's connected
  const merged = { ...oauthConns };
  for (const [key, val] of Object.entries(profileConns)) {
    if (val?.accessToken || val?.accountId || val?.connected) {
      merged[key] = { connected: true, ...val };
    }
  }
  res.json(merged);
});

// Start OAuth flow — pass profileId through state so callback knows which brand
router.get('/connect/:platform', (req, res) => {
  const { platform } = req.params;
  const profileId = req.query.userId || req.query.profileId || 'default';
  const redirectUri = `${BASE_URL}/api/oauth/callback/${platform}`;
  const state = Buffer.from(JSON.stringify({ profileId, platform })).toString('base64');

  const url = buildAuthUrl(platform, redirectUri, state);
  if (!url) {
    return res.status(400).json({
      error: 'Platform not configured',
      message: `Add ${platform.toUpperCase()}_CLIENT_ID and ${platform.toUpperCase()}_CLIENT_SECRET to your .env file`,
    });
  }

  res.json({ url });
});

// OAuth callback — saves tokens to the PROFILE, then auto-discovers accounts
router.get('/callback/:platform', async (req, res) => {
  const { platform } = req.params;
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${CLIENT_URL}/?oauth_error=${encodeURIComponent(error)}`);
  }

  let profileId = 'default';
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64').toString());
    profileId = parsed.profileId || parsed.userId || 'default';
  } catch {}

  try {
    const redirectUri = `${BASE_URL}/api/oauth/callback/${platform}`;
    const tokenData = await exchangeCode(platform, code, redirectUri);

    // Save to legacy connection store
    saveConnection(profileId, platform, tokenData);

    // Save token to profile connections (persisted to DB)
    const connectionData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      connected: true,
      connectedAt: Date.now(),
    };

    // Auto-discover account details based on platform
    if (platform === 'meta' && tokenData.access_token) {
      try {
        // Discover pages, ad accounts, and Instagram
        const token = tokenData.access_token;
        const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${token}`);
        const pages = await pagesRes.json();
        if (pages.data?.length) {
          connectionData.pageId = pages.data[0].id;
          connectionData.pageName = pages.data[0].name;
          if (pages.data[0].instagram_business_account) {
            connectionData.instagramId = pages.data[0].instagram_business_account.id;
            connectionData.instagramUsername = pages.data[0].instagram_business_account.username;
            // Also save Instagram connection
            setProfileConnection(profileId, 'instagram', {
              accountId: pages.data[0].instagram_business_account.id,
              username: pages.data[0].instagram_business_account.username,
              connected: true,
              viaMetaOAuth: true,
            });
          }
        }
        // Discover ad accounts
        const adRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id&access_token=${token}`);
        const adAccounts = await adRes.json();
        if (adAccounts.data?.length) {
          connectionData.adAccountId = adAccounts.data[0].account_id;
          connectionData.adAccountName = adAccounts.data[0].name;
          // Save to meta_ads connection for platform data
          setProfileConnection(profileId, 'meta_ads', {
            adAccountId: adAccounts.data[0].account_id,
            adAccountName: adAccounts.data[0].name,
          });
        }
      } catch (e) {
        console.log(`[OAuth] Meta account discovery failed: ${e.message}`);
      }
    }

    // Save the full connection to profile
    setProfileConnection(profileId, platform, connectionData);

    // Redirect back to the profile dashboard
    if (profileId !== 'default') {
      res.redirect(`${CLIENT_URL}/dashboard/${profileId}?connected=${platform}`);
    } else {
      res.redirect(`${CLIENT_URL}/connections?connected=${platform}`);
    }
  } catch (err) {
    if (profileId !== 'default') {
      res.redirect(`${CLIENT_URL}/dashboard/${profileId}?oauth_error=${encodeURIComponent(err.message)}`);
    } else {
      res.redirect(`${CLIENT_URL}/connections?error=${encodeURIComponent(err.message)}`);
    }
  }
});

// Disconnect — removes from both profile connections and legacy store
router.delete('/disconnect/:platform', (req, res) => {
  const profileId = req.query.userId || req.query.profileId || 'default';
  removeConnection(profileId, req.params.platform);
  // Also clear profile connection
  setProfileConnection(profileId, req.params.platform, { connected: false, accessToken: null });
  res.json({ success: true });
});

// Check single connection status
router.get('/status/:platform', (req, res) => {
  const profileId = req.query.userId || req.query.profileId || 'default';
  const conn = getConnection(profileId, req.params.platform);
  const profileConn = getProfileConnections(profileId)[req.params.platform];
  res.json({ connected: !!(conn || profileConn?.connected), data: conn || profileConn });
});

export { router as oauthRoutes };
