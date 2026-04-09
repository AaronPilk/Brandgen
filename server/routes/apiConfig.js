import { Router } from 'express';
import {
  getSession,
  setDailyLimit,
  estimateCost,
  canAfford,
} from '../services/tokenBudget.js';
import { isMockMode } from '../services/imageGen.js';

const router = Router();

// Check which APIs are connected
router.get('/status', (req, res) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    dalle: !!process.env.OPENAI_API_KEY && !isMockMode(),
    mockImages: isMockMode(),
    metaAds: !!(process.env.META_SYSTEM_USER_TOKEN && process.env.META_AD_ACCOUNT_ID),
    printful: !!process.env.PRINTFUL_API_KEY,
    pinterest: !!process.env.PINTEREST_API_KEY,
    twitter: !!process.env.TWITTER_API_KEY,
    goHighLevel: !!process.env.GOHIGHLEVEL_API_KEY,
    hubspot: !!process.env.HUBSPOT_API_KEY,
    metaPixel: !!process.env.META_PIXEL_ID,
    tiktokPixel: !!process.env.TIKTOK_PIXEL_ID,
    googleAnalytics: !!process.env.GOOGLE_ANALYTICS_ID,
    pinterestTag: !!process.env.PINTEREST_TAG_ID,
  });
});

// Budget endpoints
router.post('/budget', (req, res) => {
  const { sessionId, dailyLimit } = req.body;
  const session = setDailyLimit(sessionId || 'default', dailyLimit);
  res.json(session);
});

router.get('/budget/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  res.json(session);
});

router.get('/estimate/:action', (req, res) => {
  const estimate = estimateCost(req.params.action);
  res.json(estimate);
});

router.get('/can-afford/:sessionId/:action', (req, res) => {
  const estimate = estimateCost(req.params.action);
  const affordability = canAfford(req.params.sessionId, estimate.estimatedCost);
  res.json({ ...estimate, ...affordability });
});

export { router as apiConfigRoutes };
