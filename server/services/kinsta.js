// Kinsta API service — manage sites, deploy landing pages, manage domains
// Docs: https://kinsta.com/docs/kinsta-api/

const BASE_URL = 'https://api.kinsta.com/v2';

function getApiKey() {
  return process.env.KINSTA_API_KEY || null;
}

function getCompanyId() {
  return process.env.KINSTA_COMPANY_ID || null;
}

export function isKinstaConfigured() {
  return !!(getApiKey() && getCompanyId());
}

async function kinstaFetch(endpoint, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('KINSTA_API_KEY not configured');

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Kinsta API Error: ${data.message || res.statusText}`);
  }
  return data;
}

// List all sites in the company
export async function listSites() {
  const companyId = getCompanyId();
  return kinstaFetch(`/sites?company=${companyId}`);
}

// Get site details
export async function getSite(siteId) {
  return kinstaFetch(`/sites/${siteId}`);
}

// Get site environments
export async function getSiteEnvironments(siteId) {
  return kinstaFetch(`/sites/${siteId}/environments`);
}

// Trigger a deployment
export async function triggerDeployment(environmentId) {
  return kinstaFetch(`/sites/environments/${environmentId}/manual-deploy`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// Clear site cache
export async function clearCache(environmentId) {
  return kinstaFetch(`/sites/environments/${environmentId}/clear-cache`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// List domains for an environment
export async function listDomains(environmentId) {
  return kinstaFetch(`/sites/environments/${environmentId}/domains`);
}
