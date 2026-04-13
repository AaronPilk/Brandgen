// Workflow-specific context builders
// Each function returns a compact string with only the fields relevant to that workflow.
// Hard character limit per builder to prevent context bloat.

import { getBrandFacts, getCrmSummary } from './brandMemory.js';

// ─── Market Research ───
// Needs: identity, offer, ICP, competitors, business context
// Does NOT need: CRM data, generated assets, documents
export function buildResearchContext(profile) {
  const f = getBrandFacts(profile);
  const parts = [];
  if (f.brandName) parts.push(`Brand: ${f.brandName}`);
  if (f.industry) parts.push(`Industry: ${f.industry}`);
  if (f.whatYouSell) parts.push(`Sells: ${f.whatYouSell}`);
  if (f.businessType) parts.push(`Type: ${f.businessType}`);
  if (f.geoTargets) parts.push(`Geo: ${f.geoTargets}`);
  if (f.targetCustomer) parts.push(`Customer: ${f.targetCustomer}`);
  if (f.primaryGoal) parts.push(`Goal: ${f.primaryGoal}`);
  if (f.adBudget) parts.push(`Budget: ${f.adBudget}/mo`);
  if (f.differentiator) parts.push(`Differentiator: ${f.differentiator}`);
  if (f.competitorUrls) parts.push(`Competitors: ${f.competitorUrls}`);
  if (f.websiteUrl) parts.push(`Website: ${f.websiteUrl}`);
  return parts.join('. ').substring(0, 800) + '.';
}

// ─── Landing Page ───
// Needs: identity, offer, ICP, positioning, messaging, differentiator
// Does NOT need: CRM data, competitor deep-dive, all documents
export function buildLandingPageContext(profile) {
  const f = getBrandFacts(profile);
  const parts = [];
  if (f.brandName) parts.push(`Brand: ${f.brandName}`);
  if (f.industry) parts.push(`Industry: ${f.industry}`);
  if (f.primaryGoal) parts.push(`Goal: ${f.primaryGoal}`);
  if (f.geoTargets) parts.push(`Target: ${f.geoTargets}`);
  if (f.differentiator) parts.push(`Differentiator: ${f.differentiator}`);
  if (f.positioning) parts.push(`Positioning: ${f.positioning}`);
  if (f.messagingAngles) parts.push(`Messaging: ${f.messagingAngles}`);
  if (f.brandVibe) parts.push(`Vibe: ${f.brandVibe}`);
  return parts.join('. ').substring(0, 600) + '.';
}

// ─── Ad Creatives ───
// Needs: identity, offer, ICP, positioning, messaging, budget, vibe
// Does NOT need: CRM data, documents, generated assets, platform connections
export function buildAdCreativeContext(profile) {
  const f = getBrandFacts(profile);
  const parts = [];
  if (f.brandName) parts.push(`Brand: ${f.brandName}`);
  if (f.industry) parts.push(`Industry: ${f.industry}`);
  if (f.whatYouSell) parts.push(`Sells: ${f.whatYouSell}`);
  if (f.targetCustomer) parts.push(`Audience: ${f.targetCustomer}`);
  if (f.geoTargets) parts.push(`Geo: ${f.geoTargets}`);
  if (f.primaryGoal) parts.push(`Goal: ${f.primaryGoal}`);
  if (f.adBudget) parts.push(`Budget: ${f.adBudget}/mo`);
  if (f.differentiator) parts.push(`Differentiator: ${f.differentiator}`);
  if (f.brandVibe) parts.push(`Vibe: ${f.brandVibe}`);
  if (f.messagingAngles) parts.push(`Messaging: ${f.messagingAngles}`);
  return parts.join('. ').substring(0, 600) + '.';
}

