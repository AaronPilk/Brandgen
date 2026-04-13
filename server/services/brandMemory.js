// Brand Memory — extracts normalized business facts from existing profile data
// No AI calls, no DB writes. Pure data transformation layer.
// Consumers call getBrandFacts(profile) and get a stable, queryable object.

import { getContactStats, getDealStats } from './crm.js';

// Document type classifier for uploaded files
const DOC_CATEGORIES = {
  brand: ['logo', 'brand', 'guideline', 'identity', 'style'],
  competitor: ['competitor', 'comp', 'rival', 'benchmark'],
  creative: ['ad', 'creative', 'banner', 'mockup', 'design'],
  research: ['research', 'report', 'analysis', 'data', 'survey'],
  legal: ['terms', 'privacy', 'policy', 'contract', 'agreement'],
  product: ['product', 'catalog', 'menu', 'inventory', 'sku'],
};

export function classifyDocument(filename) {
  const lower = (filename || '').toLowerCase();
  for (const [category, keywords] of Object.entries(DOC_CATEGORIES)) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return 'general';
}

// Parse research JSON safely
function parseResearch(research) {
  if (!research) return null;
  if (typeof research === 'object' && !research.research) return research;
  const raw = typeof research === 'object' ? research.research : research;
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw.replace(/```json?\s*/gi, '').replace(/```/g, '').trim());
  } catch {
    const match = (raw || '').match(/\{[\s\S]*\}/);
    if (match) try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

// Main function — returns normalized brand facts from profile
export function getBrandFacts(profile) {
  const intake = profile?.intake || {};
  const research = parseResearch(profile?.research);

  return {
    // Identity
    brandName: intake.brandName || intake.industry || null,
    industry: intake.industry || null,
    websiteUrl: intake.websiteUrl || null,
    mode: profile?.mode || null,

    // Offer
    whatYouSell: intake.whatYouSell || null,
    productCategory: intake.productCategory || null,

    // ICP (Ideal Customer Profile)
    targetCustomer: truncate(intake.targetCustomer, 150),
    targetAge: intake.targetAge || null,
    geoTargets: intake.geoTargets || intake.geoMarket || null,
    businessType: intake.businessType || null,

    // Competitors
    competitorUrls: truncate(intake.competitorUrls, 200),
    instagramUrls: truncate(intake.instagramUrls, 200),

    // Voice & Positioning
    brandVibe: intake.brandVibe || null,
    formalOrCasual: intake.formalOrCasual || null,
    personalityWords: intake.personalityWords || null,
    differentiator: truncate(intake.differentiator, 150),

    // Business context
    adBudget: intake.adBudget || null,
    monthlyRevenue: intake.monthlyRevenue || null,
    primaryGoal: intake.primaryGoal || null,
    salesCycle: intake.salesCycle || null,
    customerLTV: intake.customerLTV || null,
    currentCRM: intake.currentCRM || null,

    // Research-derived insights (extracted from parsed JSON)
    positioning: extractField(research, 'positioning', 120),
    messagingAngles: extractField(research, 'messagingAngles', 120),
    targetAudienceSummary: extractField(research, 'targetAudience', 100),
    competitorSummary: extractField(research, 'competitors', 100),
    opportunities: extractField(research, 'opportunities', 100),

    // Existing digital presence (for existing-brand mode)
    hasLogo: intake.hasLogo || null,
    hasWebsite: intake.hasWebsite || null,
    hasSocialMedia: intake.hasSocialMedia || null,
    hasCRM: intake.hasCRM || null,
    hasEmailMarketing: intake.hasEmailMarketing || null,

    // Documents — classified by type
    documents: classifyDocuments(intake.files),

    // What was already generated
    generatedAssets: Object.keys(profile?.assets || {}),
  };
}

// Get CRM summary for a profile (for workflows that need it)
export function getCrmSummary(profileId) {
  try {
    const contacts = getContactStats(profileId);
    const deals = getDealStats(profileId);
    return {
      totalContacts: contacts.total,
      contactsByStatus: { new: contacts.new, qualified: contacts.qualified, won: contacts.won },
      totalDeals: deals.total,
      pipelineValue: deals.totalValue,
      wonValue: deals.wonValue,
    };
  } catch {
    return null;
  }
}

// ─── Helpers ───

function truncate(str, maxLen) {
  if (!str) return null;
  const s = String(str);
  return s.length > maxLen ? s.substring(0, maxLen) : s;
}

function extractField(research, key, maxLen) {
  if (!research || !research[key]) return null;
  const val = research[key];
  if (typeof val === 'string') return truncate(val, maxLen);
  return truncate(JSON.stringify(val), maxLen);
}

function classifyDocuments(files) {
  if (!files || !Array.isArray(files)) return {};
  const classified = {};
  for (const file of files) {
    const cat = classifyDocument(file.originalName || file.filename || '');
    if (!classified[cat]) classified[cat] = [];
    classified[cat].push({
      name: file.originalName || file.filename,
      path: file.path,
      size: file.size,
    });
  }
  return classified;
}
