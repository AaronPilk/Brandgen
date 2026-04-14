// Meta Ads service — reads campaigns, prepares new ones for approval, pushes approved ones
// Uses Meta Marketing API v19.0 with a System User Token

const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function getToken() {
  return process.env.META_SYSTEM_USER_TOKEN || null;
}

function getAdAccountId(override) {
  return override || process.env.META_AD_ACCOUNT_ID || null;
}

export function isMetaAdsConfigured(adAccountId) {
  return !!(getToken() && getAdAccountId(adAccountId));
}

async function metaFetch(endpoint, options = {}) {
  const token = getToken();
  if (!token) throw new Error('META_SYSTEM_USER_TOKEN not configured');

  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${endpoint}${separator}access_token=${token}`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`Meta API Error: ${data.error.message} (code ${data.error.code})`);
  }
  return data;
}

// ─── READ Operations ───

export async function getCampaigns(fields = 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time', adAccountId = null) {
  const accountId = getAdAccountId(adAccountId);
  return metaFetch(`/act_${accountId}/campaigns?fields=${fields}&limit=50`);
}

export async function getAdSets(campaignId, fields = 'id,name,status,daily_budget,targeting,optimization_goal,billing_event') {
  return metaFetch(`/${campaignId}/adsets?fields=${fields}&limit=50`);
}

export async function getAds(adSetId, fields = 'id,name,status,creative') {
  return metaFetch(`/${adSetId}/ads?fields=${fields}&limit=50`);
}

export async function getCampaignInsights(campaignId, datePreset = 'last_30d') {
  const fields = 'impressions,clicks,spend,cpc,cpm,ctr,reach,actions,cost_per_action_type';
  return metaFetch(`/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}`);
}

// Get ads with creative previews for a campaign
export async function getCampaignAds(campaignId) {
  const fields = 'id,name,status,creative{id,name,thumbnail_url,image_url,object_story_spec,effective_object_story_id},insights.date_preset(last_30d){impressions,clicks,spend,ctr,cpc}';
  const result = await metaFetch(`/${campaignId}/ads?fields=${fields}&limit=20`);

  // For each ad, try to get full-size ad preview
  if (result.data) {
    for (const ad of result.data) {
      if (ad.creative?.id) {
        try {
          const preview = await metaFetch(`/${ad.creative.id}?fields=thumbnail_url,image_url,object_story_spec`);
          if (preview.image_url) ad.creative.image_url = preview.image_url;
        } catch {}
      }
    }
  }
  return result;
}

// Get all ad creatives for the account
export async function getAdCreatives(limit = 20) {
  const accountId = getAdAccountId();
  const fields = 'id,name,thumbnail_url,object_story_spec,status';
  return metaFetch(`/act_${accountId}/adcreatives?fields=${fields}&limit=${limit}`);
}

export async function getAccountInsights(datePreset = 'last_30d', adAccountId = null) {
  const accountId = getAdAccountId(adAccountId);
  const fields = 'impressions,clicks,spend,cpc,cpm,ctr,reach,actions,cost_per_action_type';
  return metaFetch(`/act_${accountId}/insights?fields=${fields}&date_preset=${datePreset}`);
}

// ─── PREPARE Operations (for approval queue — does NOT call Meta API) ───

export function prepareCampaign({ name, objective, dailyBudget, status = 'PAUSED' }) {
  const accountId = getAdAccountId();
  return {
    type: 'create_campaign',
    endpoint: `/act_${accountId}/campaigns`,
    method: 'POST',
    payload: {
      name,
      objective, // e.g. OUTCOME_LEADS, OUTCOME_TRAFFIC, OUTCOME_AWARENESS, OUTCOME_SALES
      special_ad_categories: [],
      status, // always PAUSED until user explicitly activates
      daily_budget: Math.round(dailyBudget * 100), // Meta expects cents
    },
    humanSummary: {
      action: 'Create Campaign',
      name,
      objective,
      dailyBudget: `$${dailyBudget}/day`,
      status: 'PAUSED (will not spend until you activate)',
    },
  };
}

export function prepareAdSet({
  campaignId,
  name,
  dailyBudget,
  targeting,
  optimizationGoal = 'LEAD_GENERATION',
  billingEvent = 'IMPRESSIONS',
  startTime,
  status = 'PAUSED',
}) {
  return {
    type: 'create_adset',
    endpoint: campaignId ? `/${campaignId}/adsets` : `/act_${getAdAccountId()}/adsets`,
    method: 'POST',
    payload: {
      name,
      daily_budget: Math.round(dailyBudget * 100),
      billing_event: billingEvent,
      optimization_goal: optimizationGoal,
      targeting: targeting || {
        geo_locations: { countries: ['US'] },
        age_min: 25,
        age_max: 55,
      },
      status,
      ...(startTime && { start_time: startTime }),
      ...(campaignId && { campaign_id: campaignId }),
    },
    humanSummary: {
      action: 'Create Ad Set',
      name,
      dailyBudget: `$${dailyBudget}/day`,
      optimizationGoal,
      targeting: targeting
        ? `Custom targeting: ${JSON.stringify(targeting).substring(0, 100)}...`
        : 'US, ages 25-55',
      status: 'PAUSED',
    },
  };
}

export function prepareAdCreative({
  name,
  pageId,
  headline,
  body,
  description,
  callToAction = 'LEARN_MORE',
  imageUrl,
  linkUrl,
}) {
  const accountId = getAdAccountId();
  return {
    type: 'create_ad_creative',
    endpoint: `/act_${accountId}/adcreatives`,
    method: 'POST',
    payload: {
      name,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          message: body,
          link: linkUrl,
          name: headline,
          description,
          call_to_action: { type: callToAction },
          ...(imageUrl && { picture: imageUrl }),
        },
      },
    },
    humanSummary: {
      action: 'Create Ad Creative',
      name,
      headline,
      body: body?.substring(0, 120) + (body?.length > 120 ? '...' : ''),
      callToAction,
      linkUrl,
      hasImage: !!imageUrl,
    },
  };
}

// ─── EXECUTE Operations (only called after approval) ───

export async function executeApprovedAction(pendingAction) {
  const { endpoint, method, payload } = pendingAction;

  const options = {
    method,
    body: JSON.stringify(payload),
  };

  const result = await metaFetch(endpoint, options);
  return {
    success: true,
    metaResponse: result,
    action: pendingAction.type,
    summary: pendingAction.humanSummary,
    executedAt: Date.now(),
  };
}
