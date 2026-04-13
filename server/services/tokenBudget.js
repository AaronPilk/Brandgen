// Token budget tracking service — persisted to file DB
import { dbGet, dbSet, dbList } from './db.js';

// Cost rates per 1K tokens (USD)
const RATES = {
  anthropic: { input: 0.003, output: 0.015 },
  'anthropic-fast': { input: 0.0008, output: 0.004 },
  openai: { input: 0.005, output: 0.015 },
  'openai-fast': { input: 0.00015, output: 0.0006 },
  dalle: { perImage: 0.040 },
};

// ─── Budget Management (persisted) ───

export function getBudget(userId) {
  const budget = dbGet('budgets', userId);
  if (!budget) {
    return {
      userId,
      dailyLimit: 10.0,
      monthlyLimit: 300.0,
      totalSpent: 0,
      todaySpent: 0,
      monthSpent: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      lastMonthReset: new Date().toISOString().slice(0, 7),
      createdAt: Date.now(),
    };
  }

  // Auto-reset daily spend if it's a new day
  const today = new Date().toISOString().split('T')[0];
  if (budget.lastResetDate !== today) {
    budget.todaySpent = 0;
    budget.lastResetDate = today;
    dbSet('budgets', userId, budget);
  }

  // Auto-reset monthly spend if it's a new month
  const thisMonth = new Date().toISOString().slice(0, 7);
  if (budget.lastMonthReset !== thisMonth) {
    budget.monthSpent = 0;
    budget.lastMonthReset = thisMonth;
    dbSet('budgets', userId, budget);
  }

  return budget;
}

export function updateBudgetLimits(userId, { dailyLimit, monthlyLimit }) {
  const budget = getBudget(userId);
  if (dailyLimit !== undefined) budget.dailyLimit = dailyLimit;
  if (monthlyLimit !== undefined) budget.monthlyLimit = monthlyLimit;
  dbSet('budgets', userId, budget);
  return budget;
}

// ─── Spend Tracking ───

export function recordSpend(userId, amount, action, details = {}) {
  const budget = getBudget(userId);
  budget.totalSpent += amount;
  budget.todaySpent += amount;
  budget.monthSpent += amount;
  dbSet('budgets', userId, budget);

  // Log individual transaction
  const txId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  dbSet('token-transactions', txId, {
    id: txId,
    userId,
    action,
    amount: Math.round(amount * 100000) / 100000,
    provider: details.provider || 'unknown',
    model: details.model || '',
    inputTokens: details.inputTokens || 0,
    outputTokens: details.outputTokens || 0,
    images: details.images || 0,
    timestamp: Date.now(),
  });

  return budget;
}

export function getTransactions(userId, limit = 50) {
  return dbList('token-transactions', (t) => t.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function getAllTransactions(limit = 100) {
  return dbList('token-transactions')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

// ─── Cost Estimation ───

export function estimateCost(action) {
  const estimates = {
    'market-research': { inputTokens: 500, outputTokens: 800, images: 0, tier: 'standard' },
    'landing-page': { inputTokens: 600, outputTokens: 800, images: 0, tier: 'standard' },
    'ad-creatives': { inputTokens: 400, outputTokens: 800, images: 0, tier: 'standard' },
    'email-sequences': { inputTokens: 400, outputTokens: 800, images: 0, tier: 'fast' },
    'sms-sequences': { inputTokens: 300, outputTokens: 600, images: 0, tier: 'fast' },
    'logo-concepts': { inputTokens: 300, outputTokens: 400, images: 3, tier: 'standard' },
    'product-mockups': { inputTokens: 300, outputTokens: 400, images: 3, tier: 'standard' },
    'brand-strategy': { inputTokens: 500, outputTokens: 800, images: 0, tier: 'standard' },
    'social-setup': { inputTokens: 400, outputTokens: 800, images: 0, tier: 'fast' },
    'meta-campaign': { inputTokens: 500, outputTokens: 800, images: 0, tier: 'standard' },
  };

  const est = estimates[action] || { inputTokens: 400, outputTokens: 800, images: 0, tier: 'standard' };
  const rate = est.tier === 'fast' ? RATES['anthropic-fast'] : RATES.anthropic;
  const textCost = (est.inputTokens / 1000) * rate.input + (est.outputTokens / 1000) * rate.output;
  const imageCost = est.images * RATES.dalle.perImage;

  return {
    estimatedCost: Math.round((textCost + imageCost) * 100000) / 100000,
    breakdown: { textCost, imageCost, inputTokens: est.inputTokens, outputTokens: est.outputTokens, images: est.images, tier: est.tier },
  };
}

export function canAfford(userId, estimatedCost) {
  const budget = getBudget(userId);
  const dailyRemaining = budget.dailyLimit - budget.todaySpent;
  const monthlyRemaining = budget.monthlyLimit - budget.monthSpent;
  return {
    canAfford: dailyRemaining >= estimatedCost && monthlyRemaining >= estimatedCost,
    dailyRemaining: Math.round(dailyRemaining * 100000) / 100000,
    monthlyRemaining: Math.round(monthlyRemaining * 100000) / 100000,
    todaySpent: Math.round(budget.todaySpent * 100000) / 100000,
    monthSpent: Math.round(budget.monthSpent * 100000) / 100000,
    totalSpent: Math.round(budget.totalSpent * 100000) / 100000,
    dailyLimit: budget.dailyLimit,
    monthlyLimit: budget.monthlyLimit,
    warningThreshold: dailyRemaining < budget.dailyLimit * 0.2,
  };
}

// Helper for AI routes
export function trackAiSpend(userId, usage, action) {
  const inputCost = (usage.inputTokens / 1000) * 0.003;
  const outputCost = (usage.outputTokens / 1000) * 0.015;
  const totalCost = inputCost + outputCost;
  recordSpend(userId, totalCost, action, {
    provider: usage.provider || 'anthropic',
    model: usage.model || '',
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  });
  return totalCost;
}

// Legacy compatibility
export function getSession(sessionId) { return getBudget(sessionId); }
export function setDailyLimit(sessionId, limit) { return updateBudgetLimits(sessionId, { dailyLimit: limit }); }
