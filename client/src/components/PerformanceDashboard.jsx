import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, MousePointer,
  Eye, Users, BarChart3, Loader2, AlertCircle,
} from 'lucide-react';
import { getMetaAdsStatus, getMetaAccountInsights, getMetaCampaigns } from '../services/api';

const METRICS = [
  { key: 'spend', label: 'Total Spend', icon: DollarSign, format: 'currency', color: 'text-brand-purple' },
  { key: 'impressions', label: 'Impressions', icon: Eye, format: 'number', color: 'text-blue-500' },
  { key: 'clicks', label: 'Clicks', icon: MousePointer, format: 'number', color: 'text-green-500' },
  { key: 'ctr', label: 'CTR', icon: TrendingUp, format: 'percent', color: 'text-orange-500' },
  { key: 'cpc', label: 'Avg CPC', icon: DollarSign, format: 'currency', color: 'text-cyan-500' },
  { key: 'reach', label: 'Reach', icon: Users, format: 'number', color: 'text-pink-500' },
];

function formatValue(value, format) {
  if (!value && value !== 0) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (format === 'currency') return `$${num.toFixed(2)}`;
  if (format === 'percent') return `${num.toFixed(2)}%`;
  if (format === 'number') return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toLocaleString();
  return value;
}

export default function PerformanceDashboard({ profileId }) {
  const [configured, setConfigured] = useState(false);
  const [insights, setInsights] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last_30d');
  const [error, setError] = useState('');

  useEffect(() => {
    getMetaAdsStatus()
      .then((s) => {
        setConfigured(s.configured);
        if (s.configured) {
          return Promise.all([
            getMetaAccountInsights(dateRange).catch(() => null),
            getMetaCampaigns().catch(() => null),
          ]);
        }
        return [null, null];
      })
      .then(([insightData, campaignData]) => {
        if (insightData?.data?.[0]) setInsights(insightData.data[0]);
        if (campaignData?.data) setCampaigns(campaignData.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [dateRange]);

  if (!configured) return null;
  if (loading) {
    return (
      <div className="mt-8 mb-2">
        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-purple" /> Performance
        </h2>
        <div className="glossy rounded-2xl p-8 flex items-center justify-center">
          <div className="relative z-10"><Loader2 className="w-5 h-5 text-brand-purple animate-spin" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-purple" /> Performance
        </h2>
        <div className="flex gap-1">
          {[
            { value: 'last_7d', label: '7d' },
            { value: 'last_14d', label: '14d' },
            { value: 'last_30d', label: '30d' },
            { value: 'last_90d', label: '90d' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                dateRange === opt.value
                  ? 'bg-brand-purple text-white'
                  : 'bg-surface-raised text-content-muted hover:text-content-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="glossy rounded-2xl p-4 mb-4">
          <div className="relative z-10 flex items-center gap-2 text-orange-500 text-[13px]">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      {insights && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 mb-5">
          {METRICS.map((metric, i) => {
            const Icon = metric.icon;
            const value = insights[metric.key];
            return (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glossy rounded-2xl p-4"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon className={`w-3.5 h-3.5 ${metric.color}`} />
                    <span className="text-[10px] font-medium text-content-muted uppercase tracking-wider">{metric.label}</span>
                  </div>
                  <p className={`text-xl font-bold ${metric.color}`}>
                    {formatValue(value, metric.format)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!insights && !error && (
        <div className="glossy rounded-2xl p-6 text-center mb-5">
          <div className="relative z-10">
            <p className="text-content-muted text-sm">No performance data yet. Run some ad campaigns to see metrics here.</p>
          </div>
        </div>
      )}

      {/* Active Campaigns */}
      {campaigns.length > 0 && (
        <div>
          <h3 className="text-[14px] font-semibold text-content-primary mb-3">Active Campaigns</h3>
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="glossy rounded-xl p-3.5">
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-content-primary">{campaign.name}</p>
                    <p className="text-[11px] text-content-muted">
                      {campaign.objective?.replace('OUTCOME_', '')} · {campaign.status}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    campaign.status === 'ACTIVE'
                      ? 'bg-green-500/10 text-green-500'
                      : campaign.status === 'PAUSED'
                      ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      : 'bg-surface-raised text-content-muted'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
