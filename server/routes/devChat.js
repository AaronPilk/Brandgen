import { Router } from 'express';
import { validateToken } from '../services/auth.js';
import { generateWithClaude } from '../services/claude.js';
import { trackAiSpend } from '../services/tokenBudget.js';
import { dbGet } from '../services/db.js';
import { getBrandFacts, getCrmSummary } from '../services/brandMemory.js';
import {
  buildResearchContext, buildLandingPageContext, buildAdCreativeContext,
  buildNurtureContext, buildCrmContext,
} from '../services/contextBuilder.js';

const router = Router();

// Admin-only middleware
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = validateToken(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  req.user = user;
  next();
}

const DEV_SYSTEM_PROMPT = `You are a helpful AI assistant inside BrandGen, an AI-powered brand and lead generation platform. You help the admin with questions about marketing, business strategy, and platform usage. Be concise and direct.`;

router.post('/', requireAdmin, async (req, res) => {
  const { messages, profileId, injectContext } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Build system prompt — default is plain, context only if explicitly requested
  let systemPrompt = DEV_SYSTEM_PROMPT;

  if (profileId && injectContext) {
    const profile = dbGet('profiles', profileId);
    if (profile) {
      // Only inject the specific context type requested
      let contextStr = '';
      if (injectContext === 'brand') {
        const facts = getBrandFacts(profile);
        contextStr = `\n\nBrand context: ${JSON.stringify(facts, null, 0).substring(0, 800)}`;
      } else if (injectContext === 'research') {
        contextStr = `\n\nResearch context: ${buildResearchContext(profile)}`;
      } else if (injectContext === 'landing') {
        contextStr = `\n\nLanding page context: ${buildLandingPageContext(profile)}`;
      } else if (injectContext === 'ads') {
        contextStr = `\n\nAd creative context: ${buildAdCreativeContext(profile)}`;
      } else if (injectContext === 'nurture') {
        contextStr = `\n\nEmail/SMS context: ${buildNurtureContext(profile)}`;
      } else if (injectContext === 'crm') {
        contextStr = `\n\nCRM context: ${buildCrmContext(profile)}`;
      }
      // injectContext === true or any other value = no context injected
      if (contextStr) {
        systemPrompt += contextStr;
      }
    }
  }

  // Format messages for the AI call — only use the last message as user prompt,
  // include recent history in system prompt for continuity (capped)
  const recentHistory = messages.slice(-6, -1);
  const currentMessage = messages[messages.length - 1];

  let historyStr = '';
  if (recentHistory.length > 0) {
    historyStr = '\n\nRecent conversation:\n' + recentHistory
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${(m.content || '').substring(0, 300)}`)
      .join('\n');
  }

  const fullSystem = systemPrompt + historyStr;
  const userPrompt = currentMessage.content || '';

  try {
    const result = await generateWithClaude(fullSystem, userPrompt, 1024, 'standard');

    // Log usage
    trackAiSpend(req.user.id, result, 'dev-chat');

    res.json({
      reply: result.text,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { router as devChatRoutes };
