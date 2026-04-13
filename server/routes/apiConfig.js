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

// Check which APIs are connected
router.get('/status', (req, res) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    dalle: !!process.env.OPENAI_API_KEY && !isMockMode(),
    openai: !!process.env.OPENAI_API_KEY,
    mockImages: isMockMode(),
    metaAds: !!(process.env.META_SYSTEM_USER_TOKEN && process.env.META_AD_ACCOUNT_ID),
    kinsta: !!(process.env.KINSTA_API_KEY && process.env.KINSTA_COMPANY_ID),
    printful: !!process.env.PRINTFUL_API_KEY,
  });
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
