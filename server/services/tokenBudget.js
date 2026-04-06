// Token budget tracking service
// Tracks API spend per session to enforce daily limits

const sessions = new Map();

// Approximate costs per 1K tokens (USD)
const COST_PER_1K_INPUT = 0.003;
const COST_PER_1K_OUTPUT = 0.015;
const DALLE_COST_PER_IMAGE = 0.040;

export function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      dailyLimit: 10.0,
      totalSpent: 0,
      actions: [],
      createdAt: Date.now(),
    });
  }
  return sessions.get(sessionId);
}

export function setDailyLimit(sessionId, limit) {
  const session = getSession(sessionId);
  session.dailyLimit = limit;
  return session;
}

export function estimateCost(action) {
  const estimates = {
    'market-research': { inputTokens: 500, outputTokens: 800, images: 0 },
    'landing-page': { inputTokens: 600, outputTokens: 800, images: 0 },
    'ad-creatives': { inputTokens: 400, outputTokens: 800, images: 0 },
    'email-sequences': { inputTokens: 400, outputTokens: 800, images: 0 },
    'sms-sequences': { inputTokens: 300, outputTokens: 800, images: 0 },
    'logo-concepts': { inputTokens: 300, outputTokens: 400, images: 3 },
    'product-mockups': { inputTokens: 300, outputTokens: 400, images: 3 },
    'brand-strategy': { inputTokens: 500, outputTokens: 800, images: 0 },
    'social-setup': { inputTokens: 400, outputTokens: 800, images: 0 },
    'tracking-pixels': { inputTokens: 200, outputTokens: 600, images: 0 },
  };

  const est = estimates[action] || { inputTokens: 400, outputTokens: 800, images: 0 };
  const textCost = (est.inputTokens / 1000) * COST_PER_1K_INPUT +
    (est.outputTokens / 1000) * COST_PER_1K_OUTPUT;
  const imageCost = est.images * DALLE_COST_PER_IMAGE;

  return {
    estimatedCost: Math.round((textCost + imageCost) * 1000) / 1000,
    breakdown: {
      textCost: Math.round(textCost * 1000) / 1000,
      imageCost: Math.round(imageCost * 1000) / 1000,
      inputTokens: est.inputTokens,
      outputTokens: est.outputTokens,
      images: est.images,
    },
  };
}

export function recordSpend(sessionId, amount, action) {
  const session = getSession(sessionId);
  session.totalSpent += amount;
  session.actions.push({ action, amount, timestamp: Date.now() });
  return session;
}

export function canAfford(sessionId, estimatedCost) {
  const session = getSession(sessionId);
  const remaining = session.dailyLimit - session.totalSpent;
  return {
    canAfford: remaining >= estimatedCost,
    remaining: Math.round(remaining * 1000) / 1000,
    totalSpent: Math.round(session.totalSpent * 1000) / 1000,
    dailyLimit: session.dailyLimit,
    warningThreshold: remaining < session.dailyLimit * 0.2,
  };
}
