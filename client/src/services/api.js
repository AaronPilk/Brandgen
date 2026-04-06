const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
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
