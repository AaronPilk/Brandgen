// Activity Feed — immutable event log for all actions taken per profile
// Every AI action, connection, approval, and system event gets logged here

import { dbGet, dbSet, dbList } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const EVENT_TYPES = {
  // AI Actions
  RESEARCH_COMPLETE: { icon: 'search', label: 'Market Research', color: 'purple' },
  LANDING_PAGE_GENERATED: { icon: 'globe', label: 'Landing Page Generated', color: 'blue' },
  AD_CREATIVES_GENERATED: { icon: 'megaphone', label: 'Ad Creatives Generated', color: 'orange' },
  EMAIL_SEQUENCES_GENERATED: { icon: 'mail', label: 'Email Sequences Generated', color: 'green' },
  SMS_SEQUENCES_GENERATED: { icon: 'message', label: 'SMS Sequences Generated', color: 'cyan' },
  LOGO_GENERATED: { icon: 'palette', label: 'Logo Concepts Generated', color: 'pink' },
  MOCKUPS_GENERATED: { icon: 'image', label: 'Product Mockups Generated', color: 'violet' },
  SOCIAL_SETUP: { icon: 'share', label: 'Social Media Setup', color: 'blue' },
  BRAND_STRATEGY: { icon: 'target', label: 'Brand Strategy Generated', color: 'purple' },

  // Meta Ads
  META_CAMPAIGN_PREPARED: { icon: 'megaphone', label: 'Meta Campaign Prepared', color: 'blue' },
  META_CAMPAIGN_APPROVED: { icon: 'check', label: 'Meta Campaign Approved & Sent', color: 'green' },
  META_CAMPAIGN_REJECTED: { icon: 'x', label: 'Meta Campaign Rejected', color: 'red' },

  // Connections
  PLATFORM_CONNECTED: { icon: 'link', label: 'Platform Connected', color: 'green' },
  PLATFORM_DISCONNECTED: { icon: 'unlink', label: 'Platform Disconnected', color: 'red' },

  // System
  PROFILE_CREATED: { icon: 'plus', label: 'Profile Created', color: 'purple' },
  PROFILE_UPDATED: { icon: 'edit', label: 'Profile Updated', color: 'gray' },

  // Performance
  PERFORMANCE_ALERT: { icon: 'trending', label: 'Performance Alert', color: 'yellow' },
  OPTIMIZATION_SUGGESTION: { icon: 'zap', label: 'Optimization Suggestion', color: 'orange' },
};

export function logEvent(profileId, type, data = {}) {
  const event = {
    id: uuidv4(),
    profileId,
    type,
    typeConfig: EVENT_TYPES[type] || { icon: 'info', label: type, color: 'gray' },
    data,
    timestamp: Date.now(),
  };
  dbSet('activity-feed', event.id, event);
  return event;
}

export function getProfileFeed(profileId, limit = 50) {
  const events = dbList('activity-feed', (e) => e.profileId === profileId);
  return events
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function getAllFeed(limit = 100) {
  const events = dbList('activity-feed');
  return events
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export { EVENT_TYPES };
