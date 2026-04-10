const BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('brandgen-token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: getAuthHeaders(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Profiles
export const createProfile = (data) =>
  request('/profiles', { method: 'POST', body: JSON.stringify(data) });

export const getProfile = (id) => request(`/profiles/${id}`);

export const updateProfile = (id, data) =>
  request(`/profiles/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const listProfiles = () => request('/profiles');

export const deleteProfile = (id) =>
  request(`/profiles/${id}`, { method: 'DELETE' });

// Config
export const getApiStatus = () => request('/config/status');

export const setBudget = (sessionId, dailyLimit) =>
  request('/config/budget', {
    method: 'POST',
    body: JSON.stringify({ sessionId, dailyLimit }),
  });

export const getBudget = (sessionId) =>
  request(`/config/budget/${sessionId}`);

export const getEstimate = (action) =>
  request(`/config/estimate/${action}`);

export const checkAffordability = (sessionId, action) =>
  request(`/config/can-afford/${sessionId}/${action}`);

// AI Actions
export const runAiAction = (action, body) =>
  request(`/ai/${action}`, { method: 'POST', body: JSON.stringify(body) });

// Uploads
export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const res = await fetch(`${BASE}/uploads`, { method: 'POST', body: formData });
  return res.json();
};

// OAuth
export const getOAuthPlatforms = () => request('/oauth/platforms');

export const getOAuthConnections = (userId) =>
  request(`/oauth/connections/${userId}`);

export const startOAuthConnect = (platform, userId) =>
  request(`/oauth/connect/${platform}?userId=${userId}`);

export const disconnectOAuth = (platform, userId) =>
  request(`/oauth/disconnect/${platform}?userId=${userId}`, { method: 'DELETE' });

// Auth
export const register = (email, password, name) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getMe = () => request('/auth/me');

// Meta Ads
export const getMetaAdsStatus = () => request('/meta-ads/status');

export const getMetaCampaigns = () => request('/meta-ads/campaigns');

export const getMetaCampaignInsights = (id, datePreset) =>
  request(`/meta-ads/campaigns/${id}/insights?datePreset=${datePreset || 'last_30d'}`);

export const getMetaAccountInsights = (datePreset) =>
  request(`/meta-ads/account/insights?datePreset=${datePreset || 'last_30d'}`);

export const prepareMetaCampaign = (body) =>
  request('/meta-ads/prepare-campaign', { method: 'POST', body: JSON.stringify(body) });

export const getApprovalQueue = (profileId) =>
  request(`/meta-ads/queue/${profileId}`);

export const approveQueueItem = (id) =>
  request(`/meta-ads/approve/${id}`, { method: 'POST' });

export const rejectQueueItem = (id, reason) =>
  request(`/meta-ads/reject/${id}`, { method: 'POST', body: JSON.stringify({ reason }) });

export const clearApprovalQueue = (profileId) =>
  request(`/meta-ads/queue/clear/${profileId}`, { method: 'DELETE' });

// Activity Feed
export const getActivityFeed = (profileId, limit) =>
  request(`/activity/${profileId}?limit=${limit || 50}`);

export const getAllActivity = (limit) =>
  request(`/activity?limit=${limit || 100}`);

// CRM
export const getContacts = (profileId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/crm/${profileId}/contacts${q ? '?' + q : ''}`);
};
export const getContactStats = (profileId) => request(`/crm/${profileId}/contacts/stats`);
export const createContact = (profileId, data) => request(`/crm/${profileId}/contacts`, { method: 'POST', body: JSON.stringify(data) });
export const updateContact = (id, data) => request(`/crm/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteContactApi = (id) => request(`/crm/contacts/${id}`, { method: 'DELETE' });
export const getDeals = (profileId) => request(`/crm/${profileId}/deals`);
export const getDealStats = (profileId) => request(`/crm/${profileId}/deals/stats`);
export const createDeal = (profileId, data) => request(`/crm/${profileId}/deals`, { method: 'POST', body: JSON.stringify(data) });
export const updateDealApi = (id, data) => request(`/crm/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteDealApi = (id) => request(`/crm/deals/${id}`, { method: 'DELETE' });
