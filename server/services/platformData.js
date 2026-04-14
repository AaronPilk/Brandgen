// Platform data aggregation service
// Collects KPIs from all connected platforms for a brand overview
// Each platform returns a standardized shape: { connected, kpis[], details }

import { isMetaAdsConfigured, getCampaigns, getAccountInsights } from './metaAds.js';
import { getContactStats, getDealStats } from './crm.js';
import { dbGet, dbList, dbSet } from './db.js';

// ─── Simple cache to reduce API calls ───
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// ─── Per-profile connection settings ───
// Each profile stores its own account IDs for each platform
export function getProfileConnections(profileId) {
  const profile = dbGet('profiles', profileId);
  return profile?.connections || {};
}

export function setProfileConnection(profileId, platform, settings) {
  const profile = dbGet('profiles', profileId);
  if (!profile) return null;
  if (!profile.connections) profile.connections = {};
  profile.connections[platform] = { ...profile.connections[platform], ...settings, updatedAt: Date.now() };
  dbSet('profiles', profileId, profile);
  return profile.connections[platform];
}

// Standardized KPI shape
function kpi(label, value, format = 'number', trend = null, platform = '') {
  return { label, value, format, trend, platform };
}

// ─── Meta Ads ───
async function getMetaData(profileId, datePreset) {
  const conns = getProfileConnections(profileId);
  const adAccountId = conns?.meta_ads?.adAccountId || null;

  // Only show data if this profile has its own ad account configured, OR if there's a global fallback
  if (!isMetaAdsConfigured(adAccountId)) return null;

  // Cache per profile + date
  const cacheKey = `meta:${profileId}:${adAccountId || 'global'}:${datePreset}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const [insights, campaigns] = await Promise.all([
      getAccountInsights(datePreset, adAccountId).catch(() => null),
      getCampaigns(undefined, adAccountId).catch(() => null),
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
        adAccountId: adAccountId || process.env.META_AD_ACCOUNT_ID,
      },
    };
    setCache(cacheKey, result);
    return result;
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

// ─── Instagram (full data via Meta Graph API) ───
async function getInstagramData(profileId) {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) return null;

  const conns = getProfileConnections(profileId);
  const savedIgId = conns?.instagram?.accountId;

  // Cache per profile
  const cacheKey = `ig:${profileId}:${savedIgId || 'auto'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    let igId = savedIgId;
    let ig = null;

    if (igId) {
      // Use saved Instagram account ID directly — skip page discovery (saves API call)
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${igId}?fields=id,name,username,followers_count,media_count,profile_picture_url,biography&access_token=${token}`);
      ig = await igRes.json();
      if (ig.error) ig = null;
    }

    if (!ig) {
      // Discover from pages (first time only)
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id,name,username,followers_count,media_count,profile_picture_url,biography}&access_token=${token}`);
      const pagesData = await pagesRes.json();
      if (pagesData.error || !pagesData.data) return null;

      const pageWithIG = pagesData.data?.find(p => p.instagram_business_account);
      if (!pageWithIG) return null;
      ig = pageWithIG.instagram_business_account;
      igId = ig.id;

      // Save for next time — avoids re-discovery API call
      setProfileConnection(profileId, 'instagram', { accountId: igId, username: ig.username });
    }

    if (!ig || !igId) return null;

    // 2. Get account-level insights (28 days)
    const since = Math.floor(Date.now() / 1000) - 86400 * 28;
    const until = Math.floor(Date.now() / 1000);
    let reach = 0, impressions = 0, profileViews = 0, websiteClicks = 0;
    const timeline = [];

    try {
      const metricsRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/insights?metric=reach,impressions,profile_views,website_clicks&period=day&since=${since}&until=${until}&access_token=${token}`);
      const metricsData = await metricsRes.json();
      if (metricsData.data) {
        for (const metric of metricsData.data) {
          const total = metric.values?.reduce((s, v) => s + (v.value || 0), 0) || 0;
          if (metric.name === 'reach') reach = total;
          if (metric.name === 'impressions') impressions = total;
          if (metric.name === 'profile_views') profileViews = total;
          if (metric.name === 'website_clicks') websiteClicks = total;

          // Build timeline from reach data
          if (metric.name === 'reach' && metric.values) {
            metric.values.forEach(v => {
              timeline.push({ date: v.end_time?.split('T')[0], reach: v.value || 0 });
            });
          }
        }
        // Merge impressions into timeline
        const impMetric = metricsData.data.find(m => m.name === 'impressions');
        if (impMetric?.values) {
          impMetric.values.forEach((v, i) => {
            if (timeline[i]) timeline[i].impressions = v.value || 0;
          });
        }
      }
    } catch {}

    // 3. Get top-performing recent media
    const topPosts = [];
    try {
      const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink&limit=25&access_token=${token}`);
      const mediaData = await mediaRes.json();
      if (mediaData.data) {
        // Sort by engagement (likes + comments)
        const sorted = mediaData.data
          .map(m => ({ ...m, engagement: (m.like_count || 0) + (m.comments_count || 0) }))
          .sort((a, b) => b.engagement - a.engagement);

        for (const post of sorted.slice(0, 6)) {
          topPosts.push({
            id: post.id,
            type: post.media_type,
            caption: post.caption?.substring(0, 100) || '',
            image: post.media_url || post.thumbnail_url,
            likes: post.like_count || 0,
            comments: post.comments_count || 0,
            engagement: post.engagement,
            date: post.timestamp,
            permalink: post.permalink,
          });
        }
      }
    } catch {}

    // 4. Calculate engagement rate
    const totalEngagement = topPosts.reduce((s, p) => s + p.engagement, 0);
    const engagementRate = ig.followers_count > 0 && topPosts.length > 0
      ? ((totalEngagement / topPosts.length) / ig.followers_count) * 100
      : 0;

    return {
      platform: 'instagram',
      name: 'Instagram',
      connected: true,
      kpis: [
        kpi('Followers', ig.followers_count || 0, 'number', null, 'Instagram'),
        kpi('Posts', ig.media_count || 0, 'number', null, 'Instagram'),
        kpi('Reach (28d)', reach, 'number', null, 'Instagram'),
        kpi('Impressions (28d)', impressions, 'number', null, 'Instagram'),
        kpi('Profile Views', profileViews, 'number', null, 'Instagram'),
        kpi('Engagement Rate', engagementRate, 'percent', null, 'Instagram'),
      ],
      details: {
        username: ig.username,
        name: ig.name,
        bio: ig.biography,
        profilePicture: ig.profile_picture_url,
        accountId: igId,
        websiteClicks,
        topPosts,
        timeline,
      },
    };
    setCache(cacheKey, result);
    return result;
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
