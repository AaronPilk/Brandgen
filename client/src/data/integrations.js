// Shared integration catalog — single source of truth
// Used by both Settings (global) and Dashboard (brand-level)

export const INTEGRATION_CATALOG = [
  // ─── Brand-level connections (tied to each workspace) ───
  { key: 'meta', name: 'Facebook & Instagram', group: 'Social & Ads', scope: 'brand', authType: 'oauth', priority: 1 },
  { key: 'tiktok', name: 'TikTok', group: 'Social & Ads', scope: 'brand', authType: 'oauth', priority: 2 },
  { key: 'pinterest', name: 'Pinterest', group: 'Social & Ads', scope: 'brand', authType: 'oauth', priority: 3 },
  { key: 'twitter', name: 'X (Twitter)', group: 'Social & Ads', scope: 'brand', authType: 'oauth', priority: 4 },
  { key: 'youtube', name: 'YouTube', group: 'Social & Ads', scope: 'brand', authType: 'api_key', priority: 5 },
  { key: 'linkedinAds', name: 'LinkedIn Ads', group: 'Social & Ads', scope: 'brand', authType: 'oauth', priority: 6 },

  { key: 'gohighlevel', name: 'GoHighLevel', group: 'CRM & Comms', scope: 'brand', authType: 'oauth', priority: 1 },
  { key: 'hubspot', name: 'HubSpot', group: 'CRM & Comms', scope: 'brand', authType: 'oauth', priority: 2 },
  { key: 'klaviyo', name: 'Klaviyo', group: 'CRM & Comms', scope: 'brand', authType: 'api_key', priority: 3 },
  { key: 'mailchimp', name: 'Mailchimp', group: 'CRM & Comms', scope: 'brand', authType: 'api_key', priority: 4 },
  { key: 'activecampaign', name: 'ActiveCampaign', group: 'CRM & Comms', scope: 'brand', authType: 'api_key', priority: 5 },
  { key: 'twilio', name: 'Twilio', group: 'CRM & Comms', scope: 'brand', authType: 'api_key', priority: 6 },

  { key: 'shopify', name: 'Shopify', group: 'Commerce & Sites', scope: 'brand', authType: 'oauth', priority: 1 },
  { key: 'wordpress', name: 'WordPress', group: 'Commerce & Sites', scope: 'brand', authType: 'oauth', priority: 2 },
  { key: 'webflow', name: 'Webflow', group: 'Commerce & Sites', scope: 'brand', authType: 'api_key', priority: 3 },
  { key: 'woocommerce', name: 'WooCommerce', group: 'Commerce & Sites', scope: 'brand', authType: 'api_key', priority: 4 },
  { key: 'stripe', name: 'Stripe', group: 'Commerce & Sites', scope: 'brand', authType: 'api_key', priority: 5 },
  { key: 'printful', name: 'Printful', group: 'Commerce & Sites', scope: 'brand', authType: 'api_key', priority: 6 },

  { key: 'google', name: 'Google Drive', group: 'Data & Tools', scope: 'brand', authType: 'oauth', priority: 1 },
  { key: 'canva', name: 'Canva', group: 'Data & Tools', scope: 'brand', authType: 'oauth', priority: 2 },
  { key: 'notion', name: 'Notion', group: 'Data & Tools', scope: 'brand', authType: 'api_key', priority: 3 },
  { key: 'airtable', name: 'Airtable', group: 'Data & Tools', scope: 'brand', authType: 'api_key', priority: 4 },
  { key: 'zoominfo', name: 'ZoomInfo', group: 'Data & Tools', scope: 'brand', authType: 'oauth', priority: 5 },

  { key: 'arcads', name: 'Arcads', group: 'Creative AI', scope: 'brand', authType: 'oauth', priority: 1 },
  { key: 'heygen', name: 'HeyGen', group: 'Creative AI', scope: 'brand', authType: 'api_key', priority: 2 },
  { key: 'synthesia', name: 'Synthesia', group: 'Creative AI', scope: 'brand', authType: 'api_key', priority: 3 },
  { key: 'creatify', name: 'Creatify', group: 'Creative AI', scope: 'brand', authType: 'api_key', priority: 4 },
  { key: 'captions', name: 'Captions', group: 'Creative AI', scope: 'brand', authType: 'api_key', priority: 5 },

  { key: 'kinsta', name: 'Kinsta', group: 'Hosting', scope: 'brand', authType: 'api_key', priority: 1 },

  // ─── Global / system integrations (admin-only, in Settings) ───
  { key: 'anthropic', name: 'Anthropic', group: 'Core AI', scope: 'global', authType: 'api_key', required: true, priority: 1 },
  { key: 'openai', name: 'OpenAI', group: 'Core AI', scope: 'global', authType: 'api_key', priority: 2 },
  { key: 'dalle', name: 'DALL-E 3', group: 'Core AI', scope: 'global', authType: 'api_key', priority: 3, note: 'Uses OpenAI key' },
  { key: 'gemini', name: 'Google Gemini', group: 'Core AI', scope: 'global', authType: 'api_key', priority: 4 },
  { key: 'grok', name: 'xAI / Grok', group: 'Core AI', scope: 'global', authType: 'api_key', priority: 5 },
  { key: 'perplexity', name: 'Perplexity', group: 'Core AI', scope: 'global', authType: 'api_key', priority: 6 },

  { key: 'elevenlabs', name: 'ElevenLabs', group: 'Voice', scope: 'global', authType: 'api_key', priority: 1 },
  { key: 'vapi', name: 'Vapi', group: 'Voice', scope: 'global', authType: 'api_key', priority: 2 },
  { key: 'bland', name: 'Bland', group: 'Voice', scope: 'global', authType: 'api_key', priority: 3 },
  { key: 'retell', name: 'Retell AI', group: 'Voice', scope: 'global', authType: 'api_key', priority: 4 },

  { key: 'n8n', name: 'n8n', group: 'Automation', scope: 'global', authType: 'api_key', priority: 1 },
  { key: 'make', name: 'Make', group: 'Automation', scope: 'global', authType: 'api_key', priority: 2 },
  { key: 'zapier', name: 'Zapier', group: 'Automation', scope: 'global', authType: 'api_key', priority: 3 },
  { key: 'pipedream', name: 'Pipedream', group: 'Automation', scope: 'global', authType: 'api_key', priority: 4 },

  { key: 'metaAds', name: 'Meta Ads System Token', group: 'Ads & Analytics', scope: 'global', authType: 'token', priority: 1 },
  { key: 'googleAds', name: 'Google Ads', group: 'Ads & Analytics', scope: 'global', authType: 'api_key', priority: 2 },
  { key: 'googleAnalytics', name: 'Google Analytics', group: 'Ads & Analytics', scope: 'global', authType: 'pixel', priority: 3 },
  { key: 'gtm', name: 'Google Tag Manager', group: 'Ads & Analytics', scope: 'global', authType: 'pixel', priority: 4 },

  { key: 'midjourney', name: 'Midjourney', group: 'Creative AI (Global)', scope: 'global', authType: 'api_key', priority: 1 },
  { key: 'runway', name: 'Runway', group: 'Creative AI (Global)', scope: 'global', authType: 'api_key', priority: 2 },
  { key: 'pika', name: 'Pika', group: 'Creative AI (Global)', scope: 'global', authType: 'api_key', priority: 3 },
];

// Filtered views
export const BRAND_INTEGRATIONS = INTEGRATION_CATALOG.filter((i) => i.scope === 'brand');
export const GLOBAL_INTEGRATIONS = INTEGRATION_CATALOG.filter((i) => i.scope === 'global');

// Group helpers
export const BRAND_GROUPS = [...new Set(BRAND_INTEGRATIONS.map((i) => i.group))];
export const GLOBAL_GROUPS = [...new Set(GLOBAL_INTEGRATIONS.map((i) => i.group))];

// Priority-sorted top items (shown by default before "show more")
export const TOP_BRAND_INTEGRATIONS = BRAND_INTEGRATIONS
  .filter((i) => i.priority <= 2)
  .sort((a, b) => a.priority - b.priority);
