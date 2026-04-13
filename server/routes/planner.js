import { Router } from 'express';
import { validateToken } from '../services/auth.js';
import { generatePlan, getWorkflowRegistry } from '../services/planner.js';
import { trackAiSpend } from '../services/tokenBudget.js';

const router = Router();

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = validateToken(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  req.user = user;
  next();
}

// GET /api/planner/workflows — returns available workflow metadata
router.get('/workflows', requireAdmin, (req, res) => {
  res.json(getWorkflowRegistry());
});

// POST /api/planner/plan — generate a plan from a goal
router.post('/plan', requireAdmin, async (req, res) => {
  const { goal, profileId } = req.body;
  if (!goal) return res.status(400).json({ error: 'goal is required' });

  try {
    const result = await generatePlan(goal, profileId);

    // Log usage
    trackAiSpend(req.user.id, {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
    }, 'planner');

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { router as plannerRoutes };
