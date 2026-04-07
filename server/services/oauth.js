// OAuth connection store and helpers
// In production, swap this for a database

const connections = new Map();

// Platform OAuth configs
const PLATFORMS = {
  meta: {
    name: 'Meta (Facebook & Instagram)',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,ads_management',
    clientIdEnv: 'META_CLIENT_ID',
    clientSecretEnv: 'META_CLIENT_SECRET',
  },
  tiktok: {
    name: 'TikTok',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    scopes: 'user.info.basic,video.publish,video.list',
    clientIdEnv: 'TIKTOK_CLIENT_ID',
    clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
  },
  pinterest: {
    name: 'Pinterest',
    authUrl: 'https://www.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    scopes: 'boards:read,pins:read,user_accounts:read',
    clientIdEnv: 'PINTEREST_CLIENT_ID',
    clientSecretEnv: 'PINTEREST_CLIENT_SECRET',
  },
  twitter: {
    name: 'X (Twitter)',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: 'tweet.read,users.read,offline.access',
    clientIdEnv: 'TWITTER_CLIENT_ID',
    clientSecretEnv: 'TWITTER_CLIENT_SECRET',
  },
  gohighlevel: {
    name: 'GoHighLevel',
    authUrl: 'https://marketplace.gohighlevel.com/oauth/chooselocation',
    tokenUrl: 'https://services.leadconnectorhq.com/oauth/token',
    scopes: 'contacts.readonly,contacts.write,opportunities.readonly',
    clientIdEnv: 'GHL_CLIENT_ID',
    clientSecretEnv: 'GHL_CLIENT_SECRET',
  },
  hubspot: {
    name: 'HubSpot',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: 'crm.objects.contacts.read,crm.objects.contacts.write,crm.objects.deals.read',
    clientIdEnv: 'HUBSPOT_CLIENT_ID',
    clientSecretEnv: 'HUBSPOT_CLIENT_SECRET',
  },
  google: {
    name: 'Google Drive',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  canva: {
    name: 'Canva',
    authUrl: 'https://www.canva.com/api/oauth/authorize',
    tokenUrl: 'https://www.canva.com/api/oauth/token',
    scopes: 'design:content:read design:content:write asset:read asset:write',
    clientIdEnv: 'CANVA_CLIENT_ID',
    clientSecretEnv: 'CANVA_CLIENT_SECRET',
  },
};

export function getPlatformConfig(platform) {
  return PLATFORMS[platform] || null;
}

export function getAllPlatforms() {
  return Object.entries(PLATFORMS).map(([key, config]) => ({
    key,
    name: config.name,
    configured: !!(process.env[config.clientIdEnv] && process.env[config.clientSecretEnv]),
    clientId: process.env[config.clientIdEnv] || null,
  }));
}

export function buildAuthUrl(platform, redirectUri, state) {
  const config = PLATFORMS[platform];
  if (!config) return null;

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes,
    state,
  });

  return `${config.authUrl}?${params.toString()}`;
}

export async function exchangeCode(platform, code, redirectUri) {
  const config = PLATFORMS[platform];
  if (!config) throw new Error('Unknown platform');

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];
  if (!clientId || !clientSecret) throw new Error('Platform not configured');

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json();
}

// Connection CRUD
export function saveConnection(userId, platform, tokenData) {
  const key = `${userId}:${platform}`;
  connections.set(key, {
    platform,
    ...tokenData,
    connectedAt: Date.now(),
  });
}

export function getConnection(userId, platform) {
  return connections.get(`${userId}:${platform}`) || null;
}

export function removeConnection(userId, platform) {
  connections.delete(`${userId}:${platform}`);
}

export function getAllConnections(userId) {
  const result = {};
  for (const [key, val] of connections) {
    if (key.startsWith(`${userId}:`)) {
      const platform = key.split(':')[1];
      result[platform] = {
        connected: true,
        connectedAt: val.connectedAt,
        name: PLATFORMS[platform]?.name || platform,
      };
    }
  }
  return result;
}
