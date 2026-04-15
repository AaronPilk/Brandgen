import { Router } from 'express';
import { validateToken } from '../services/auth.js';
import {
  getAgentDefinitions, getWorkspaceAgents, enableAgent, disableAgent,
  getAgentActivation,
} from '../services/agentRegistry.js';
import {
  discoverAgents, loadAgent, getLoadedAgents,
  queueAction, getActionQueue, approveAction, rejectAction,
  markActionExecuted, clearActionQueue, buildAgentContext, getExecutor,
} from '../agents/pluginLoader.js';
import { logEvent } from '../services/activityFeed.js';

const router = Router();

// Auth middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = validateToken(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Admin or manager access required' });
  }
  next();
}

router.use(requireAuth);

// ─── Agent Registry ───

// Get all agent definitions (built-in + discovered plugins)
router.get('/definitions', (req, res) => {
  const builtIn = getAgentDefinitions();
  const plugins = discoverAgents();
  res.json({ builtIn, plugins });
});

// Get agent states for a workspace (profile)
router.get('/:profileId/agents', (req, res) => {
  const agents = getWorkspaceAgents(req.params.profileId);
  res.json(agents);
});

// Enable/disable an agent for a workspace
router.post('/:profileId/agents/:agentKey/enable', requireAdmin, (req, res) => {
  try {
    const mode = req.body.mode || 'assist';
    const result = enableAgent(req.params.profileId, req.params.agentKey, mode);
    logEvent(req.params.profileId, 'AGENT_ENABLED', {
      agentKey: req.params.agentKey,
      mode,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:profileId/agents/:agentKey/disable', requireAdmin, (req, res) => {
  try {
    const result = disableAgent(req.params.profileId, req.params.agentKey);
    logEvent(req.params.profileId, 'AGENT_DISABLED', {
      agentKey: req.params.agentKey,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Action Queue ───

// Get pending actions for a profile
router.get('/:profileId/actions', (req, res) => {
  const status = req.query.status || 'pending';
  res.json(getActionQueue(req.params.profileId, status));
});

// Get all pending actions (admin view)
router.get('/actions/all', requireAdmin, (req, res) => {
  const status = req.query.status || 'pending';
  res.json(getActionQueue(null, status));
});

// Submit an action to the queue (called by agents via API)
router.post('/:profileId/actions', (req, res) => {
  try {
    const action = queueAction({
      ...req.body,
      profileId: req.params.profileId,
    });
    res.json(action);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve an action
router.post('/actions/:id/approve', requireAdmin, (req, res) => {
  try {
    const action = approveAction(req.params.id, req.user.id);
    if (!action) return res.status(404).json({ error: 'Action not found' });
    res.json(action);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reject an action
router.post('/actions/:id/reject', requireAdmin, (req, res) => {
  try {
    const action = rejectAction(req.params.id, req.user.id, req.body.reason);
    if (!action) return res.status(404).json({ error: 'Action not found' });
    res.json(action);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Execute an approved action
router.post('/actions/:id/execute', requireAdmin, async (req, res) => {
  try {
    const action = (await import('../services/db.js')).dbGet('agent-actions', req.params.id);
    if (!action) return res.status(404).json({ error: 'Action not found' });
    if (action.status !== 'approved') return res.status(400).json({ error: 'Action must be approved first' });

    const executor = getExecutor(action.profileId);
    let result;

    // Execute based on action type
    switch (action.type) {
      case 'create_post':
        result = executor.createPost(action.payload);
        break;
      case 'update_post':
        result = executor.updatePost(action.payload.id, action.payload.data);
        break;
      case 'schedule_post':
        result = executor.schedulePost(action.payload.id, action.payload.scheduledAt);
        break;
      case 'create_contact':
        result = executor.createContact(action.payload);
        break;
      case 'update_contact':
        result = executor.updateContact(action.payload.id, action.payload.data);
        break;
      case 'create_deal':
        result = executor.createDeal(action.payload);
        break;
      case 'update_deal':
        result = executor.updateDeal(action.payload.id, action.payload.data);
        break;
      case 'log_note':
        result = executor.logNote(action.payload.note);
        break;
      default:
        return res.status(400).json({ error: `Unknown action type: ${action.type}` });
    }

    markActionExecuted(req.params.id, result);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear action queue for a profile
router.delete('/:profileId/actions', requireAdmin, (req, res) => {
  res.json(clearActionQueue(req.params.profileId));
});

// ─── Agent Context (for agents to fetch their data) ───

router.get('/:profileId/context', async (req, res) => {
  try {
    const scopes = (req.query.scopes || 'brand,crm,calendar').split(',');
    const context = await buildAgentContext(req.params.profileId, scopes);
    res.json(context);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Plugin Management ───

router.get('/plugins/discovered', requireAdmin, (req, res) => {
  res.json(discoverAgents());
});

router.get('/plugins/loaded', requireAdmin, (req, res) => {
  res.json(getLoadedAgents());
});

router.post('/plugins/:agentKey/load', requireAdmin, async (req, res) => {
  try {
    const plugin = await loadAgent(req.params.agentKey);
    res.json({ loaded: true, manifest: plugin.manifest });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export { router as agentRoutes };
