// Planner service — interprets natural language goals into structured task plans
// V1: plan mode only. No auto-execution. No side effects.

import { generateWithClaude } from './claude.js';
import { getBrandFacts } from './brandMemory.js';
import { dbGet } from './db.js';

// ─── Workflow Registry ───
// Static metadata about available workflows. No DB reads, no AI calls.
const WORKFLOWS = {
  'market-research': {
    name: 'Market Research',
    description: 'Analyze industry, competitors, and target audience',
    requiredInputs: ['industry or brandName'],
    optionalInputs: ['geoTargets', 'competitorUrls', 'adBudget'],
    estimatedCost: '$0.01-0.02',
    tier: 'standard',
    category: 'research',
  },
  'landing-page': {
    name: 'Build Landing Page',
    description: 'Generate conversion-focused HTML landing page',
    requiredInputs: ['brandName or industry', 'primaryGoal'],
    optionalInputs: ['referenceLinks', 'notes', 'files'],
    estimatedCost: '$0.01-0.02',
    tier: 'standard',
    category: 'content',
    dependsOn: ['market-research'],
  },
  'ad-creatives': {
    name: 'Create Ad Creatives',
    description: 'Generate 10 ad concepts for Meta and TikTok',
    requiredInputs: ['brandName or industry', 'targetCustomer'],
    optionalInputs: ['inspirationLinks', 'adNotes', 'files'],
    estimatedCost: '$0.01-0.02',
    tier: 'standard',
    category: 'creative',
    dependsOn: ['market-research'],
  },
  'email-sequences': {
    name: 'Build Email Sequences',
    description: 'Generate 5-email nurture sequence',
    requiredInputs: ['industry or brandName'],
    optionalInputs: ['salesCycle', 'primaryGoal'],
    estimatedCost: '$0.005',
    tier: 'fast',
    category: 'nurture',
  },
  'sms-sequences': {
    name: 'Build SMS Sequences',
    description: 'Generate 5-message SMS follow-up',
    requiredInputs: ['industry or brandName'],
    optionalInputs: ['salesCycle', 'primaryGoal'],
    estimatedCost: '$0.003',
    tier: 'fast',
    category: 'nurture',
  },
  'logo-concepts': {
    name: 'Generate Logo Concepts',
    description: '3 logo variations via DALL-E',
    requiredInputs: ['brandName'],
    optionalInputs: ['brandVibe', 'industry'],
    estimatedCost: '$0.13',
    tier: 'standard',
    category: 'creative',
  },
  'product-mockups': {
    name: 'Create Product Mockups',
    description: '3 product mockups via DALL-E',
    requiredInputs: ['brandName', 'whatYouSell'],
    optionalInputs: ['brandVibe'],
    estimatedCost: '$0.13',
    tier: 'standard',
    category: 'creative',
  },
  'social-setup': {
    name: 'Social Media Setup',
    description: 'Profile setup guide with content plan',
    requiredInputs: ['brandName', 'platform'],
    optionalInputs: ['targetCustomer', 'brandVibe'],
    estimatedCost: '$0.005',
    tier: 'fast',
    category: 'content',
  },
  'brand-strategy': {
    name: 'Brand Strategy',
    description: 'Positioning, voice, personas, taglines',
    requiredInputs: ['brandName or industry'],
    optionalInputs: ['targetCustomer', 'competitorUrls', 'brandVibe'],
    estimatedCost: '$0.01-0.02',
    tier: 'standard',
    category: 'research',
  },
  'meta-campaign': {
    name: 'Prepare Meta Ad Campaign',
    description: 'AI-designed campaign sent to approval queue',
    requiredInputs: ['brandName or industry', 'dailyBudget'],
    optionalInputs: ['objective', 'notes'],
    estimatedCost: '$0.01-0.02',
    tier: 'standard',
    category: 'ads',
    requiresApproval: true,
  },
};

export function getWorkflowRegistry() {
  return WORKFLOWS;
}

// ─── Execution Modes ───
// plan  = return plan only, no side effects (V1 default)
// assist = pre-fill inputs for user to review and execute (future)
// auto   = execute with approval gates (future, not built)
const EXECUTION_MODES = ['plan', 'assist', 'auto'];

// ─── Task Schema ───
// Each planned step follows this shape:
// {
//   step: 1,
//   workflow: 'ad-creatives',
//   name: 'Create Ad Creatives',
//   reason: 'why this step is needed',
//   inputs: { key: value },
//   missingInputs: ['field1'],
//   dependsOn: [stepNumber],
//   estimatedCost: '$0.01',
//   requiresApproval: false,
// }

// ─── Plan Generator ───
export async function generatePlan(goal, profileId, options = {}) {
  const executionMode = 'plan'; // V1: always plan mode

  // Minimal workspace summary — brand name, mode, what's already built
  let workspaceSummary = 'No profile selected.';
  if (profileId) {
    const profile = dbGet('profiles', profileId);
    if (profile) {
      const facts = getBrandFacts(profile);
      workspaceSummary = [
        facts.brandName ? `Brand: ${facts.brandName}` : null,
        facts.industry ? `Industry: ${facts.industry}` : null,
        facts.mode ? `Mode: ${facts.mode}` : null,
        facts.primaryGoal ? `Goal: ${facts.primaryGoal}` : null,
        facts.generatedAssets.length > 0 ? `Already built: ${facts.generatedAssets.join(', ')}` : 'Nothing generated yet',
      ].filter(Boolean).join('. ');
    }
  }

  // Build workflow list for the AI (compact)
  const workflowList = Object.entries(WORKFLOWS)
    .map(([key, w]) => `- ${key}: ${w.description} (${w.estimatedCost}, requires: ${w.requiredInputs.join(', ')})`)
    .join('\n');

  const systemPrompt = `You are a marketing operations planner inside BrandGen. Given a user goal, break it into a step-by-step plan using the available workflows below.

Available workflows:
${workflowList}

Output a JSON object with:
- summary: one-sentence description of the plan
- steps: array of objects, each with: step (number), workflow (key from list above), name, reason, suggestedInputs (object), missingInputs (array of fields the user needs to provide), dependsOn (array of step numbers this depends on)
- missingInfo: array of questions to ask the user before proceeding
- estimatedTotalCost: rough total

Do not invent workflows that aren't in the list. If the goal can't be achieved with available workflows, say so in missingInfo.`;

  const userPrompt = `Workspace: ${workspaceSummary}\n\nGoal: ${goal}`;

  const result = await generateWithClaude(systemPrompt, userPrompt, 800, 'standard');

  // Parse the plan
  let plan;
  try {
    const cleaned = result.text.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    plan = JSON.parse(cleaned);
  } catch {
    const match = result.text.match(/\{[\s\S]*\}/);
    if (match) try { plan = JSON.parse(match[0]); } catch {}
  }

  return {
    executionMode,
    goal,
    profileId: profileId || null,
    plan: plan || { summary: 'Could not parse plan', steps: [], missingInfo: ['Please rephrase your goal.'] },
    raw: result.text,
    usage: result.usage,
    provider: result.provider,
    model: result.model,
    latencyMs: result.latencyMs,
  };
}
