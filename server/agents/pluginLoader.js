// ─── Agent Plugin Loader ───
// Discovers, loads, and manages agent plugins from the server/agents/ directory.
// Each agent is either:
//   1. A git submodule directory (e.g. server/agents/sales-agent/)
//   2. A local plugin file (e.g. server/agents/my-agent.js)
//
// The loader reads each agent's manifest, validates it, and registers it
// with BrandGen's agent registry and action queue.

import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbSet, dbList, dbDelete } from '../services/db.js';
import { logEvent } from '../services/activityFeed.js';
import { AgentPlugin, ACTION_TYPES, DATA_SCOPES } from './pluginInterface.js';
import { listContacts, listDeals, getContactStats, getDealStats, createContact, updateContact, createDeal, updateDeal } from '../services/crm.js';
import { listPosts, getCalendarStats, createPost, updatePost, schedulePost } from '../services/contentCalendar.js';
import { getBrandFacts } from '../services/brandMemory.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = __dirname; // server/agents/ is where submodule dirs live
const loadedPlugins = new Map(); // key → AgentPlugin instance

// ─── Discovery & Loading ───

export function discoverAgents() {
  if (!existsSync(AGENTS_DIR)) return [];
  const entries = readdirSync(AGENTS_DIR);
  const agents = [];

  for (const entry of entries) {
    const entryPath = join(AGENTS_DIR, entry);
    try {
      const stat = statSync(entryPath);
      // Skip non-directories and system files
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }
    if (entry.startsWith('.') || entry === 'node_modules') continue;

    // Look for manifest.json or index.js in the agent directory
    const manifestPath = join(entryPath, 'manifest.json');
    const indexPath = join(entryPath, 'index.js');

    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        agents.push({ ...manifest, path: entryPath, hasIndex: existsSync(indexPath) });
      } catch (err) {
        console.error(`[AgentLoader] Failed to read manifest for ${entry}:`, err.message);
      }
    }
  }

  return agents;
}

export async function loadAgent(agentKey) {
  if (loadedPlugins.has(agentKey)) return loadedPlugins.get(agentKey);

  const agents = discoverAgents();
  const agentInfo = agents.find((a) => a.key === agentKey);
  if (!agentInfo) throw new Error(`Agent "${agentKey}" not found in agents directory`);

  if (agentInfo.hasIndex) {
    try {
      const module = await import(join(agentInfo.path, 'index.js'));
      const plugin = module.default || module;
      loadedPlugins.set(agentKey, plugin);
      return plugin;
    } catch (err) {
      console.error(`[AgentLoader] Failed to load agent ${agentKey}:`, err.message);
      throw err;
    }
  }

  // Return manifest-only reference if no executable code
  return { manifest: agentInfo, loaded: false };
}

export function getLoadedAgents() {
  return Array.from(loadedPlugins.entries()).map(([key, plugin]) => ({
    key,
    manifest: plugin.manifest || { key },
    loaded: true,
  }));
}

export function unloadAgent(agentKey) {
  const plugin = loadedPlugins.get(agentKey);
  if (plugin?.shutdown) plugin.shutdown();
  loadedPlugins.delete(agentKey);
}

// ─── Action Queue ───
// All agent-proposed actions go through an approval queue before execution.
// This is the safety layer — no agent can directly modify data.

export function queueAction(action) {
  const id = uuidv4();
  const record = {
    id,
    agentKey: action.agentKey,
    profileId: action.profileId,
    type: action.type,
    payload: action.payload,
    reasoning: action.reasoning || '',
    priority: action.priority || 'medium',
    requiresApproval: action.requiresApproval !== false, // default true
    status: action.requiresApproval !== false ? 'pending' : 'auto_approved',
    createdAt: Date.now(),
    reviewedAt: null,
    reviewedBy: null,
    result: null,
  };
  dbSet('agent-actions', id, record);
  return record;
}

export function getActionQueue(profileId, status) {
  return dbList('agent-actions', (a) => {
    if (profileId && a.profileId !== profileId) return false;
    if (status && a.status !== status) return false;
    return true;
  }).sort((a, b) => {
    // Priority order: urgent > high > medium > low
    const prio = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (prio[a.priority] !== prio[b.priority]) return prio[a.priority] - prio[b.priority];
    return b.createdAt - a.createdAt;
  });
}

export function approveAction(actionId, userId) {
  const action = dbGet('agent-actions', actionId);
  if (!action) return null;
  if (action.status !== 'pending') throw new Error('Action is not pending');
  const updated = { ...action, status: 'approved', reviewedAt: Date.now(), reviewedBy: userId };
  dbSet('agent-actions', actionId, updated);
  logEvent(action.profileId, 'AGENT_ACTION', {
    agentKey: action.agentKey,
    actionType: action.type,
    approved: true,
  });
  return updated;
}

export function rejectAction(actionId, userId, reason) {
  const action = dbGet('agent-actions', actionId);
  if (!action) return null;
  if (action.status !== 'pending') throw new Error('Action is not pending');
  const updated = { ...action, status: 'rejected', reviewedAt: Date.now(), reviewedBy: userId, rejectionReason: reason };
  dbSet('agent-actions', actionId, updated);
  return updated;
}

export function markActionExecuted(actionId, result) {
  const action = dbGet('agent-actions', actionId);
  if (!action) return null;
  const updated = { ...action, status: 'executed', result, executedAt: Date.now() };
  dbSet('agent-actions', actionId, updated);
  return updated;
}

export function clearActionQueue(profileId) {
  const actions = dbList('agent-actions', (a) => a.profileId === profileId);
  actions.forEach((a) => dbDelete('agent-actions', a.id));
  return { cleared: actions.length };
}

// ─── Context Builder for Agents ───
// Builds the context object that gets passed to agents based on their scopes

export function buildAgentContext(profileId, scopes) {
  const context = { profileId };

  if (scopes.includes('brand')) {
    const profile = dbGet('profiles', profileId);
    if (profile) {
      context.brand = {
        name: profile.intake?.brandName || profile.intake?.industry,
        mode: profile.mode,
        intake: profile.intake,
        facts: getBrandFacts(profile),
      };
    }
  }

  if (scopes.includes('crm')) {
    context.crm = {
      contacts: listContacts(profileId),
      deals: listDeals(profileId),
      contactStats: getContactStats(profileId),
      dealStats: getDealStats(profileId),
    };
  }

  if (scopes.includes('calendar')) {
    context.calendar = {
      posts: listPosts(profileId),
      stats: getCalendarStats(profileId),
    };
  }

  return context;
}

// ─── Agent Executor ───
// Functions that agents call to actually perform actions (after approval)

export function getExecutor(profileId) {
  return {
    // Calendar
    createPost: (data) => createPost(profileId, { ...data, aiGenerated: true }),
    updatePost: (id, data) => updatePost(id, data),
    schedulePost: (id, scheduledAt) => schedulePost(id, scheduledAt),

    // CRM
    createContact: (data) => createContact(profileId, data),
    updateContact: (id, data) => updateContact(id, data),
    createDeal: (data) => createDeal(profileId, data),
    updateDeal: (id, data) => updateDeal(id, data),

    // Activity
    logNote: (note) => logEvent(profileId, 'AGENT_ACTION', { note }),
  };
}
