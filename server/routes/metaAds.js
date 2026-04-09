import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  isMetaAdsConfigured,
  getCampaigns,
  getCampaignInsights,
  getAccountInsights,
  prepareCampaign,
  prepareAdSet,
  prepareAdCreative,
  executeApprovedAction,
} from '../services/metaAds.js';
import { generateWithClaude } from '../services/claude.js';
import { dbGet, dbSet, dbList, dbDelete } from '../services/db.js';

const router = Router();

// ─── Status ───
router.get('/status', (req, res) => {
  res.json({ configured: isMetaAdsConfigured() });
});

// ─── READ: Get existing campaigns ───
router.get('/campaigns', async (req, res) => {
  try {
    if (!isMetaAdsConfigured()) return res.status(400).json({ error: 'Meta Ads not configured' });
    const data = await getCampaigns();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── READ: Get campaign performance ───
router.get('/campaigns/:id/insights', async (req, res) => {
  try {
    if (!isMetaAdsConfigured()) return res.status(400).json({ error: 'Meta Ads not configured' });
    const data = await getCampaignInsights(req.params.id, req.query.datePreset || 'last_30d');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── READ: Get account-level performance ───
router.get('/account/insights', async (req, res) => {
  try {
    if (!isMetaAdsConfigured()) return res.status(400).json({ error: 'Meta Ads not configured' });
    const data = await getAccountInsights(req.query.datePreset || 'last_30d');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI PREPARE: Use Claude to design a campaign, then queue for approval ───
router.post('/prepare-campaign', async (req, res) => {
  try {
    if (!isMetaAdsConfigured()) return res.status(400).json({ error: 'Meta Ads not configured' });

    const { profile, dailyBudget, objective, notes } = req.body;
    const intake = profile?.intake || {};

    const systemPrompt = `You are a Meta Ads campaign strategist. Based on the business profile, create a campaign configuration. Output JSON with keys: campaignName, objective (one of: OUTCOME_LEADS, OUTCOME_TRAFFIC, OUTCOME_AWARENESS, OUTCOME_SALES), adSetName, targeting (object with: geo_locations, age_min, age_max, interests), optimizationGoal, headline, primaryText, description, callToAction (one of: LEARN_MORE, SIGN_UP, GET_QUOTE, CONTACT_US, BOOK_NOW).`;

    const userPrompt = `Design a Meta ad campaign for: ${intake.brandName || intake.industry || 'this business'}. Industry: ${intake.industry || 'general'}. Target: ${intake.geoTargets || intake.targetCustomer || 'general audience'}. Goal: ${intake.primaryGoal || objective || 'leads'}. Daily budget: $${dailyBudget || 20}. ${notes ? `Additional notes: ${notes}` : ''}`;

    const result = await generateWithClaude(systemPrompt, userPrompt, 800);

    let config;
    try {
      const cleaned = result.text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      config = JSON.parse(cleaned);
    } catch {
      const match = result.text.match(/\{[\s\S]*\}/);
      config = match ? JSON.parse(match[0]) : null;
    }

    if (!config) {
      return res.status(500).json({ error: 'Failed to parse AI campaign config', raw: result.text });
    }

    // Create pending actions for the approval queue
    const pendingItems = [];
    const budget = dailyBudget || 20;

    // 1. Campaign
    const campaign = prepareCampaign({
      name: config.campaignName || `${intake.brandName || 'BrandGen'} Campaign`,
      objective: config.objective || objective || 'OUTCOME_LEADS',
      dailyBudget: budget,
    });
    const campaignQueueItem = {
      id: uuidv4(),
      profileId: profile.id,
      ...campaign,
      status: 'pending',
      createdAt: Date.now(),
    };
    dbSet('approval-queue', campaignQueueItem.id, campaignQueueItem);
    pendingItems.push(campaignQueueItem);

    // 2. Ad Creative
    if (config.headline && config.primaryText) {
      const creative = prepareAdCreative({
        name: `${config.campaignName || 'BrandGen'} Creative`,
        pageId: req.body.pageId || 'PAGE_ID_NEEDED',
        headline: config.headline,
        body: config.primaryText,
        description: config.description || '',
        callToAction: config.callToAction || 'LEARN_MORE',
        linkUrl: intake.websiteUrl || 'https://example.com',
      });
      const creativeQueueItem = {
        id: uuidv4(),
        profileId: profile.id,
        ...creative,
        status: 'pending',
        createdAt: Date.now(),
      };
      dbSet('approval-queue', creativeQueueItem.id, creativeQueueItem);
      pendingItems.push(creativeQueueItem);
    }

    res.json({ pendingItems, aiConfig: config, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── QUEUE: Get all pending items for a profile ───
router.get('/queue/:profileId', (req, res) => {
  const items = dbList('approval-queue', (item) => item.profileId === req.params.profileId);
  res.json(items.sort((a, b) => b.createdAt - a.createdAt));
});

// ─── QUEUE: Get all pending items (all profiles) ───
router.get('/queue', (req, res) => {
  const items = dbList('approval-queue');
  res.json(items.sort((a, b) => b.createdAt - a.createdAt));
});

// ─── APPROVE: Execute a pending action ───
router.post('/approve/:id', async (req, res) => {
  try {
    const item = dbGet('approval-queue', req.params.id);
    if (!item) return res.status(404).json({ error: 'Queue item not found' });
    if (item.status !== 'pending') return res.status(400).json({ error: `Item already ${item.status}` });

    // Execute the action against Meta API
    const result = await executeApprovedAction(item);

    // Update queue item to approved
    dbSet('approval-queue', item.id, {
      ...item,
      status: 'approved',
      result,
      approvedAt: Date.now(),
    });

    res.json({
      success: true,
      message: `${item.humanSummary.action} executed successfully`,
      result,
    });
  } catch (err) {
    // Mark as failed
    const item = dbGet('approval-queue', req.params.id);
    if (item) {
      dbSet('approval-queue', item.id, {
        ...item,
        status: 'failed',
        error: err.message,
        failedAt: Date.now(),
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── REJECT: Remove a pending action ───
router.post('/reject/:id', (req, res) => {
  const item = dbGet('approval-queue', req.params.id);
  if (!item) return res.status(404).json({ error: 'Queue item not found' });

  dbSet('approval-queue', item.id, {
    ...item,
    status: 'rejected',
    rejectedAt: Date.now(),
    reason: req.body.reason || '',
  });

  res.json({ success: true, message: 'Action rejected' });
});

// ─── CLEAR: Remove resolved items ───
router.delete('/queue/clear/:profileId', (req, res) => {
  const items = dbList('approval-queue', (item) =>
    item.profileId === req.params.profileId &&
    (item.status === 'approved' || item.status === 'rejected' || item.status === 'failed')
  );
  items.forEach((item) => dbDelete('approval-queue', item.id));
  res.json({ cleared: items.length });
});

export { router as metaAdsRoutes };