// ─── Email / SMS ───
// Needs: identity, offer, ICP, sales cycle, goal, tone
// Does NOT need: competitors, documents, CRM stats, platform connections
export function buildNurtureContext(profile) {
  const f = getBrandFacts(profile);
  const parts = [];
  if (f.brandName) parts.push(`Brand: ${f.brandName}`);
  if (f.industry) parts.push(`Industry: ${f.industry}`);
  if (f.primaryGoal) parts.push(`Goal: ${f.primaryGoal}`);
  if (f.salesCycle) parts.push(`Sales cycle: ${f.salesCycle}`);
  if (f.targetCustomer) parts.push(`Customer: ${f.targetCustomer}`);
  if (f.differentiator) parts.push(`Differentiator: ${f.differentiator}`);
  if (f.formalOrCasual) parts.push(`Tone: ${f.formalOrCasual}`);
  return parts.join('. ').substring(0, 400) + '.';
}

// ─── Logo / Visual Identity ───
// Needs: identity, vibe, industry, personality
// Does NOT need: CRM, budget, competitors, research
export function buildVisualContext(profile) {
  const f = getBrandFacts(profile);
  const parts = [];
  if (f.brandName) parts.push(`Brand: ${f.brandName}`);
  if (f.industry) parts.push(`Industry: ${f.industry}`);
  if (f.brandVibe) parts.push(`Vibe: ${f.brandVibe}`);
  if (f.personalityWords) parts.push(`Personality: ${f.personalityWords}`);
  if (f.whatYouSell) parts.push(`Sells: ${f.whatYouSell}`);
  return parts.join('. ').substring(0, 300) + '.';
}

// ─── Social Media Setup ───
// Needs: identity, ICP, vibe, industry, content direction
// Does NOT need: CRM, budget details, competitor URLs
export function buildSocialContext(profile) {
  const f = getBrandFacts(profile);
  const parts = [];
  if (f.brandName) parts.push(`Brand: ${f.brandName}`);
  if (f.industry) parts.push(`Industry: ${f.industry}`);
  if (f.targetCustomer) parts.push(`Audience: ${f.targetCustomer}`);
  if (f.brandVibe) parts.push(`Vibe: ${f.brandVibe}`);
  if (f.whatYouSell) parts.push(`Sells: ${f.whatYouSell}`);
  if (f.formalOrCasual) parts.push(`Tone: ${f.formalOrCasual}`);
  return parts.join('. ').substring(0, 400) + '.';
}

// ─── Meta Campaign Prep ───
// Needs: identity, ICP, goal, budget, positioning, messaging
// Does NOT need: documents, full CRM, all assets
export function buildCampaignContext(profile) {
  const f = getBrandFacts(profile);
  const parts = [];
  if (f.brandName) parts.push(`Brand: ${f.brandName}`);
  if (f.industry) parts.push(`Industry: ${f.industry}`);
  if (f.primaryGoal) parts.push(`Goal: ${f.primaryGoal}`);
  if (f.geoTargets) parts.push(`Geo: ${f.geoTargets}`);
  if (f.adBudget) parts.push(`Budget: ${f.adBudget}/mo`);
  if (f.targetCustomer) parts.push(`Customer: ${f.targetCustomer}`);
  if (f.positioning) parts.push(`Positioning: ${f.positioning}`);
  if (f.differentiator) parts.push(`Differentiator: ${f.differentiator}`);
  return parts.join('. ').substring(0, 600) + '.';
}

// ─── CRM / Suggestions ───
// Needs: identity, CRM stats, deal pipeline, sales cycle
// Does NOT need: competitor URLs, documents, generated creatives
export function buildCrmContext(profile) {
  const f = getBrandFacts(profile);
  const crm = getCrmSummary(profile?.id);
  const parts = [];
  if (f.brandName) parts.push(`Brand: ${f.brandName}`);
  if (f.industry) parts.push(`Industry: ${f.industry}`);
  if (f.primaryGoal) parts.push(`Goal: ${f.primaryGoal}`);
  if (f.salesCycle) parts.push(`Sales cycle: ${f.salesCycle}`);
  if (crm) {
    parts.push(`Contacts: ${crm.totalContacts} (${crm.contactsByStatus.new} new, ${crm.contactsByStatus.qualified} qualified)`);
    parts.push(`Pipeline: $${crm.pipelineValue} (${crm.totalDeals} deals, $${crm.wonValue} won)`);
  }
  return parts.join('. ').substring(0, 400) + '.';
}
