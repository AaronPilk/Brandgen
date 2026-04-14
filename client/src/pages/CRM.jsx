import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Search, Phone, Mail, Building2, Users, UserPlus,
  DollarSign, Trash2, TrendingUp, TrendingDown, Target, BarChart3,
  Zap, Globe, Eye, MousePointer, ArrowUpRight, ArrowDownRight,
  Calendar, Filter, Download, Megaphone, Clock, Star, AlertCircle, ChevronDown, Settings,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  getContacts, getContactStats, createContact, updateContact, deleteContactApi,
  getDeals, getDealStats, createDeal, updateDealApi, deleteDealApi,
  getProfile, getMetaAdsStatus, getMetaAccountInsights, getMetaCampaigns,
  getActivityFeed, getMetaCampaignAds, getMetaAdCreatives, getBrandOverview,
} from '../services/api';
import { useStore } from '../store/useStore';

const PURPLE = '#8B5CF6';
const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const CONTACT_STATUSES = [
  { value: 'new', label: 'New', color: '#3B82F6' },
  { value: 'contacted', label: 'Contacted', color: '#F59E0B' },
  { value: 'qualified', label: 'Qualified', color: '#F97316' },
  { value: 'proposal', label: 'Proposal', color: '#8B5CF6' },
  { value: 'won', label: 'Won', color: '#10B981' },
  { value: 'lost', label: 'Lost', color: '#EF4444' },
];

const DEAL_STAGES = [
  { value: 'lead', label: 'Lead', color: '#3B82F6' },
  { value: 'qualified', label: 'Qualified', color: '#F59E0B' },
  { value: 'proposal', label: 'Proposal', color: '#F97316' },
  { value: 'negotiation', label: 'Negotiation', color: '#8B5CF6' },
  { value: 'won', label: 'Won', color: '#10B981' },
  { value: 'lost', label: 'Lost', color: '#EF4444' },
];

