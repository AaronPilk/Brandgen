// Content Calendar — per-profile post scheduling, approval workflow, and calendar management
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbSet, dbList, dbDelete } from './db.js';

// ─── Post Statuses ───
// draft → pending → approved → scheduled → published
// draft → pending → rejected (can be re-edited back to draft)
const VALID_STATUSES = ['draft', 'pending', 'approved', 'rejected', 'scheduled', 'published'];

const POST_TYPES = ['social', 'blog', 'email', 'ad', 'story', 'reel', 'carousel', 'video'];

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'x', 'linkedin', 'pinterest', 'youtube', 'blog', 'email'];

// ─── Posts CRUD ───

export function createPost(profileId, data) {
  const id = uuidv4();
  const post = {
    id,
    profileId,
    title: data.title || '',
    content: data.content || '',
    type: POST_TYPES.includes(data.type) ? data.type : 'social',
    platforms: Array.isArray(data.platforms) ? data.platforms.filter(p => PLATFORMS.includes(p)) : [],
    status: 'draft',
    scheduledAt: data.scheduledAt || null, // ISO timestamp or epoch
    publishedAt: null,
    mediaUrls: data.mediaUrls || [],
    hashtags: data.hashtags || [],
    caption: data.caption || '',
    notes: data.notes || '',
    aiGenerated: data.aiGenerated || false,
    createdBy: data.createdBy || null, // userId
    approvedBy: null,
    rejectedBy: null,
    rejectionReason: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  dbSet('calendar-posts', id, post);
  return post;
}

export function updatePost(id, data) {
  const post = dbGet('calendar-posts', id);
  if (!post) return null;

  // Don't allow direct status changes through update — use dedicated status methods
  const { status, ...safeData } = data;
  const updated = { ...post, ...safeData, updatedAt: Date.now() };
  dbSet('calendar-posts', id, updated);
  return updated;
}

export function deletePost(id) {
  dbDelete('calendar-posts', id);
}

export function getPost(id) {
  return dbGet('calendar-posts', id);
}

// ─── Listing & Filtering ───

export function listPosts(profileId, filters = {}) {
  let posts = dbList('calendar-posts', (p) => p.profileId === profileId);

  if (filters.status) posts = posts.filter((p) => p.status === filters.status);
  if (filters.type) posts = posts.filter((p) => p.type === filters.type);
  if (filters.platform) posts = posts.filter((p) => p.platforms.includes(filters.platform));

  // Date range filter for calendar views
  if (filters.startDate) {
    const start = new Date(filters.startDate).getTime();
    posts = posts.filter((p) => {
      const t = p.scheduledAt ? new Date(p.scheduledAt).getTime() : p.createdAt;
      return t >= start;
    });
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate).getTime();
    posts = posts.filter((p) => {
      const t = p.scheduledAt ? new Date(p.scheduledAt).getTime() : p.createdAt;
      return t <= end;
    });
  }

  return posts.sort((a, b) => {
    // Sort by scheduled date first, then created date
    const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : a.createdAt;
    const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : b.createdAt;
    return aTime - bTime;
  });
}

// ─── Status Transitions ───

export function submitForApproval(id) {
  const post = dbGet('calendar-posts', id);
  if (!post) return null;
  if (post.status !== 'draft' && post.status !== 'rejected') {
    throw new Error(`Cannot submit post with status "${post.status}" for approval`);
  }
  const updated = { ...post, status: 'pending', rejectionReason: '', rejectedBy: null, updatedAt: Date.now() };
  dbSet('calendar-posts', id, updated);
  return updated;
}

export function approvePost(id, userId) {
  const post = dbGet('calendar-posts', id);
  if (!post) return null;
  if (post.status !== 'pending') {
    throw new Error(`Cannot approve post with status "${post.status}"`);
  }
  const updated = {
    ...post,
    status: post.scheduledAt ? 'scheduled' : 'approved',
    approvedBy: userId,
    updatedAt: Date.now(),
  };
  dbSet('calendar-posts', id, updated);
  return updated;
}

export function rejectPost(id, userId, reason) {
  const post = dbGet('calendar-posts', id);
  if (!post) return null;
  if (post.status !== 'pending') {
    throw new Error(`Cannot reject post with status "${post.status}"`);
  }
  const updated = {
    ...post,
    status: 'rejected',
    rejectedBy: userId,
    rejectionReason: reason || '',
    updatedAt: Date.now(),
  };
  dbSet('calendar-posts', id, updated);
  return updated;
}

export function markPublished(id) {
  const post = dbGet('calendar-posts', id);
  if (!post) return null;
  if (post.status !== 'approved' && post.status !== 'scheduled') {
    throw new Error(`Cannot publish post with status "${post.status}"`);
  }
  const updated = { ...post, status: 'published', publishedAt: Date.now(), updatedAt: Date.now() };
  dbSet('calendar-posts', id, updated);
  return updated;
}

// ─── Schedule Management ───

export function schedulePost(id, scheduledAt) {
  const post = dbGet('calendar-posts', id);
  if (!post) return null;
  if (post.status === 'published') {
    throw new Error('Cannot reschedule a published post');
  }
  const newStatus = post.status === 'approved' ? 'scheduled' : post.status;
  const updated = { ...post, scheduledAt, status: newStatus, updatedAt: Date.now() };
  dbSet('calendar-posts', id, updated);
  return updated;
}

// ─── Calendar Stats ───

export function getCalendarStats(profileId) {
  const posts = dbList('calendar-posts', (p) => p.profileId === profileId);
  const stats = {
    total: posts.length,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    scheduled: 0,
    published: 0,
    byType: {},
    byPlatform: {},
    thisWeek: 0,
    thisMonth: 0,
  };

  const now = Date.now();
  const weekStart = now - (7 * 24 * 60 * 60 * 1000);
  const monthStart = now - (30 * 24 * 60 * 60 * 1000);

  posts.forEach((p) => {
    if (stats[p.status] !== undefined) stats[p.status]++;

    // By type
    stats.byType[p.type] = (stats.byType[p.type] || 0) + 1;

    // By platform
    p.platforms.forEach((plat) => {
      stats.byPlatform[plat] = (stats.byPlatform[plat] || 0) + 1;
    });

    // Time-based
    const postTime = p.scheduledAt ? new Date(p.scheduledAt).getTime() : p.createdAt;
    if (postTime >= weekStart && postTime <= now + (7 * 24 * 60 * 60 * 1000)) stats.thisWeek++;
    if (postTime >= monthStart && postTime <= now + (30 * 24 * 60 * 60 * 1000)) stats.thisMonth++;
  });

  return stats;
}

// ─── Bulk Operations ───

export function getUpcomingPosts(profileId, days = 7) {
  const now = Date.now();
  const end = now + (days * 24 * 60 * 60 * 1000);
  return listPosts(profileId, {
    startDate: new Date(now).toISOString(),
    endDate: new Date(end).toISOString(),
  }).filter((p) => p.status === 'scheduled' || p.status === 'approved');
}

export function getPendingApproval(profileId) {
  return dbList('calendar-posts', (p) => p.profileId === profileId && p.status === 'pending')
    .sort((a, b) => a.createdAt - b.createdAt);
}

export { VALID_STATUSES, POST_TYPES, PLATFORMS };
