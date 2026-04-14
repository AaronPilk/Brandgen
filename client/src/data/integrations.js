// Shared integration catalog — single source of truth
// Used by Settings (full catalog) and Dashboard (brand-level)

export const INTEGRATION_CATALOG = [
  // ─── Brand-level connections ───
  { key: 'meta', name: 'Facebook & Instagram', group: 'Social & Ads', scope: 'brand', authType: 'oauth', priority: 1, icon: 'facebook', color: '#1877F2' },
  { key: 'tiktok', name: 'TikTok', group: 'Social & Ads', scope: 'brand', authType: 'oauth', priority: 2, icon: 'music', color: '#000000' },
  { key: 'pinterest', name: 'Pinterest', group: 'Social & Ads', scope: 'brand', authType: 'oauth', priority: 3, icon: 'pin', color: '#E60023' },
  { key: 'twitter', name: 'X (Twitter)', group: 'Social & Ads', scope: 'brand', authType: 'oauth', priority: 4, icon: 'twitter', color: '#1DA1F2' },
  { key: 'youtube', name: 'YouTube', group: 'Social & Ads', scope: 'brand', authType: 'api_key', priority: 5, icon: 'youtube', color: '#FF0000' },
  { key: 'linkedinAds', name: 'LinkedIn Ads', group: 'Social & Ads', scope: 'brand', authType: 'oauth', priority: 6, icon: 'linkedin', color: '#0A66C2' },

  { key: 'gohighlevel', name: 'GoHighLevel', group: 'CRM & Comms', scope: 'brand', authType: 'oauth', priority: 1, icon: 'target', color: '#28A745' },
  { key: 'hubspot', name: 'HubSpot', group: 'CRM & Comms', scope: 'brand', authType: 'oauth', priority: 2, icon: 'users', color: '#FF7A59' },
  { key: 'klaviyo', name: 'Klaviyo', group: 'CRM & Comms', scope: 'brand', authType: 'api_key', priority: 3, icon: 'mail', color: '#000000' },
  { key: 'mailchimp', name: 'Mailchimp', group: 'CRM & Comms', scope: 'brand', authType: 'api_key', priority: 4, icon: 'send', color: '#FFE01B' },
  { key: 'activecampaign', name: 'ActiveCampaign', group: 'CRM & Comms', scope: 'brand', authType: 'api_key', priority: 5, icon: 'zap', color: '#356AE6' },
  { key: 'twilio', name: 'Twilio', group: 'CRM & Comms', scope: 'brand', authType: 'api_key', priority: 6, icon: 'phone', color: '#F22F46' },

  { key: 'shopify', name: 'Shopify', group: 'Commerce & Sites', scope: 'brand', authType: 'oauth', priority: 1, icon: 'shopping-bag', color: '#96BF48' },
  { key: 'wordpress', name: 'WordPress', group: 'Commerce & Sites', scope: 'brand', authType: 'oauth', priority: 2, icon: 'globe', color: '#21759B' },
  { key: 'webflow', name: 'Webflow', group: 'Commerce & Sites', scope: 'brand', authType: 'api_key', priority: 3, icon: 'layout', color: '#4353FF' },
  { key: 'woocommerce', name: 'WooCommerce', group: 'Commerce & Sites', scope: 'brand', authType: 'api_key', priority: 4, icon: 'shopping-cart', color: '#96588A' },
  { key: 'stripe', name: 'Stripe', group: 'Commerce & Sites', scope: 'brand', authType: 'api_key', priority: 5, icon: 'credit-card', color: '#635BFF' },
  { key: 'printful', name: 'Printful', group: 'Commerce & Sites', scope: 'brand', authType: 'api_key', priority: 6, icon: 'package', color: '#28323C' },

  { key: 'google', name: 'Google Drive', group: 'Data & Tools', scope: 'brand', authType: 'oauth', priority: 1, icon: 'hard-drive', color: '#4285F4' },
  { key: 'canva', name: 'Canva', group: 'Data & Tools', scope: 'brand', authType: 'oauth', priority: 2, icon: 'palette', color: '#00C4CC' },
  { key: 'notion', name: 'Notion', group: 'Data & Tools', scope: 'brand', authType: 'api_key', priority: 3, icon: 'file-text', color: '#000000' },
  { key: 'airtable', name: 'Airtable', group: 'Data & Tools', scope: 'brand', authType: 'api_key', priority: 4, icon: 'table', color: '#18BFFF' },
  { key: 'zoominfo', name: 'ZoomInfo', group: 'Data & Tools', scope: 'brand', authType: 'oauth', priority: 5, icon: 'search', color: '#6B3FA0' },

  { key: 'arcads', name: 'Arcads', group: 'Creative AI', scope: 'brand', authType: 'oauth', priority: 1, icon: 'video', color: '#FF2D55' },
  { key: 'heygen', name: 'HeyGen', group: 'Creative AI', scope: 'brand', authType: 'api_key', priority: 2, icon: 'user-circle', color: '#7C3AED' },
  { key: 'synthesia', name: 'Synthesia', group: 'Creative AI', scope: 'brand', authType: 'api_key', priority: 3, icon: 'film', color: '#0070F3' },
  { key: 'creatify', name: 'Creatify', group: 'Creative AI', scope: 'brand', authType: 'api_key', priority: 4, icon: 'sparkles', color: '#FF6B2B' },
  { key: 'captions', name: 'Captions', group: 'Creative AI', scope: 'brand', authType: 'api_key', priority: 5, icon: 'subtitles', color: '#000000' },

  { key: 'kinsta', name: 'Kinsta', group: 'Hosting', scope: 'brand', authType: 'api_key', priority: 1, icon: 'server', color: '#5333ED' },

  // ─── Global / system integrations ───
  { key: 'anthropic', name: 'Anthropic', group: 'Core AI', scope: 'global', authType: 'api_key', required: true, priority: 1, icon: 'brain', color: '#D4A574' },
  { key: 'openai', name: 'OpenAI', group: 'Core AI', scope: 'global', authType: 'api_key', priority: 2, icon: 'bot', color: '#10A37F' },
  { key: 'dalle', name: 'DALL-E 3', group: 'Core AI', scope: 'global', authType: 'api_key', priority: 3, icon: 'image', color: '#10A37F', note: 'Uses OpenAI key' },
  { key: 'gemini', name: 'Google Gemini', group: 'Core AI', scope: 'global', authType: 'api_key', priority: 4, icon: 'sparkles', color: '#4285F4' },
  { key: 'grok', name: 'xAI / Grok', group: 'Core AI', scope: 'global', authType: 'api_key', priority: 5, icon: 'cpu', color: '#000000' },
  { key: 'perplexity', name: 'Perplexity', group: 'Core AI', scope: 'global', authType: 'api_key', priority: 6, icon: 'search', color: '#20808D' },

  { key: 'elevenlabs', name: 'ElevenLabs', group: 'Voice', scope: 'global', authType: 'api_key', priority: 1, icon: 'mic', color: '#000000' },
  { key: 'vapi', name: 'Vapi', group: 'Voice', scope: 'global', authType: 'api_key', priority: 2, icon: 'phone-call', color: '#6366F1' },
  { key: 'bland', name: 'Bland', group: 'Voice', scope: 'global', authType: 'api_key', priority: 3, icon: 'phone', color: '#000000' },
  { key: 'retell', name: 'Retell AI', group: 'Voice', scope: 'global', authType: 'api_key', priority: 4, icon: 'headphones', color: '#FF4F00' },

  { key: 'n8n', name: 'n8n', group: 'Automation', scope: 'global', authType: 'api_key', priority: 1, icon: 'workflow', color: '#EA4B71' },
  { key: 'make', name: 'Make', group: 'Automation', scope: 'global', authType: 'api_key', priority: 2, icon: 'git-branch', color: '#6D00CC' },
  { key: 'zapier', name: 'Zapier', group: 'Automation', scope: 'global', authType: 'api_key', priority: 3, icon: 'zap', color: '#FF4F00' },
  { key: 'pipedream', name: 'Pipedream', group: 'Automation', scope: 'global', authType: 'api_key', priority: 4, icon: 'terminal', color: '#059669' },

  { key: 'metaAds', name: 'Meta Ads', group: 'Ads & Analytics', scope: 'global', authType: 'token', priority: 1, icon: 'megaphone', color: '#1877F2' },
  { key: 'googleAds', name: 'Google Ads', group: 'Ads & Analytics', scope: 'global', authType: 'api_key', priority: 2, icon: 'bar-chart-3', color: '#4285F4' },
  { key: 'googleAnalytics', name: 'Google Analytics', group: 'Ads & Analytics', scope: 'global', authType: 'pixel', priority: 3, icon: 'trending-up', color: '#E37400' },
  { key: 'gtm', name: 'Google Tag Manager', group: 'Ads & Analytics', scope: 'global', authType: 'pixel', priority: 4, icon: 'tag', color: '#4285F4' },

  { key: 'midjourney', name: 'Midjourney', group: 'Creative AI (Global)', scope: 'global', authType: 'api_key', priority: 1, icon: 'wand', color: '#000000' },
  { key: 'runway', name: 'Runway', group: 'Creative AI (Global)', scope: 'global', authType: 'api_key', priority: 2, icon: 'clapperboard', color: '#000000' },
  { key: 'pika', name: 'Pika', group: 'Creative AI (Global)', scope: 'global', authType: 'api_key', priority: 3, icon: 'play-circle', color: '#FF6B35' },
];

export const BRAND_INTEGRATIONS = INTEGRATION_CATALOG.filter((i) => i.scope === 'brand');
export const GLOBAL_INTEGRATIONS = INTEGRATION_CATALOG.filter((i) => i.scope === 'global');
export const BRAND_GROUPS = [...new Set(BRAND_INTEGRATIONS.map((i) => i.group))];
export const GLOBAL_GROUPS = [...new Set(GLOBAL_INTEGRATIONS.map((i) => i.group))];
export const TOP_BRAND_INTEGRATIONS = BRAND_INTEGRATIONS.filter((i) => i.priority <= 2);
