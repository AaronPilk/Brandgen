import { Router } from 'express';
import {
  getBudget,
  updateBudgetLimits,
  estimateCost,
  canAfford,
  getTransactions,
  getAllTransactions,
  setDailyLimit,
} from '../services/tokenBudget.js';
import { isMockMode } from '../services/imageGen.js';

const router = Router();

// Auto-detect all integration env vars
const ENV_MAP = {
  anthropic: 'ANTHROPIC_API_KEY', openai: 'OPENAI_API_KEY', dalle: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY', grok: 'XAI_API_KEY', perplexity: 'PERPLEXITY_API_KEY',
  elevenlabs: 'ELEVENLABS_API_KEY', vapi: 'VAPI_API_KEY', bland: 'BLAND_API_KEY', retell: 'RETELL_API_KEY',
  n8n: 'N8N_API_KEY', make: 'MAKE_API_KEY', zapier: 'ZAPIER_API_KEY', pipedream: 'PIPEDREAM_API_KEY',
  midjourney: 'MIDJOURNEY_API_KEY', runway: 'RUNWAY_API_KEY', pika: 'PIKA_API_KEY',
  heygen: 'HEYGEN_API_KEY', synthesia: 'SYNTHESIA_API_KEY', creatify: 'CREATIFY_API_KEY', captions: 'CAPTIONS_API_KEY',
  arcads: 'ARCADS_CLIENT_ID',
  metaAds: 'META_SYSTEM_USER_TOKEN', meta: 'META_CLIENT_ID', googleAds: 'GOOGLE_ADS_API_KEY',
  googleAnalytics: 'GOOGLE_ANALYTICS_ID', gtm: 'GTM_CONTAINER_ID',
  tiktok: 'TIKTOK_CLIENT_ID', linkedinAds: 'LINKEDIN_CLIENT_ID', pinterest: 'PINTEREST_CLIENT_ID',
  twitter: 'TWITTER_CLIENT_ID', youtube: 'YOUTUBE_API_KEY',
  gohighlevel: 'GHL_CLIENT_ID', hubspot: 'HUBSPOT_CLIENT_ID',
  klaviyo: 'KLAVIYO_API_KEY', mailchimp: 'MAILCHIMP_API_KEY', activecampaign: 'ACTIVECAMPAIGN_API_KEY', twilio: 'TWILIO_API_KEY',
  shopify: 'SHOPIFY_CLIENT_ID', woocommerce: 'WOOCOMMERCE_API_KEY', wordpress: 'WORDPRESS_CLIENT_ID',
  webflow: 'WEBFLOW_API_KEY', kinsta: 'KINSTA_API_KEY', stripe: 'STRIPE_API_KEY', printful: 'PRINTFUL_API_KEY',
  canva: 'CANVA_CLIENT_ID', google: 'GOOGLE_CLIENT_ID', notion: 'NOTION_API_KEY', airtable: 'AIRTABLE_API_KEY',
  zoominfo: 'ZOOMINFO_CLIENT_ID',
};

router.get('/status', (req, res) => {
  const status = { mockImages: isMockMode() };
  for (const [key, envVar] of Object.entries(ENV_MAP)) {
    status[key] = !!process.env[envVar];
  }
  res.json(status);
});

// Budget CRUD
router.get('/budget/:userId', (req, res) => {
  res.json(getBudget(req.params.userId));
});

router.post('/budget', (req, res) => {
  const { sessionId, dailyLimit, monthlyLimit } = req.body;
  const userId = sessionId || 'default';
  if (dailyLimit !== undefined || monthlyLimit !== undefined) {
    const budget = updateBudgetLimits(userId, { dailyLimit, monthlyLimit });
    return res.json(budget);
  }
  res.json(getBudget(userId));
});

router.patch('/budget/:userId', (req, res) => {
  const { dailyLimit, monthlyLimit } = req.body;
  const budget = updateBudgetLimits(req.params.userId, { dailyLimit, monthlyLimit });
  res.json(budget);
});

// Cost estimation
router.get('/estimate/:action', (req, res) => {
  res.json(estimateCost(req.params.action));
});

router.get('/can-afford/:userId/:action', (req, res) => {
  const estimate = estimateCost(req.params.action);
  const affordability = canAfford(req.params.userId, estimate.estimatedCost);
  res.json({ ...estimate, ...affordability });
});

// Transaction history
router.get('/transactions/:userId', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(getTransactions(req.params.userId, limit));
});

router.get('/transactions', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json(getAllTransactions(limit));
});

export { router as apiConfigRoutes };
