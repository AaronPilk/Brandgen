import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  DollarSign, Eye, MousePointer, TrendingUp, Users, Target,
  ShoppingBag, BarChart3, Mail, Globe, Instagram, ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { getBrandOverview } from '../services/api';

const PLATFORM_ICONS = {
  meta_ads: Megaphone, crm: Users, instagram: Instagram, tiktok: Globe,
  shopify: ShoppingBag, google_analytics: BarChart3, email: Mail,
};

import { Megaphone } from 'lucide-react';

const DATE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7d', label: '7d' },
  { value: 'last_14d', label: '14d' },
  { value: 'last_30d', label: '30d' },
  { value: 'last_90d', label: '90d' },
  { value: 'this_month', label: 'Month' },
  { value: 'this_quarter', label: 'Quarter' },
  { value: 'this_year', label: 'Year' },
  { value: 'lifetime', label: 'All time' },
];

function formatValue(value, format) {
  if (value === null || value === undefined) return '—';
  if (format === 'currency') return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (format === 'percent') return `${Number(value).toFixed(2)}%`;
  const n = Number(value);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function BrandOverview({ profileId }) {
  const [data, setData] = useState(null);
  const [datePreset, setDatePreset] = useState('last_30d');
  const [loading, setLoading] = useState(true);
  const [expandedPlatform, setExpandedPlatform] = useState(null);

  useEffect(() => {
    setLoading(true);
    getBrandOverview(profileId, datePreset)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profileId, datePreset]);

  if (loading && !data) {
    return (
      <div className="glossy rounded-2xl p-6 mb-4">
        <div className="relative z-10 text-center text-content-muted text-sm py-4">Loading overview...</div>
      </div>
    );
  }

  if (!data) return null;

  const connectedPlatforms = data.platforms.filter(p => p.connected);
  const placeholderPlatforms = data.platforms.filter(p => !p.connected);

  return (
    <div className="mb-5">
      {/* Header with date selector */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-semibold text-content-primary flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-purple" />
          Performance Overview
          <span className="text-[11px] font-normal text-content-muted">
            {data.summary.connectedPlatforms} platform{data.summary.connectedPlatforms !== 1 ? 's' : ''} reporting
          </span>
        </h2>
        <div className="flex gap-0.5 p-0.5 bg-surface-raised rounded-lg">
          {DATE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setDatePreset(opt.value)}
              className={`px-2 py-1 rounded-md text-[9px] font-semibold transition-all ${
                datePreset === opt.value ? 'bg-brand-purple text-white' : 'text-content-muted hover:text-content-secondary'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs — top level across all platforms */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <SummaryCard label="Total Ad Spend" value={data.summary.totalSpend} format="currency" />
        <SummaryCard label="Total Reach" value={data.summary.totalReach} format="number" />
        <SummaryCard label="Total Contacts" value={data.summary.totalContacts} format="number" />
        <SummaryCard label="Pipeline Value" value={data.summary.pipelineValue} format="currency" />
      </div>

      {/* Per-platform KPI cards */}
      {connectedPlatforms.length > 0 && (
        <div className="space-y-2">
          {connectedPlatforms.map(platform => (
            <PlatformRow key={platform.platform} platform={platform}
              expanded={expandedPlatform === platform.platform}
              onToggle={() => setExpandedPlatform(expandedPlatform === platform.platform ? null : platform.platform)} />
          ))}
        </div>
      )}

      {/* Placeholder platforms — show what WOULD appear */}
      {placeholderPlatforms.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] text-content-muted mb-1.5">Connect to see data:</p>
          <div className="flex flex-wrap gap-1.5">
            {placeholderPlatforms.map(p => (
              <span key={p.platform} className="text-[10px] px-2 py-1 rounded-lg bg-surface-raised text-content-muted">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, format }) {
  return (
    <div className="glossy rounded-xl p-3">
      <div className="relative z-10">
        <p className="text-[9px] text-content-muted uppercase tracking-wider mb-1">{label}</p>
        <p className="text-lg font-bold text-content-primary">{formatValue(value, format)}</p>
      </div>
    </div>
  );
}

function PlatformRow({ platform, expanded, onToggle }) {
  const topKpis = platform.kpis.slice(0, 6);

  return (
    <div className="glossy rounded-xl overflow-hidden">
      <div className="relative z-10">
        <button onClick={onToggle} className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-surface-raised/30 transition-colors">
          <div className="w-6 h-6 rounded-md bg-brand-purple/10 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-brand-purple">{platform.name[0]}</span>
          </div>
          <p className="text-[12px] font-semibold text-content-primary w-24 text-left truncate">{platform.name}</p>
          <div className="flex-1 grid grid-cols-6 gap-2">
            {topKpis.map((kpi, i) => (
              <div key={i} className="text-center">
                <p className="text-[8px] text-content-muted truncate">{kpi.label}</p>
                <p className="text-[12px] font-bold text-content-primary">{formatValue(kpi.value, kpi.format)}</p>
              </div>
            ))}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-content-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && platform.details && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="px-3 pb-3 border-t border-surface-border pt-3">
            <PlatformDetails details={platform.details} name={platform.name} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PlatformDetails({ details, name }) {
  if (!details) return null;

  // Render known fields cleanly
  return (
    <div className="space-y-3">
      {/* Profile info row */}
      {(details.profilePicture || details.username || details.name) && (
        <div className="flex items-center gap-3">
          {details.profilePicture && (
            <img src={details.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover" />
          )}
          <div>
            {details.name && <p className="text-[13px] font-semibold text-content-primary">{details.name}</p>}
            {details.username && <p className="text-[11px] text-content-muted">@{details.username}</p>}
          </div>
        </div>
      )}

      {/* Campaign stats */}
      {(details.totalCampaigns !== undefined || details.activeCampaigns !== undefined) && (
        <div className="grid grid-cols-3 gap-2">
          {details.totalCampaigns !== undefined && (
            <div className="bg-surface-raised rounded-lg p-2">
              <p className="text-[9px] text-content-muted uppercase">Total</p>
              <p className="text-[14px] font-bold text-content-primary">{details.totalCampaigns}</p>
            </div>
          )}
          {details.activeCampaigns !== undefined && (
            <div className="bg-surface-raised rounded-lg p-2">
              <p className="text-[9px] text-content-muted uppercase">Active</p>
              <p className="text-[14px] font-bold text-green-500">{details.activeCampaigns}</p>
            </div>
          )}
          {details.pausedCampaigns !== undefined && (
            <div className="bg-surface-raised rounded-lg p-2">
              <p className="text-[9px] text-content-muted uppercase">Paused</p>
              <p className="text-[14px] font-bold text-yellow-500">{details.pausedCampaigns}</p>
            </div>
          )}
        </div>
      )}

      {/* Campaign list */}
      {details.campaigns?.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Campaigns</p>
          {details.campaigns.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-surface-raised rounded-lg px-2.5 py-2">
              <div>
                <p className="text-[11px] font-medium text-content-primary">{c.name}</p>
                <p className="text-[9px] text-content-muted">{c.objective?.replace('OUTCOME_', '')}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                c.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
              }`}>{c.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contact/deal stats */}
      {details.contactsByStatus && (
        <div>
          <p className="text-[10px] font-semibold text-content-muted uppercase tracking-wider mb-1.5">Contacts</p>
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(details.contactsByStatus).filter(([,v]) => v > 0).map(([k, v]) => (
              <span key={k} className="text-[10px] px-2 py-1 rounded-lg bg-surface-raised text-content-secondary capitalize">{k}: {v}</span>
            ))}
          </div>
        </div>
      )}

      {details.dealsByStage && (
        <div>
          <p className="text-[10px] font-semibold text-content-muted uppercase tracking-wider mb-1.5">Deals</p>
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(details.dealsByStage).filter(([,v]) => v > 0).map(([k, v]) => (
              <span key={k} className="text-[10px] px-2 py-1 rounded-lg bg-surface-raised text-content-secondary capitalize">{k}: {v}</span>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {details.bio && (
        <p className="text-[11px] text-content-secondary leading-relaxed">{details.bio}</p>
      )}

      {/* Timeline chart */}
      {details.timeline?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-content-muted uppercase tracking-wider mb-2">28-Day Trend</p>
          <div className="bg-surface-raised rounded-xl p-3">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={details.timeline}>
                <defs>
                  <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false}
                  tickFormatter={(d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} width={40} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11 }} />
                <Area type="monotone" dataKey="reach" stroke="#8B5CF6" fill="url(#reachGrad)" strokeWidth={2} name="Reach" />
                <Area type="monotone" dataKey="impressions" stroke="#3B82F6" fill="url(#impGrad)" strokeWidth={1.5} name="Impressions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top performing posts */}
      {details.topPosts?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-content-muted uppercase tracking-wider mb-2">Top Performing Posts</p>
          <div className="grid grid-cols-3 gap-2">
            {details.topPosts.slice(0, 6).map((post) => (
              <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                className="group bg-surface-raised rounded-xl overflow-hidden hover:shadow-elevated transition-all">
                {post.image ? (
                  <div className="aspect-square overflow-hidden">
                    <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                ) : (
                  <div className="aspect-square bg-surface-border flex items-center justify-center">
                    <span className="text-[10px] text-content-muted">{post.type}</span>
                  </div>
                )}
                <div className="p-2">
                  <div className="flex items-center gap-2 text-[9px] text-content-secondary">
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                  {post.caption && <p className="text-[9px] text-content-muted mt-1 line-clamp-2">{post.caption}</p>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Website clicks */}
      {details.websiteClicks > 0 && (
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-content-muted">Website clicks (28d):</span>
          <span className="font-semibold text-content-primary">{details.websiteClicks.toLocaleString()}</span>
        </div>
      )}

      {/* Generic note */}
      {details.note && (
        <p className="text-[11px] text-content-muted italic">{details.note}</p>
      )}
    </div>
  );
}
