// Platform data aggregation service
// Collects KPIs from all connected platforms for a brand overview
// Each platform returns a standardized shape: { connected, kpis[], details }

import { isMetaAdsConfigured, getCampaigns, getAccountInsights } from './metaAds.js';
import { getContactStats, getDealStats } from './crm.js';
import { dbGet, dbList } from './db.js';

// Standardized KPI shape
function kpi(label, value, format = 'number', trend = null, platform = '') {
  return { label, value, format, trend, platform };
}

// ─── Meta Ads ───
async function getMetaData(profileId, datePreset) {
  if (!isMetaAdsConfigured()) return null;
  try {
    const [insights, campaigns] = await Promise.all([
      getAccountInsights(datePreset).catch(() => null),
      getCampaigns().catch(() => null),
    ]);
    const data = insights?.data?.[0];
    const campaignList = campaigns?.data || [];
    const active = campaignList.filter(c => c.status === 'ACTIVE').length;
    const paused = campaignList.filter(c => c.status === 'PAUSED').length;

    return {
      platform: 'meta_ads',
      name: 'Meta Ads',
      connected: true,
      kpis: [
        kpi('Ad Spend', parseFloat(data?.spend || 0), 'currency', null, 'Meta'),
        kpi('Impressions', parseInt(data?.impressions || 0), 'number', null, 'Meta'),
        kpi('Clicks', parseInt(data?.clicks || 0), 'number', null, 'Meta'),
        kpi('CTR', parseFloat(data?.ctr || 0), 'percent', null, 'Meta'),
        kpi('CPC', parseFloat(data?.cpc || 0), 'currency', null, 'Meta'),
        kpi('Reach', parseInt(data?.reach || 0), 'number', null, 'Meta'),
      ],
      details: {
        totalCampaigns: campaignList.length,
        activeCampaigns: active,
        pausedCampaigns: paused,
        campaigns: campaignList.slice(0, 10),
      },
    };
  } catch { return null; }
}

// ─── CRM / Contacts ───
function getCrmData(profileId) {
  try {
    const contacts = getContactStats(profileId);
    const deals = getDealStats(profileId);
    if (!contacts.total && !deals.total) return null;

    return {
      platform: 'crm',
      name: 'CRM',
      connected: true,
      kpis: [
        kpi('Total Contacts', contacts.total, 'number', null, 'CRM'),
        kpi('New Leads', contacts.new, 'number', null, 'CRM'),
        kpi('Qualified', contacts.qualified, 'number', null, 'CRM'),
        kpi('Pipeline Value', deals.totalValue, 'currency', null, 'CRM'),
        kpi('Won Revenue', deals.wonValue, 'currency', null, 'CRM'),
        kpi('Active Deals', deals.total, 'number', null, 'CRM'),
      ],
      details: {
        contactsByStatus: { new: contacts.new, contacted: contacts.contacted, qualified: contacts.qualified, proposal: contacts.proposal, won: contacts.won, lost: contacts.lost },
        dealsByStage: { lead: deals.lead, qualified: deals.qualified, proposal: deals.proposal, negotiation: deals.negotiation, won: deals.won, lost: deals.lost },
      },
    };
  } catch { return null; }
}

// ─── Instagram (via Meta API — same token) ───
async function getInstagramData(profileId) {
  if (!isMetaAdsConfigured()) return null;
  try {
    // Instagram data comes through Meta Graph API when Meta is connected
    // For now, surface it as a connected platform with placeholder KPIs
    // Real Instagram Insights API requires an Instagram Business Account ID
    return {
      platform: 'instagram',
      name: 'Instagram',
      connected: true, // Connected via Meta
      kpis: [
        kpi('Status', 'Connected via Meta', 'text', null, 'Instagram'),
      ],
      details: { note: 'Instagram data available through Meta Business Suite. Full Instagram Insights API integration coming soon.' },
      viaParent: 'meta',
    };
  } catch { return null; }
}

// ─── Connected Platforms (placeholder KPIs for future real data) ───
function getPlaceholderPlatformData(profileId) {
  const platforms = [
    { key: 'tiktok', name: 'TikTok', kpiLabels: ['Followers', 'Views', 'Engagement', 'Videos'] },
    { key: 'shopify', name: 'Shopify', kpiLabels: ['Revenue', 'Orders', 'AOV', 'Customers'] },
    { key: 'google_analytics', name: 'Google Analytics', kpiLabels: ['Sessions', 'Users', 'Bounce Rate', 'Pageviews'] },
    { key: 'email', name: 'Email Marketing', kpiLabels: ['Subscribers', 'Open Rate', 'Click Rate', 'Campaigns'] },
  ];

  return platforms.map(p => ({
    platform: p.key,
    name: p.name,
    connected: false, // Will be true when real OAuth tokens exist
    kpis: p.kpiLabels.map(label => kpi(label, 0, 'number', null, p.name)),
    placeholder: true,
  }));
}

// ─── Main aggregator ───
export async function getBrandOverview(profileId, datePreset = 'last_30d') {
  const results = [];

  // Get real data from connected platforms
  const meta = await getMetaData(profileId, datePreset);
  if (meta) results.push(meta);

  // Instagram comes through Meta when Meta is connected
  const ig = await getInstagramData(profileId);
  if (ig) results.push(ig);

  const crm = getCrmData(profileId);
  if (crm) results.push(crm);

  // Add placeholder platforms (shows what data WOULD appear when connected)
  const placeholders = getPlaceholderPlatformData(profileId);
  results.push(...placeholders);

  // Aggregate top-level summary KPIs
  const summary = {
    totalSpend: meta?.kpis?.find(k => k.label === 'Ad Spend')?.value || 0,
    totalReach: meta?.kpis?.find(k => k.label === 'Reach')?.value || 0,
    totalContacts: crm?.kpis?.find(k => k.label === 'Total Contacts')?.value || 0,
    pipelineValue: crm?.kpis?.find(k => k.label === 'Pipeline Value')?.value || 0,
    connectedPlatforms: results.filter(r => r.connected).length,
    totalPlatforms: results.length,
  };

  return { summary, platforms: results, datePreset };
}

// Date preset options
export const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7d', label: '7 days' },
  { value: 'last_14d', label: '14 days' },
  { value: 'last_30d', label: '30 days' },
  { value: 'last_90d', label: '90 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'this_year', label: 'This year' },
  { value: 'last_year', label: 'Last year' },
  { value: 'lifetime', label: 'All time' },
];
