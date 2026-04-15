import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, ChevronLeft, ChevronRight, Calendar, Clock,
  Check, X, Send, Eye, Edit3, Trash2, Instagram, Facebook,
  FileText, Image, Video, AlertCircle, Filter,
} from 'lucide-react';
import {
  getCalendarPosts, getCalendarStats, createCalendarPost, updateCalendarPost,
  deleteCalendarPost, submitPostForApproval, approveCalendarPost,
  rejectCalendarPost, publishCalendarPost, scheduleCalendarPost,
  getProfile,
} from '../services/api';
import { useStore } from '../store/useStore';

const STATUS_COLORS = {
  draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Draft' },
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
  approved: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Approved' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
  scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Scheduled' },
  published: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Published' },
};

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: () => <span className="text-[10px] font-bold">TT</span>,
  x: () => <span className="text-[10px] font-bold">X</span>,
  linkedin: () => <span className="text-[10px] font-bold">in</span>,
  pinterest: () => <span className="text-[10px] font-bold">P</span>,
  youtube: Video,
  blog: FileText,
  email: () => <span className="text-[10px] font-bold">@</span>,
};

const TYPE_ICONS = {
  social: Send, blog: FileText, email: FileText, ad: Eye,
  story: Image, reel: Video, carousel: Image, video: Video,
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function ContentCalendar() {
  const { id } = useParams();
  const { currentProfile, setCurrentProfile, user } = useStore();
  const isClient = user?.role === 'client';

  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [view, setView] = useState('calendar'); // calendar | list
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  // Calendar month nav
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const profileName = currentProfile?.intake?.brandName || currentProfile?.intake?.industry || 'Profile';

  useEffect(() => {
    if (!currentProfile || currentProfile.id !== id) {
      getProfile(id).then(setCurrentProfile).catch(() => {});
    }
    loadData();
  }, [id]);

  useEffect(() => { loadData(); }, [statusFilter]);

  const loadData = async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    const [p, s] = await Promise.all([
      getCalendarPosts(id, params).catch(() => []),
      getCalendarStats(id).catch(() => null),
    ]);
    setPosts(p);
    setStats(s);
  };

  // ─── Calendar Grid Logic ───
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getPostsForDay = (day) => {
    if (!day) return [];
    return posts.filter((p) => {
      const t = p.scheduledAt ? new Date(p.scheduledAt) : new Date(p.createdAt);
      return t.getFullYear() === calYear && t.getMonth() === calMonth && t.getDate() === day;
    });
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };
  const goToday = () => { setCalMonth(now.getMonth()); setCalYear(now.getFullYear()); };

  // ─── Actions ───
  const handleSubmit = async (postId) => {
    await submitPostForApproval(postId);
    loadData();
  };
  const handleApprove = async (postId) => {
    await approveCalendarPost(postId);
    loadData();
  };
  const handleReject = async (postId) => {
    const reason = prompt('Rejection reason (optional):');
    await rejectCalendarPost(postId, reason || '');
    loadData();
  };
  const handlePublish = async (postId) => {
    await publishCalendarPost(postId);
    loadData();
  };
  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;
    await deleteCalendarPost(postId);
    setSelectedPost(null);
    loadData();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link to={`/dashboard/${id}`} className="text-content-muted hover:text-content-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-content-primary">{profileName}</h1>
          </div>
          <p className="text-content-secondary text-sm ml-8">Content Calendar</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-surface-raised rounded-xl">
            <button onClick={() => setView('calendar')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${view === 'calendar' ? 'bg-surface-card text-content-primary shadow-sm' : 'text-content-muted'}`}>
              <Calendar className="w-3.5 h-3.5 inline mr-1" />Calendar
            </button>
            <button onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${view === 'list' ? 'bg-surface-card text-content-primary shadow-sm' : 'text-content-muted'}`}>
              <FileText className="w-3.5 h-3.5 inline mr-1" />List
            </button>
          </div>
          {!isClient && (
            <button onClick={() => { setEditingPost(null); setShowCreate(true); }}
              className="px-4 py-2 rounded-xl glossy-btn text-white text-[13px] font-semibold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Post
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-6 gap-3 mb-6">
          {['draft', 'pending', 'approved', 'scheduled', 'published', 'rejected'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`p-3 rounded-xl border transition-all text-center ${statusFilter === s ? 'border-brand-purple bg-brand-purple/10' : 'border-border-subtle bg-surface-card hover:border-border-default'}`}>
              <div className={`text-lg font-bold ${STATUS_COLORS[s].text}`}>{stats[s]}</div>
              <div className="text-[11px] text-content-muted capitalize">{s}</div>
            </button>
          ))}
        </div>
      )}

      {/* ─── CALENDAR VIEW ─── */}
      {view === 'calendar' && (
        <div className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden">
          {/* Month Nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors">
              <ChevronLeft className="w-4 h-4 text-content-muted" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-semibold text-content-primary">
                {MONTHS[calMonth]} {calYear}
              </h2>
              <button onClick={goToday} className="text-[11px] text-brand-purple hover:underline">Today</button>
            </div>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors">
              <ChevronRight className="w-4 h-4 text-content-muted" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border-subtle">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold text-content-muted uppercase">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dayPosts = getPostsForDay(day);
              const isToday = day && calYear === now.getFullYear() && calMonth === now.getMonth() && day === now.getDate();
              return (
                <div key={i}
                  className={`min-h-[100px] border-b border-r border-border-subtle p-1.5 ${!day ? 'bg-surface-bg/50' : 'hover:bg-surface-raised/50'} transition-colors`}
                  onClick={() => day && !isClient && (() => { setEditingPost(null); setShowCreate(true); })()}>
                  {day && (
                    <>
                      <div className={`text-[12px] font-medium mb-1 ${isToday ? 'w-6 h-6 rounded-full bg-brand-purple text-white flex items-center justify-center' : 'text-content-muted pl-1'}`}>
                        {day}
                      </div>
                      {dayPosts.slice(0, 3).map((p) => {
                        const sc = STATUS_COLORS[p.status];
                        return (
                          <button key={p.id} onClick={(e) => { e.stopPropagation(); setSelectedPost(p); }}
                            className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate ${sc.bg} ${sc.text} hover:opacity-80 transition-opacity`}>
                            {p.title || p.type}
                          </button>
                        );
                      })}
                      {dayPosts.length > 3 && (
                        <div className="text-[10px] text-content-muted pl-1">+{dayPosts.length - 3} more</div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── LIST VIEW ─── */}
      {view === 'list' && (
        <div className="space-y-2">
          {posts.length === 0 ? (
            <div className="bg-surface-card border border-border-subtle rounded-2xl p-12 text-center">
              <Calendar className="w-10 h-10 text-content-muted mx-auto mb-3 opacity-50" />
              <p className="text-content-muted text-sm">No posts yet. Create one or let the Social Media Agent generate your calendar.</p>
            </div>
          ) : (
            posts.map((p) => {
              const sc = STATUS_COLORS[p.status];
              const TypeIcon = TYPE_ICONS[p.type] || Send;
              return (
                <button key={p.id} onClick={() => setSelectedPost(p)}
                  className="w-full text-left bg-surface-card border border-border-subtle rounded-xl p-4 hover:border-border-default transition-all flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg ${sc.bg} flex items-center justify-center`}>
                    <TypeIcon className={`w-4 h-4 ${sc.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-content-primary truncate">{p.title || 'Untitled'}</div>
                    <div className="text-[11px] text-content-muted flex items-center gap-2 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      <span>{p.type}</span>
                      {p.platforms.map((pl) => {
                        const Icon = PLATFORM_ICONS[pl];
                        return Icon ? <span key={pl} className="opacity-60"><Icon className="w-3 h-3 inline" /></span> : null;
                      })}
                    </div>
                  </div>
                  <div className="text-[11px] text-content-muted text-right">
                    {p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString() : 'No date'}
                    {p.scheduledAt && <div className="text-[10px]">{new Date(p.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* ─── POST DETAIL PANEL ─── */}
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          isClient={isClient}
          onClose={() => setSelectedPost(null)}
          onSubmit={handleSubmit}
          onApprove={handleApprove}
          onReject={handleReject}
          onPublish={handlePublish}
          onDelete={handleDelete}
          onEdit={(p) => { setEditingPost(p); setShowCreate(true); setSelectedPost(null); }}
        />
      )}

      {/* ─── CREATE/EDIT MODAL ─── */}
      {showCreate && (
        <PostForm
          profileId={id}
          post={editingPost}
          onClose={() => { setShowCreate(false); setEditingPost(null); }}
          onSaved={() => { setShowCreate(false); setEditingPost(null); loadData(); }}
        />
      )}
    </motion.div>
  );
}

// ─── Post Detail Slide-over ───
function PostDetail({ post, isClient, onClose, onSubmit, onApprove, onReject, onPublish, onDelete, onEdit }) {
  const sc = STATUS_COLORS[post.status];
  const isAdmin = !isClient;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
        className="relative w-full max-w-md bg-surface-card border-l border-border-subtle h-full overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-6">
          <span className={`px-2.5 py-1 rounded-lg text-[12px] font-semibold ${sc.bg} ${sc.text}`}>{sc.label}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-raised">
            <X className="w-4 h-4 text-content-muted" />
          </button>
        </div>

        <h2 className="text-lg font-bold text-content-primary mb-2">{post.title || 'Untitled'}</h2>

        {post.platforms.length > 0 && (
          <div className="flex gap-1.5 mb-4">
            {post.platforms.map((pl) => (
              <span key={pl} className="px-2 py-0.5 rounded-full bg-surface-raised text-[11px] text-content-secondary capitalize">{pl}</span>
            ))}
          </div>
        )}

        <div className="text-[13px] text-content-secondary mb-4 whitespace-pre-wrap">{post.content || post.caption || 'No content'}</div>

        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.hashtags.map((h, i) => (
              <span key={i} className="text-[11px] text-brand-purple">#{h}</span>
            ))}
          </div>
        )}

        {post.scheduledAt && (
          <div className="flex items-center gap-2 text-[12px] text-content-muted mb-4">
            <Clock className="w-3.5 h-3.5" />
            {new Date(post.scheduledAt).toLocaleString()}
          </div>
        )}

        {post.rejectionReason && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
            <div className="text-[11px] text-red-400 font-semibold mb-1">Rejection Reason</div>
            <div className="text-[12px] text-red-300">{post.rejectionReason}</div>
          </div>
        )}

        {post.notes && (
          <div className="text-[12px] text-content-muted mb-4">
            <span className="font-semibold">Notes:</span> {post.notes}
          </div>
        )}

        <div className="text-[11px] text-content-muted mb-6">
          Created {new Date(post.createdAt).toLocaleDateString()}
          {post.aiGenerated && <span className="ml-2 px-1.5 py-0.5 rounded bg-brand-purple/20 text-brand-purple text-[10px]">AI Generated</span>}
        </div>

        {/* Action buttons based on status */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
            {post.status === 'draft' && (
              <>
                <ActionBtn icon={Send} label="Submit" color="purple" onClick={() => onSubmit(post.id)} />
                <ActionBtn icon={Edit3} label="Edit" color="gray" onClick={() => onEdit(post)} />
              </>
            )}
            {post.status === 'pending' && (
              <>
                <ActionBtn icon={Check} label="Approve" color="green" onClick={() => onApprove(post.id)} />
                <ActionBtn icon={X} label="Reject" color="red" onClick={() => onReject(post.id)} />
              </>
            )}
            {(post.status === 'approved' || post.status === 'scheduled') && (
              <ActionBtn icon={Eye} label="Mark Published" color="green" onClick={() => onPublish(post.id)} />
            )}
            {post.status === 'rejected' && (
              <ActionBtn icon={Edit3} label="Edit & Resubmit" color="purple" onClick={() => onEdit(post)} />
            )}
            <ActionBtn icon={Trash2} label="Delete" color="red" onClick={() => onDelete(post.id)} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color, onClick }) {
  const colors = {
    purple: 'bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30',
    green: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
    red: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
    gray: 'bg-surface-raised text-content-muted hover:text-content-primary',
  };
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-colors ${colors[color]}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

// ─── Create/Edit Form Modal ───
function PostForm({ profileId, post, onClose, onSaved }) {
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [type, setType] = useState(post?.type || 'social');
  const [platforms, setPlatforms] = useState(post?.platforms || []);
  const [scheduledAt, setScheduledAt] = useState(post?.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '');
  const [hashtags, setHashtags] = useState(post?.hashtags?.join(', ') || '');
  const [notes, setNotes] = useState(post?.notes || '');
  const [saving, setSaving] = useState(false);

  const togglePlatform = (p) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      title,
      content,
      type,
      platforms,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      hashtags: hashtags.split(',').map((h) => h.trim().replace(/^#/, '')).filter(Boolean),
      notes,
    };
    try {
      if (post) {
        await updateCalendarPost(post.id, data);
      } else {
        await createCalendarPost(profileId, data);
      }
      onSaved();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const PLATFORMS_LIST = ['instagram', 'facebook', 'tiktok', 'x', 'linkedin', 'pinterest', 'youtube', 'blog', 'email'];
  const TYPES = ['social', 'blog', 'email', 'ad', 'story', 'reel', 'carousel', 'video'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-surface-card border border-border-subtle rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-content-primary">{post ? 'Edit Post' : 'New Post'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-raised">
            <X className="w-4 h-4 text-content-muted" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-content-secondary mb-1 block">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-content-primary text-[13px] focus:outline-none focus:border-brand-purple"
              placeholder="Post title" />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-content-secondary mb-1 block">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4}
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-content-primary text-[13px] focus:outline-none focus:border-brand-purple resize-none"
              placeholder="Post content or caption..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-semibold text-content-secondary mb-1 block">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-content-primary text-[13px] focus:outline-none focus:border-brand-purple">
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-content-secondary mb-1 block">Schedule</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-content-primary text-[13px] focus:outline-none focus:border-brand-purple" />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-content-secondary mb-1.5 block">Platforms</label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS_LIST.map((p) => (
                <button key={p} onClick={() => togglePlatform(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${
                    platforms.includes(p) ? 'bg-brand-purple text-white' : 'bg-surface-raised text-content-muted hover:text-content-secondary'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-content-secondary mb-1 block">Hashtags</label>
            <input value={hashtags} onChange={(e) => setHashtags(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-content-primary text-[13px] focus:outline-none focus:border-brand-purple"
              placeholder="hashtag1, hashtag2, hashtag3" />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-content-secondary mb-1 block">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-content-primary text-[13px] focus:outline-none focus:border-brand-purple"
              placeholder="Internal notes (not published)" />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-raised text-content-secondary text-[13px] font-semibold hover:text-content-primary transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl glossy-btn text-white text-[13px] font-semibold disabled:opacity-50">
            {saving ? 'Saving...' : post ? 'Update' : 'Create Draft'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
