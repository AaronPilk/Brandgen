import { Router } from 'express';
import { validateToken } from '../services/auth.js';
import {
  createPost, updatePost, deletePost, getPost, listPosts,
  submitForApproval, approvePost, rejectPost, markPublished,
  schedulePost, getCalendarStats, getUpcomingPosts, getPendingApproval,
  VALID_STATUSES, POST_TYPES, PLATFORMS,
} from '../services/contentCalendar.js';
import { logEvent } from '../services/activityFeed.js';

const router = Router();

// Auth middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = validateToken(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = user;
  next();
}

router.use(requireAuth);

// ─── CRUD ───

// List posts for a profile (with optional filters)
router.get('/:profileId/posts', (req, res) => {
  const posts = listPosts(req.params.profileId, {
    status: req.query.status,
    type: req.query.type,
    platform: req.query.platform,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  });
  res.json(posts);
});

// Get calendar stats
router.get('/:profileId/stats', (req, res) => {
  res.json(getCalendarStats(req.params.profileId));
});

// Get upcoming posts
router.get('/:profileId/upcoming', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  res.json(getUpcomingPosts(req.params.profileId, days));
});

// Get posts pending approval
router.get('/:profileId/pending', (req, res) => {
  res.json(getPendingApproval(req.params.profileId));
});

// Get single post
router.get('/posts/:id', (req, res) => {
  const post = getPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// Create a post
router.post('/:profileId/posts', (req, res) => {
  const post = createPost(req.params.profileId, {
    ...req.body,
    createdBy: req.user.id,
  });
  logEvent(req.params.profileId, 'CONTENT_CREATED', {
    postId: post.id,
    title: post.title,
    type: post.type,
    platforms: post.platforms,
  });
  res.json(post);
});

// Update a post
router.patch('/posts/:id', (req, res) => {
  const post = updatePost(req.params.id, req.body);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// Delete a post
router.delete('/posts/:id', (req, res) => {
  const post = getPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  deletePost(req.params.id);
  res.json({ success: true });
});

// ─── Status Transitions ───

// Submit for approval
router.post('/posts/:id/submit', (req, res) => {
  try {
    const post = submitForApproval(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    logEvent(post.profileId, 'CONTENT_SUBMITTED', {
      postId: post.id,
      title: post.title,
    });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve
router.post('/posts/:id/approve', (req, res) => {
  try {
    const post = approvePost(req.params.id, req.user.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    logEvent(post.profileId, 'CONTENT_APPROVED', {
      postId: post.id,
      title: post.title,
      approvedBy: req.user.id,
    });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reject
router.post('/posts/:id/reject', (req, res) => {
  try {
    const post = rejectPost(req.params.id, req.user.id, req.body.reason);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    logEvent(post.profileId, 'CONTENT_REJECTED', {
      postId: post.id,
      title: post.title,
      reason: req.body.reason,
    });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark as published
router.post('/posts/:id/publish', (req, res) => {
  try {
    const post = markPublished(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    logEvent(post.profileId, 'CONTENT_PUBLISHED', {
      postId: post.id,
      title: post.title,
      platforms: post.platforms,
    });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Schedule a post
router.post('/posts/:id/schedule', (req, res) => {
  try {
    if (!req.body.scheduledAt) return res.status(400).json({ error: 'scheduledAt required' });
    const post = schedulePost(req.params.id, req.body.scheduledAt);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    logEvent(post.profileId, 'CONTENT_SCHEDULED', {
      postId: post.id,
      title: post.title,
      scheduledAt: req.body.scheduledAt,
    });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Meta ───

router.get('/meta', (req, res) => {
  res.json({
    statuses: VALID_STATUSES,
    postTypes: POST_TYPES,
    platforms: PLATFORMS,
  });
});

export { router as contentCalendarRoutes };
