import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
            className="px-3 pb-3 border-t border-surface-border pt-2">
            <pre className="text-[10px] text-content-secondary font-mono bg-surface-raised rounded-lg p-2 overflow-x-auto">
              {JSON.stringify(platform.details, null, 2)}
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}
