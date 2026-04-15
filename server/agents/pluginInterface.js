// ─── Agent Plugin Interface ───
// Standard interface that all external agents must implement.
// Each agent is a separate repo added as a git submodule under server/agents/<name>/
// The agent repo must export a default object matching this interface.
//
// Communication flow:
//   BrandGen ←→ AgentPlugin ←→ External Agent (separate process or module)
//
// Agents receive: brand context, CRM data, calendar data, platform data
// Agents return: structured actions (create post, send email, update deal, etc.)
// All agent actions go through BrandGen's approval queue before execution.

/**
 * @typedef {Object} AgentManifest
 * @property {string} key          - Unique agent identifier (e.g. 'sales_agent')
 * @property {string} name         - Display name
 * @property {string} version      - Semver
 * @property {string} description  - What this agent does
 * @property {string[]} scopes     - Data scopes it needs: ['crm', 'calendar', 'ads', 'brand', 'analytics']
 * @property {string[]} actions    - Actions it can perform: ['create_post', 'send_email', 'update_deal', etc.]
 * @property {string[]} triggers   - Events it subscribes to: ['new_contact', 'deal_stage_change', 'schedule_due']
 * @property {Object} config       - Agent-specific config schema
 */

/**
 * @typedef {Object} AgentAction
 * @property {string} type         - Action type: 'create_post', 'send_email', 'update_contact', etc.
 * @property {string} agentKey     - Which agent proposed this
 * @property {string} profileId    - Target profile
 * @property {Object} payload      - Action-specific data
 * @property {string} reasoning    - Why the agent wants to do this (shown to human approver)
 * @property {string} priority     - 'low' | 'medium' | 'high' | 'urgent'
 * @property {boolean} requiresApproval - Whether this needs human approval before execution
 */

// ─── Standard Action Types ───
export const ACTION_TYPES = {
  // Content Calendar
  CREATE_POST: 'create_post',
  UPDATE_POST: 'update_post',
  SCHEDULE_POST: 'schedule_post',

  // CRM
  CREATE_CONTACT: 'create_contact',
  UPDATE_CONTACT: 'update_contact',
  UPDATE_DEAL: 'update_deal',
  CREATE_DEAL: 'create_deal',

  // Communication
  SEND_EMAIL: 'send_email',
  SEND_SMS: 'send_sms',

  // Ads
  PREPARE_CAMPAIGN: 'prepare_campaign',
  ADJUST_BUDGET: 'adjust_budget',

  // Analytics
  GENERATE_REPORT: 'generate_report',
  SURFACE_INSIGHT: 'surface_insight',

  // Generic
  LOG_NOTE: 'log_note',
  TRIGGER_WORKFLOW: 'trigger_workflow',
};

// ─── Data Scopes ───
// What data each scope gives the agent access to
export const DATA_SCOPES = {
  brand: 'Profile intake data, brand facts, research, strategy',
  crm: 'Contacts, deals, pipeline stats',
  calendar: 'Content calendar posts, schedule, stats',
  ads: 'Meta campaigns, ad performance, creatives',
  analytics: 'Platform data, performance metrics, insights',
  nurture: 'Email/SMS sequences, nurture data',
};

// ─── Plugin Base Class ───
// External agents extend this or implement the same interface

export class AgentPlugin {
  constructor(manifest) {
    this.manifest = manifest;
    this._registered = false;
  }

  /** Called once when BrandGen loads the agent */
  async initialize(config) {
    throw new Error('Agent must implement initialize()');
  }

  /** Called when an event the agent subscribes to fires */
  async onEvent(event, context) {
    throw new Error('Agent must implement onEvent()');
  }

  /**
   * Called when BrandGen asks the agent to propose actions
   * @param {string} goal - What the user or system wants done
   * @param {Object} context - Brand context, CRM data, etc. (filtered by scopes)
   * @returns {AgentAction[]} - List of proposed actions
   */
  async propose(goal, context) {
    throw new Error('Agent must implement propose()');
  }

  /**
   * Called after a proposed action is approved by a human
   * Agent can now execute the action via the provided executor
   * @param {AgentAction} action - The approved action
   * @param {Object} executor - Functions to execute the action (createPost, updateContact, etc.)
   * @returns {Object} - Result of execution
   */
  async execute(action, executor) {
    throw new Error('Agent must implement execute()');
  }

  /** Health check */
  async healthCheck() {
    return { status: 'ok', agent: this.manifest.key, version: this.manifest.version };
  }

  /** Cleanup when agent is disabled */
  async shutdown() {
    // Override if needed
  }
}

// ─── Example Manifest (for documentation) ───
export const EXAMPLE_MANIFEST = {
  key: 'sales_agent',
  name: 'Sales Agent',
  version: '1.0.0',
  description: 'Manages leads, follow-up sequences, deal progression, and sales pipeline optimization',
  scopes: ['crm', 'nurture', 'brand'],
  actions: ['create_contact', 'update_contact', 'update_deal', 'send_email', 'send_sms', 'log_note'],
  triggers: ['new_contact', 'deal_stage_change', 'contact_inactive', 'daily_digest'],
  config: {
    followUpDelayHours: 24,
    maxEmailsPerDay: 50,
    autoQualifyThreshold: 0.7,
  },
};
