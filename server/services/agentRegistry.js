// Agent Registry — definitions, capabilities, and workspace activation state
// V1: Definitions only. No execution logic. No auto-run.
// Agents are activated per-workspace via the workspace-agents DB collection.

import { dbGet, dbSet, dbDelete, dbList } from './db.js';

// ─── Agent Definitions ───
// Each agent declares what it can do, what data it can access,
// and what workflows it owns. No execute() methods.

const AGENTS = {
  sales_agent: {
    key: 'sales_agent',
    name: 'Sales Agent',
    purpose: 'Manage leads, follow-up sequences, deal progression, and sales pipeline optimization',
    allowedDataScope: ['crm', 'nurture'],
    allowedWorkflows: ['email-sequences', 'sms-sequences'],
    triggerEvents: ['new_contact', 'deal_stage_change', 'contact_status_change'],
    defaultMode: 'disabled',
    category: 'sales',
    icon: 'dollar-sign',
    color: 'green',
  },

  campaign_agent: {
    key: 'campaign_agent',
    name: 'Campaign Agent',
    purpose: 'Plan, prepare, and manage ad campaigns across Meta and other platforms',
    allowedDataScope: ['brand', 'ads', 'research'],
    allowedWorkflows: ['ad-creatives', 'meta-campaign'],
    triggerEvents: ['campaign_performance_drop', 'budget_threshold', 'new_campaign_request'],
    defaultMode: 'disabled',
    category: 'ads',
    icon: 'megaphone',
    color: 'blue',
  },

  creative_agent: {
    key: 'creative_agent',
    name: 'Creative Agent',
    purpose: 'Generate logos, product mockups, ad visuals, and brand identity assets',
    allowedDataScope: ['brand', 'visual'],
    allowedWorkflows: ['logo-concepts', 'product-mockups', 'ad-creatives'],
    triggerEvents: ['new_campaign_request', 'brand_refresh_request'],
    defaultMode: 'disabled',
    category: 'creative',
    icon: 'palette',
    color: 'pink',
  },

  landing_page_agent: {
    key: 'landing_page_agent',
    name: 'Landing Page Agent',
    purpose: 'Build and optimize conversion-focused landing pages and websites',
    allowedDataScope: ['brand', 'landing', 'research'],
    allowedWorkflows: ['landing-page', 'brand-strategy'],
    triggerEvents: ['new_campaign_request', 'landing_page_request', 'performance_optimization'],
    defaultMode: 'disabled',
    category: 'content',
    icon: 'globe',
    color: 'purple',
  },

  analytics_agent: {
    key: 'analytics_agent',
    name: 'Analytics Agent',
    purpose: 'Monitor performance metrics, generate reports, and surface optimization insights',
    allowedDataScope: ['brand', 'crm', 'ads'],
    allowedWorkflows: ['market-research'],
    triggerEvents: ['daily_report', 'performance_anomaly', 'budget_alert'],
    defaultMode: 'disabled',
    category: 'analytics',
    icon: 'bar-chart',
    color: 'purple',
  },

  retention_agent: {
    key: 'retention_agent',
    name: 'Retention Agent',
    purpose: 'Re-engage inactive contacts, manage win-back sequences, and monitor churn signals',
    allowedDataScope: ['crm', 'nurture'],
    allowedWorkflows: ['email-sequences', 'sms-sequences'],
    triggerEvents: ['contact_inactive', 'deal_lost', 'churn_risk'],
    defaultMode: 'disabled',
    category: 'retention',
    icon: 'users',
    color: 'cyan',
  },
};

// ─── Registry Queries ───

export function getAgentDefinitions() {
  return AGENTS;
}

export function getAgentDefinition(key) {
  return AGENTS[key] || null;
}

export function getAgentForWorkflow(workflowKey) {
  return Object.values(AGENTS).filter((a) =>
    a.allowedWorkflows.includes(workflowKey)
  );
}

export function getAgentsByCategory(category) {
  return Object.values(AGENTS).filter((a) => a.category === category);
}

// ─── Workspace Activation State ───
// Stored in DB collection 'workspace-agents', keyed by 'profileId:agentKey'
// Default: not present = disabled. Activation is an explicit write.

// Activation modes:
//   disabled  = agent is off (default)
//   assist    = agent suggests actions, human executes
//   semi_auto = agent executes low-risk actions, human approves high-risk
//   auto      = agent executes all actions (requires explicit opt-in, future only)

const VALID_MODES = ['disabled', 'assist', 'semi_auto', 'auto'];

function activationKey(profileId, agentKey) {
  return `${profileId}:${agentKey}`;
}

export function getAgentActivation(profileId, agentKey) {
  const record = dbGet('workspace-agents', activationKey(profileId, agentKey));
  if (!record) {
    return {
      profileId,
      agentKey,
      mode: 'disabled',
      active: false,
      activatedAt: null,
    };
  }
  return record;
}

export function getWorkspaceAgents(profileId) {
  const all = dbList('workspace-agents', (r) => r.profileId === profileId);
  // Merge with definitions to show all agents with their activation state
  return Object.values(AGENTS).map((def) => {
    const activation = all.find((a) => a.agentKey === def.key);
    return {
      ...def,
      mode: activation?.mode || 'disabled',
      active: activation?.mode && activation.mode !== 'disabled',
      activatedAt: activation?.activatedAt || null,
    };
  });
}

export function enableAgent(profileId, agentKey, mode = 'assist') {
  if (!AGENTS[agentKey]) throw new Error(`Unknown agent: ${agentKey}`);
  if (!VALID_MODES.includes(mode)) throw new Error(`Invalid mode: ${mode}`);

  const record = {
    profileId,
    agentKey,
    mode,
    active: mode !== 'disabled',
    activatedAt: Date.now(),
  };
  dbSet('workspace-agents', activationKey(profileId, agentKey), record);
  return record;
}

export function disableAgent(profileId, agentKey) {
  return enableAgent(profileId, agentKey, 'disabled');
}

// ─── Execution Guard ───
// Used by future execution layers to check if an agent is allowed to act.
// V1: always returns false for 'auto' mode since it's not implemented.

export function canExecute(agentKey, profileId) {
  const activation = getAgentActivation(profileId, agentKey);
  if (!activation.active) return false;
  if (activation.mode === 'auto') return false; // V1: auto not implemented
  return true; // assist and semi_auto are allowed in future
}

export function canAutoExecute(agentKey, profileId) {
  return false; // V1: never auto-execute
}