export default function CRM() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProfile, setCurrentProfile } = useStore();
  const [tab, setTab] = useState('overview');
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [contactStats, setCStats] = useState(null);
  const [dealStats, setDStats] = useState(null);
  const [metaInsights, setMetaInsights] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [activity, setActivity] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [metaConfigured, setMetaConfigured] = useState(false);

  const profileName = currentProfile?.intake?.brandName || currentProfile?.intake?.industry || 'Profile';

  useEffect(() => {
    if (!currentProfile || currentProfile.id !== id) {
      getProfile(id).then(setCurrentProfile).catch(() => navigate('/'));
    }
    loadAll();
  }, [id]);

  const loadAll = async () => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;

    const [c, cs, d, ds, act] = await Promise.all([
      getContacts(id, params).catch(() => []),
      getContactStats(id).catch(() => null),
      getDeals(id).catch(() => []),
      getDealStats(id).catch(() => null),
      getActivityFeed(id, 10).catch(() => []),
    ]);
    setContacts(c); setCStats(cs); setDeals(d); setDStats(ds); setActivity(act);

    // Meta data
    const metaStatus = await getMetaAdsStatus().catch(() => ({ configured: false }));
    setMetaConfigured(metaStatus.configured);
    if (metaStatus.configured) {
      const [ins, camp] = await Promise.all([
        getMetaAccountInsights('last_30d').catch(() => null),
        getMetaCampaigns().catch(() => null),
      ]);
      if (ins?.data?.[0]) setMetaInsights(ins.data[0]);
      if (camp?.data) setCampaigns(camp.data);
    }
  };

  useEffect(() => { loadAll(); }, [search, statusFilter]);

  // Chart data
  const pipelineData = DEAL_STAGES.slice(0, 4).map((s) => ({
    name: s.label,
    value: deals.filter((d) => d.stage === s.value).length,
    amount: deals.filter((d) => d.stage === s.value).reduce((sum, d) => sum + (d.value || 0), 0),
  }));

  const contactsByStatus = CONTACT_STATUSES.map((s) => ({
    name: s.label,
    value: contacts.filter((c) => c.status === s.value).length,
    color: s.color,
  })).filter((d) => d.value > 0);

  // Mock trend data for visualization (replace with real time-series later)
  const trendData = Array.from({ length: 14 }, (_, i) => ({
    day: `${i + 1}`,
    leads: Math.floor(Math.random() * 8 + (contactStats?.total || 2)),
    spend: parseFloat(((Math.random() * 30 + 10) * (metaInsights ? 1 : 0.1)).toFixed(2)),
    clicks: Math.floor(Math.random() * 200 + 50),
  }));

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'platforms', label: 'Platform Data' },
    { key: 'contacts', label: `Contacts (${contactStats?.total || 0})` },
    { key: 'deals', label: `Deals (${dealStats?.total || 0})` },
    { key: 'campaigns', label: `Campaigns (${campaigns.length})` },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link to={`/dashboard/${id}`} className="text-content-muted hover:text-content-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-content-primary">{profileName}</h1>
          </div>
          <p className="text-content-secondary text-sm ml-8">Business Intelligence Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl bg-surface-raised text-content-secondary text-[13px] font-medium flex items-center gap-1.5 hover:text-content-primary transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setShowAddContact(true)} className="px-4 py-2 rounded-xl glossy-btn text-white text-[13px] font-semibold flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Add Contact
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-raised rounded-2xl mb-8 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              tab === t.key ? 'bg-surface-card text-content-primary shadow-sm' : 'text-content-muted hover:text-content-secondary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard icon={Users} label="Total Contacts" value={contactStats?.total || 0} color="text-blue-500" trend="+12%" up />
            <KPICard icon={Target} label="Active Deals" value={dealStats?.total || 0} color="text-brand-purple" trend="+5%" up />
            <KPICard icon={DollarSign} label="Pipeline Value" value={`$${(dealStats?.totalValue || 0).toLocaleString()}`} color="text-green-500" trend="+18%" up />
            <KPICard icon={TrendingUp} label="Won Revenue" value={`$${(dealStats?.wonValue || 0).toLocaleString()}`} color="text-emerald-500" />
          </div>

          {/* Ad Performance Row */}
          {metaConfigured && metaInsights && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <MiniKPI label="Ad Spend" value={`$${parseFloat(metaInsights.spend || 0).toFixed(2)}`} icon={DollarSign} color="text-brand-purple" />
              <MiniKPI label="Impressions" value={formatNum(metaInsights.impressions)} icon={Eye} color="text-blue-500" />
              <MiniKPI label="Clicks" value={formatNum(metaInsights.clicks)} icon={MousePointer} color="text-green-500" />
              <MiniKPI label="CTR" value={`${parseFloat(metaInsights.ctr || 0).toFixed(2)}%`} icon={TrendingUp} color="text-orange-500" />
              <MiniKPI label="CPC" value={`$${parseFloat(metaInsights.cpc || 0).toFixed(2)}`} icon={DollarSign} color="text-cyan-500" />
              <MiniKPI label="Reach" value={formatNum(metaInsights.reach)} icon={Users} color="text-pink-500" />
            </div>
          )}

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Lead Trend */}
            <div className="glossy rounded-3xl p-5">
              <div className="relative z-10">
                <h3 className="text-[14px] font-semibold text-content-primary mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-purple" /> Lead Acquisition Trend
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PURPLE} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="leads" stroke={PURPLE} fill="url(#purpleGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pipeline Breakdown */}
            <div className="glossy rounded-3xl p-5">
              <div className="relative z-10">
                <h3 className="text-[14px] font-semibold text-content-primary mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-purple" /> Deal Pipeline
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={pipelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                      formatter={(v, name) => [name === 'amount' ? `$${v.toLocaleString()}` : v, name === 'amount' ? 'Value' : 'Count']} />
                    <Bar dataKey="value" fill={PURPLE} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Contact Status + AI Suggestions Row */}
          <div className="grid md:grid-cols-3 gap-5">
            {/* Contact Breakdown */}
            <div className="glossy rounded-3xl p-5">
              <div className="relative z-10">
                <h3 className="text-[14px] font-semibold text-content-primary mb-4">Contact Status</h3>
                {contactsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={contactsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {contactsByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-content-muted text-sm">No contacts yet</div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {contactsByStatus.map((s) => (
                    <span key={s.name} className="text-[10px] flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      {s.name} ({s.value})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="glossy rounded-3xl p-5 md:col-span-2">
              <div className="relative z-10">
                <h3 className="text-[14px] font-semibold text-content-primary mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-purple" /> AI Suggestions
                </h3>
                <div className="space-y-3">
                  {[
                    { text: `You have ${contactStats?.new || 0} new contacts that haven't been contacted. Consider sending an intro email sequence.`, type: 'action', icon: Mail },
                    { text: metaInsights ? `Your CTR is ${parseFloat(metaInsights.ctr || 0).toFixed(2)}% — ${parseFloat(metaInsights.ctr || 0) > 2 ? 'above average! Scale your top-performing ads.' : 'below average. Test new creative angles.'}` : 'Connect Meta Ads to see campaign optimization suggestions.', type: 'insight', icon: TrendingUp },
                    { text: `${dealStats?.lead || 0} deals are stuck in Lead stage. Move qualified ones forward or mark as lost to keep your pipeline clean.`, type: 'action', icon: Target },
                    { text: `Your pipeline is worth $${(dealStats?.totalValue || 0).toLocaleString()}. Focus on the ${dealStats?.proposal || 0} deals in Proposal stage — they're closest to closing.`, type: 'insight', icon: DollarSign },
                  ].map((sug, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-surface-raised/50 hover:bg-surface-raised transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        sug.type === 'action' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        <sug.icon className="w-4 h-4" />
                      </div>
                      <p className="text-[13px] text-content-secondary leading-relaxed">{sug.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {activity.length > 0 && (
            <div className="glossy rounded-3xl p-5">
              <div className="relative z-10">
                <h3 className="text-[14px] font-semibold text-content-primary mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-purple" /> Recent Activity
                </h3>
                <div className="space-y-2">
                  {activity.slice(0, 5).map((evt) => (
                    <div key={evt.id} className="flex items-center gap-3 py-2">
                      <div className="w-2 h-2 rounded-full bg-brand-purple shrink-0" />
                      <p className="text-[13px] text-content-secondary flex-1">{evt.typeConfig?.label || evt.type}</p>
                      <span className="text-[11px] text-content-muted">{timeAgo(evt.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── CONTACTS TAB ─── */}
      {tab === 'contacts' && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." className="!pl-10" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="!w-auto !px-3 !py-3 text-[13px]">
              <option value="">All</option>
              {CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={() => setShowAddContact(true)} className="px-4 py-3 rounded-2xl glossy-btn text-white text-[13px] font-semibold flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <div className="glossy rounded-2xl p-12 text-center">
                <div className="relative z-10">
                  <Users className="w-10 h-10 text-content-muted mx-auto mb-3" />
                  <p className="text-content-secondary text-sm">No contacts yet</p>
                  <p className="text-content-muted text-xs mt-1">Add contacts manually or they'll flow in from landing pages and ads</p>
                </div>
              </div>
            ) : contacts.map((contact) => (
              <div key={contact.id} className="glossy rounded-2xl p-4">
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple font-semibold text-sm shrink-0">
                    {(contact.firstName?.[0] || '') + (contact.lastName?.[0] || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-content-primary">{contact.firstName} {contact.lastName}</p>
                    <div className="flex items-center gap-3 text-[12px] text-content-muted mt-0.5">
                      {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
                      {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.value > 0 && <span className="text-[12px] font-mono text-green-500">${contact.value.toLocaleString()}</span>}
                    <select value={contact.status} onChange={(e) => { updateContact(contact.id, { status: e.target.value }); loadAll(); }}
                      className="!w-auto !px-2 !py-1 !text-[11px] !rounded-lg">
                      {CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button onClick={() => { deleteContactApi(contact.id); loadAll(); }} className="p-1.5 rounded-lg text-content-muted hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── DEALS TAB ─── */}
      {tab === 'deals' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <p className="text-content-secondary text-sm">{deals.length} deal{deals.length !== 1 ? 's' : ''} · ${(dealStats?.totalValue || 0).toLocaleString()} total pipeline</p>
            <button onClick={() => setShowAddDeal(true)} className="px-4 py-2.5 rounded-2xl glossy-btn text-white text-[13px] font-semibold flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Deal
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {DEAL_STAGES.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.value);
              const stageValue = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
              return (
                <div key={stage.value}>
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                      <span className="text-[11px] font-semibold text-content-muted uppercase">{stage.label}</span>
                    </div>
                    <p className="text-[10px] text-content-muted ml-3.5">{stageDeals.length} · ${stageValue.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2 min-h-[120px]">
                    {stageDeals.map((deal) => (
                      <div key={deal.id} className="glossy rounded-xl p-3">
                        <div className="relative z-10">
                          <p className="text-[12px] font-medium text-content-primary truncate">{deal.title}</p>
                          <p className="text-[11px] text-green-500 font-mono mt-1">${(deal.value || 0).toLocaleString()}</p>
                          <select value={deal.stage} onChange={(e) => { updateDealApi(deal.id, { stage: e.target.value }); loadAll(); }}
                            className="!w-full !px-1.5 !py-0.5 !text-[10px] !rounded-lg mt-2">
                            {DEAL_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── PLATFORM DATA TAB (deep dive) ─── */}
      {tab === 'platforms' && <PlatformDataTab profileId={id} />}

      {/* ─── CAMPAIGNS TAB ─── */}
      {tab === 'campaigns' && (
        <div>
          {!metaConfigured ? (
            <div className="glossy rounded-2xl p-12 text-center">
              <div className="relative z-10">
                <Megaphone className="w-10 h-10 text-content-muted mx-auto mb-3" />
                <p className="text-content-secondary text-sm">Connect Meta Ads to see campaign data</p>
                <Link to={`/dashboard/${id}`} className="text-brand-purple text-sm font-medium mt-2 inline-block">Go to profile settings</Link>
              </div>
            </div>
          ) : (
            <div>
              {/* Campaign summary */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="glossy rounded-xl p-4"><div className="relative z-10">
                  <p className="text-[10px] text-content-muted uppercase tracking-wider mb-1">Total Campaigns</p>
                  <p className="text-2xl font-bold text-content-primary">{campaigns.length}</p>
                </div></div>
                <div className="glossy rounded-xl p-4"><div className="relative z-10">
                  <p className="text-[10px] text-content-muted uppercase tracking-wider mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-500">{campaigns.filter(c => c.status === 'ACTIVE').length}</p>
                </div></div>
                <div className="glossy rounded-xl p-4"><div className="relative z-10">
                  <p className="text-[10px] text-content-muted uppercase tracking-wider mb-1">Paused</p>
                  <p className="text-2xl font-bold text-yellow-500">{campaigns.filter(c => c.status === 'PAUSED').length}</p>
                </div></div>
              </div>

              <div className="space-y-3">
                {campaigns.map((c) => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
                {campaigns.length === 0 && (
                  <div className="glossy rounded-2xl p-8 text-center">
                    <div className="relative z-10 text-content-muted text-sm">No campaigns found</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddContact && <AddContactModal onClose={() => setShowAddContact(false)} onSubmit={async (d) => { await createContact(id, d); setShowAddContact(false); loadAll(); }} />}
      {showAddDeal && <AddDealModal onClose={() => setShowAddDeal(false)} onSubmit={async (d) => { await createDeal(id, d); setShowAddDeal(false); loadAll(); }} contacts={contacts} />}
    </motion.div>
  );
}

function KPICard({ icon: Icon, label, value, color, trend, up }) {
  return (
    <div className="glossy rounded-2xl p-5">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <Icon className={`w-5 h-5 ${color}`} />
          {trend && (
            <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${up ? 'text-green-500' : 'text-red-500'}`}>
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {trend}
            </span>
          )}
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-[11px] text-content-muted mt-1">{label}</p>
      </div>
    </div>
  );
}

function MiniKPI({ label, value, icon: Icon, color }) {
  return (
    <div className="glossy rounded-xl p-3">
      <div className="relative z-10 text-center">
        <Icon className={`w-3.5 h-3.5 ${color} mx-auto mb-1`} />
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        <p className="text-[9px] text-content-muted uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function formatNum(v) {
  if (!v) return '0';
  const n = parseFloat(v);
  return n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toLocaleString();
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function AddContactModal({ onClose, onSubmit }) {
  const [f, setF] = useState({ firstName:'', lastName:'', email:'', phone:'', company:'', value:'', notes:'' });
  const s = (k,v) => setF(p => ({...p,[k]:v}));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} className="relative glossy rounded-3xl p-6 max-w-md w-full shadow-elevated-lg">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-content-primary mb-4">Add Contact</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={f.firstName} onChange={e=>s('firstName',e.target.value)} placeholder="First name" />
              <input value={f.lastName} onChange={e=>s('lastName',e.target.value)} placeholder="Last name" />
            </div>
            <input value={f.email} onChange={e=>s('email',e.target.value)} placeholder="Email" type="email" />
            <input value={f.phone} onChange={e=>s('phone',e.target.value)} placeholder="Phone" />
            <input value={f.company} onChange={e=>s('company',e.target.value)} placeholder="Company" />
            <input value={f.value} onChange={e=>s('value',e.target.value)} placeholder="Deal value ($)" type="number" />
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary text-sm font-medium">Cancel</button>
            <button onClick={()=>onSubmit({...f,value:parseFloat(f.value)||0})} className="flex-1 py-3 rounded-2xl glossy-btn text-white text-sm font-semibold">Add</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AddDealModal({ onClose, onSubmit, contacts }) {
  const [f, setF] = useState({ title:'', value:'', contactId:'', notes:'' });
  const s = (k,v) => setF(p => ({...p,[k]:v}));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} className="relative glossy rounded-3xl p-6 max-w-md w-full shadow-elevated-lg">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-content-primary mb-4">Add Deal</h3>
          <div className="space-y-3">
            <input value={f.title} onChange={e=>s('title',e.target.value)} placeholder="Deal title" />
            <input value={f.value} onChange={e=>s('value',e.target.value)} placeholder="Value ($)" type="number" />
            <select value={f.contactId} onChange={e=>s('contactId',e.target.value)} className="!text-[13px]">
              <option value="">Link to contact (optional)</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary text-sm font-medium">Cancel</button>
            <button onClick={()=>onSubmit({...f,value:parseFloat(f.value)||0})} className="flex-1 py-3 rounded-2xl glossy-btn text-white text-sm font-semibold">Add</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CampaignCard({ campaign }) {
  const [expanded, setExpanded] = useState(false);
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && ads.length === 0) {
      setLoadingAds(true);
      try {
        const data = await getMetaCampaignAds(campaign.id);
        setAds(data?.data || []);
      } catch {}
      setLoadingAds(false);
    }
    setExpanded(!expanded);
  };

  const statusColor = campaign.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500';
  const objective = campaign.objective?.replace('OUTCOME_', '') || '';
  const budget = campaign.daily_budget ? `$${(campaign.daily_budget / 100).toFixed(0)}/day` : '';

  return (
    <div className="glossy rounded-2xl overflow-hidden">
      <div className="relative z-10">
        {/* Campaign Header */}
        <button onClick={toggleExpand} className="w-full text-left p-4 flex items-center gap-4 hover:bg-surface-raised/30 transition-colors">
          <div className={`w-2 h-10 rounded-full ${statusColor} shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-content-primary truncate">{campaign.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {objective && <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-raised text-content-muted font-medium">{objective}</span>}
              {budget && <span className="text-[11px] text-content-muted">{budget}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              campaign.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
            }`}>{campaign.status}</span>
            <ChevronDown className={`w-4 h-4 text-content-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Expanded Ads */}
        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-surface-border">
            {loadingAds ? (
              <div className="flex items-center justify-center py-8 gap-2 text-content-muted">
                <div className="w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px]">Loading creatives...</span>
              </div>
            ) : ads.length === 0 ? (
              <p className="text-content-muted text-[13px] text-center py-8">No ads in this campaign</p>
            ) : (
              <div className="p-4">
                <p className="text-[11px] text-content-muted mb-3 font-medium">{ads.length} ad{ads.length !== 1 ? 's' : ''}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ads.map((ad) => {
                    const imgSrc = ad.creative?.image_url || ad.creative?.thumbnail_url;
                    const insights = ad.insights?.data?.[0];
                    return (
                      <div key={ad.id} className="group rounded-xl overflow-hidden bg-surface-raised hover:shadow-elevated transition-all">
                        {/* Image */}
                        <div className="relative aspect-[4/5] overflow-hidden">
                          {imgSrc ? (
                            <img src={imgSrc} alt={ad.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-surface-border flex items-center justify-center">
                              <Megaphone className="w-8 h-8 text-content-muted/30" />
                            </div>
                          )}
                          {/* Status badge overlay */}
                          <div className="absolute top-2 right-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                              ad.status === 'ACTIVE' ? 'bg-green-500/80 text-white' : 'bg-black/50 text-white/80'
                            }`}>{ad.status}</span>
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <p className="text-[12px] font-medium text-content-primary truncate">{ad.name}</p>
                          {insights && (
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              <div>
                                <p className="text-[9px] text-content-muted uppercase">Impr</p>
                                <p className="text-[11px] font-semibold text-content-primary">{formatNum(insights.impressions)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-content-muted uppercase">Clicks</p>
                                <p className="text-[11px] font-semibold text-content-primary">{formatNum(insights.clicks)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-content-muted uppercase">Spend</p>
                                <p className="text-[11px] font-semibold text-content-primary">${parseFloat(insights.spend || 0).toFixed(0)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PlatformDataTab({ profileId }) {
  const [data, setData] = useState(null);
  const [datePreset, setDatePreset] = useState('last_30d');
  const [loading, setLoading] = useState(true);

  const DATE_OPTIONS = [
    { value: 'today', label: 'Today' }, { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7d', label: '7d' }, { value: 'last_14d', label: '14d' },
    { value: 'last_30d', label: '30d' }, { value: 'last_90d', label: '90d' },
    { value: 'this_month', label: 'Month' }, { value: 'last_month', label: 'Last mo' },
    { value: 'this_quarter', label: 'Quarter' }, { value: 'this_year', label: 'Year' },
    { value: 'lifetime', label: 'All time' },
  ];

  useEffect(() => {
    setLoading(true);
    getBrandOverview(profileId, datePreset).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [profileId, datePreset]);

  if (loading) return <div className="text-center py-12 text-content-muted text-sm">Loading...</div>;
  if (!data) return null;

  const fmtVal = (v, f) => {
    if (!v && v !== 0) return '—';
    if (f === 'currency') return `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (f === 'percent') return `${Number(v).toFixed(2)}%`;
    const n = Number(v);
    return n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}k` : n.toLocaleString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-content-secondary text-sm">{data.summary.connectedPlatforms} connected</p>
        <div className="flex gap-0.5 p-0.5 bg-surface-raised rounded-lg flex-wrap">
          {DATE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setDatePreset(opt.value)}
              className={`px-2 py-1 rounded-md text-[9px] font-semibold transition-all ${
                datePreset === opt.value ? 'bg-brand-purple text-white' : 'text-content-muted hover:text-content-secondary'
              }`}>{opt.label}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {data.platforms.filter(p => p.connected).map(platform => (
          <div key={platform.platform} className="glossy rounded-2xl p-4">
            <div className="relative z-10">
              <h3 className="text-[14px] font-semibold text-content-primary mb-3">{platform.name}</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-3">
                {platform.kpis.map((kpi, i) => (
                  <div key={i}>
                    <p className="text-[9px] text-content-muted uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-lg font-bold text-content-primary">{fmtVal(kpi.value, kpi.format)}</p>
                  </div>
                ))}
              </div>
              {platform.details && (
                <details className="text-[11px]">
                  <summary className="cursor-pointer text-content-muted hover:text-brand-purple">View details</summary>
                  <div className="mt-2 space-y-2">
                    {platform.details.profilePicture && (
                      <div className="flex items-center gap-3">
                        <img src={platform.details.profilePicture} alt="" className="w-10 h-10 rounded-full" />
                        <div>
                          {platform.details.name && <p className="text-[13px] font-semibold text-content-primary">{platform.details.name}</p>}
                          {platform.details.username && <p className="text-[11px] text-content-muted">@{platform.details.username}</p>}
                        </div>
                      </div>
                    )}
                    {platform.details.campaigns?.length > 0 && (
                      <div className="space-y-1">
                        {platform.details.campaigns.slice(0, 5).map(c => (
                          <div key={c.id} className="flex items-center justify-between bg-surface-raised rounded-lg px-2.5 py-2">
                            <div>
                              <p className="text-[11px] font-medium text-content-primary">{c.name}</p>
                              <p className="text-[9px] text-content-muted">{c.objective?.replace('OUTCOME_', '')}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${c.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{c.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {platform.details.contactsByStatus && (
                      <div className="flex gap-1.5 flex-wrap">
                        {Object.entries(platform.details.contactsByStatus).filter(([,v]) => v > 0).map(([k, v]) => (
                          <span key={k} className="text-[10px] px-2 py-1 rounded-lg bg-surface-raised text-content-secondary capitalize">{k}: {v}</span>
                        ))}
                      </div>
                    )}
                    {platform.details.note && <p className="text-[11px] text-content-muted italic">{platform.details.note}</p>}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
        {data.platforms.filter(p => !p.connected).length > 0 && (
          <div className="glossy rounded-xl p-4">
            <div className="relative z-10">
              <p className="text-[12px] font-semibold text-content-primary mb-2">Connect to see data:</p>
              <div className="flex flex-wrap gap-2">
                {data.platforms.filter(p => !p.connected).map(p => (
                  <span key={p.platform} className="text-[11px] px-3 py-1 rounded-lg bg-surface-raised text-content-muted">{p.name}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
