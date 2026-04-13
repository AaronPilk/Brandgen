import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Check, X, Users, Shield, Plus, Trash2, Mail, Lock, Loader2,
  Crown, User, Copy, Send, Settings, Key, UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getApiStatus, getUsers, createUserAdmin, updateUserRole, deleteUserAdmin, updateMe } from '../services/api';

const API_LIST = [
  // Core AI
  { key: 'anthropic', name: 'Anthropic', description: 'AI reasoning & generation', envVar: 'ANTHROPIC_API_KEY', required: true, group: 'Core AI' },
  { key: 'openai', name: 'OpenAI', description: 'GPT-4o fallback + DALL-E', envVar: 'OPENAI_API_KEY', group: 'Core AI' },
  { key: 'gemini', name: 'Google Gemini', description: 'AI reasoning', envVar: 'GEMINI_API_KEY', group: 'Core AI' },
  { key: 'grok', name: 'xAI / Grok', description: 'AI reasoning', envVar: 'XAI_API_KEY', group: 'Core AI' },
  { key: 'perplexity', name: 'Perplexity', description: 'AI search & research', envVar: 'PERPLEXITY_API_KEY', group: 'Core AI' },
  // Voice & Conversational
  { key: 'elevenlabs', name: 'ElevenLabs', description: 'Voice generation', envVar: 'ELEVENLABS_API_KEY', group: 'Voice' },
  { key: 'vapi', name: 'Vapi', description: 'Voice AI agents', envVar: 'VAPI_API_KEY', group: 'Voice' },
  { key: 'bland', name: 'Bland', description: 'AI phone calls', envVar: 'BLAND_API_KEY', group: 'Voice' },
  { key: 'retell', name: 'Retell AI', description: 'Conversational AI', envVar: 'RETELL_API_KEY', group: 'Voice' },
  // Automation
  { key: 'n8n', name: 'n8n', description: 'Workflow automation', envVar: 'N8N_API_KEY', group: 'Automation' },
  { key: 'make', name: 'Make', description: 'Visual automation', envVar: 'MAKE_API_KEY', group: 'Automation' },
  { key: 'zapier', name: 'Zapier', description: 'App integrations', envVar: 'ZAPIER_API_KEY', group: 'Automation' },
  { key: 'pipedream', name: 'Pipedream', description: 'Developer automation', envVar: 'PIPEDREAM_API_KEY', group: 'Automation' },
  // Creative AI
  { key: 'midjourney', name: 'Midjourney', description: 'Image generation', envVar: 'MIDJOURNEY_API_KEY', group: 'Creative AI' },
  { key: 'runway', name: 'Runway', description: 'Video generation', envVar: 'RUNWAY_API_KEY', group: 'Creative AI' },
  { key: 'pika', name: 'Pika', description: 'Video generation', envVar: 'PIKA_API_KEY', group: 'Creative AI' },
  { key: 'heygen', name: 'HeyGen', description: 'Avatar videos', envVar: 'HEYGEN_API_KEY', group: 'Creative AI' },
  { key: 'synthesia', name: 'Synthesia', description: 'AI video creation', envVar: 'SYNTHESIA_API_KEY', group: 'Creative AI' },
  { key: 'creatify', name: 'Creatify', description: 'Ad video creation', envVar: 'CREATIFY_API_KEY', group: 'Creative AI' },
  { key: 'captions', name: 'Captions', description: 'Video captions & editing', envVar: 'CAPTIONS_API_KEY', group: 'Creative AI' },
  // Ads & Marketing
  { key: 'metaAds', name: 'Meta Ads', description: 'Campaign management', envVar: 'META_SYSTEM_USER_TOKEN', group: 'Ads & Marketing' },
  { key: 'googleAds', name: 'Google Ads', description: 'Search & display ads', envVar: 'GOOGLE_ADS_API_KEY', group: 'Ads & Marketing' },
  { key: 'linkedinAds', name: 'LinkedIn Ads', description: 'B2B advertising', envVar: 'LINKEDIN_CLIENT_ID', group: 'Ads & Marketing' },
  { key: 'youtube', name: 'YouTube', description: 'Video marketing', envVar: 'YOUTUBE_API_KEY', group: 'Ads & Marketing' },
  // CRM & Comms
  { key: 'klaviyo', name: 'Klaviyo', description: 'Email & SMS marketing', envVar: 'KLAVIYO_API_KEY', group: 'CRM & Comms' },
  { key: 'mailchimp', name: 'Mailchimp', description: 'Email marketing', envVar: 'MAILCHIMP_API_KEY', group: 'CRM & Comms' },
  { key: 'activecampaign', name: 'ActiveCampaign', description: 'Marketing automation', envVar: 'ACTIVECAMPAIGN_API_KEY', group: 'CRM & Comms' },
  { key: 'twilio', name: 'Twilio', description: 'SMS & voice', envVar: 'TWILIO_API_KEY', group: 'CRM & Comms' },
  // Commerce & Sites
  { key: 'kinsta', name: 'Kinsta', description: 'Hosting & deployment', envVar: 'KINSTA_API_KEY', group: 'Commerce & Sites' },
  { key: 'webflow', name: 'Webflow', description: 'Website builder', envVar: 'WEBFLOW_API_KEY', group: 'Commerce & Sites' },
  { key: 'stripe', name: 'Stripe', description: 'Payments', envVar: 'STRIPE_API_KEY', group: 'Commerce & Sites' },
  { key: 'printful', name: 'Printful', description: 'Fulfillment', envVar: 'PRINTFUL_API_KEY', group: 'Commerce & Sites' },
  { key: 'woocommerce', name: 'WooCommerce', description: 'E-commerce', envVar: 'WOOCOMMERCE_API_KEY', group: 'Commerce & Sites' },
  { key: 'notion', name: 'Notion', description: 'Docs & databases', envVar: 'NOTION_API_KEY', group: 'Commerce & Sites' },
  { key: 'airtable', name: 'Airtable', description: 'Data management', envVar: 'AIRTABLE_API_KEY', group: 'Commerce & Sites' },
];

const API_GROUPS = [...new Set(API_LIST.map((a) => a.group))];

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Full access — manage team, billing, all profiles', icon: Crown, color: 'text-brand-purple' },
  { value: 'manager', label: 'Manager', desc: 'Manage profiles, run actions, view all data', icon: Shield, color: 'text-blue-500' },
  { value: 'employee', label: 'Employee', desc: 'Work on assigned profiles only', icon: User, color: 'text-content-secondary' },
];

export default function ApiSettings() {
  const navigate = useNavigate();
  const { apiStatus, setApiStatus, user: currentUser, token, setAuth } = useStore();
  const [tab, setTab] = useState('account');
  const [users, setUsers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    getApiStatus().then(setApiStatus).catch(console.error);
    if (isAdmin) loadUsers();
  }, []);

  const loadUsers = async () => {
    try { setUsers(await getUsers()); } catch {}
  };

  const handleRoleChange = async (id, role) => {
    if (id === currentUser.id) return;
    await updateUserRole(id, role);
    loadUsers();
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) return alert("Can't delete yourself");
    if (!confirm('Remove this team member?')) return;
    await deleteUserAdmin(id);
    loadUsers();
  };

  const handleInvite = async (data) => {
    try {
      await createUserAdmin(data);
      setShowInvite(false);
      loadUsers();
    } catch (err) { alert(err.message); }
  };

  const generateInviteLink = () => {
    const link = `${window.location.origin}/?invite=true`;
    setInviteLink(link);
    navigator.clipboard.writeText(link);
  };

  const TABS = [
    { key: 'account', label: 'Account', icon: User },
    { key: 'team', label: 'Team & Roles', icon: Users },
    { key: 'api', label: 'Integrations', icon: Key },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-content-muted hover:text-content-primary mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-brand-purple" />
        <h1 className="text-title">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-raised rounded-2xl mb-6 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
                tab === t.key ? 'bg-surface-card text-content-primary shadow-sm' : 'text-content-muted hover:text-content-secondary'
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── ACCOUNT TAB ─── */}
      {tab === 'account' && <AccountTab currentUser={currentUser} token={token} setAuth={setAuth} />}

      {/* ─── TEAM TAB ─── */}
      {tab === 'team' && (
        <div>
          {!isAdmin ? (
            <div className="glossy rounded-2xl p-8 text-center">
              <div className="relative z-10">
                <Shield className="w-10 h-10 text-content-muted mx-auto mb-3" />
                <p className="text-content-secondary text-sm">Only admins can manage team members</p>
              </div>
            </div>
          ) : (
            <>
              {/* Actions Row */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-content-secondary text-sm">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
                <div className="flex items-center gap-2">
                  <button onClick={generateInviteLink}
                    className="px-4 py-2 rounded-xl bg-surface-raised text-content-secondary text-[13px] font-medium flex items-center gap-1.5 hover:text-content-primary transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Copy Invite Link
                  </button>
                  <button onClick={() => setShowInvite(true)}
                    className="px-4 py-2 rounded-xl glossy-btn text-white text-[13px] font-semibold flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Invite Member
                  </button>
                </div>
              </div>

              {inviteLink && (
                <div className="mb-4 p-3 bg-green-500/5 border border-green-500/10 rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-[12px] text-green-600 dark:text-green-400">Invite link copied to clipboard! Share it with your team member.</p>
                </div>
              )}

              {/* Role Legend */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  return (
                    <div key={role.value} className="glossy rounded-xl p-4">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className={`w-4 h-4 ${role.color}`} />
                          <p className="text-[13px] font-semibold text-content-primary">{role.label}</p>
                        </div>
                        <p className="text-[11px] text-content-muted leading-relaxed">{role.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Team Members */}
              <div className="space-y-2">
                {users.map((u) => {
                  const isMe = u.id === currentUser.id;
                  const roleConfig = ROLES.find((r) => r.value === u.role) || ROLES[2];
                  const RoleIcon = roleConfig.icon;
                  return (
                    <div key={u.id} className="glossy rounded-2xl p-4">
                      <div className="relative z-10 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          u.role === 'admin' ? 'bg-brand-purple/15 text-brand-purple' : 'bg-surface-raised text-content-muted'
                        }`}>
                          <RoleIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-medium text-content-primary">{u.name || 'Unnamed'}</p>
                            {isMe && <span className="text-[10px] px-1.5 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full font-semibold">You</span>}
                          </div>
                          <p className="text-[12px] text-content-muted flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {u.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={isMe}
                            className="!w-auto !px-3 !py-1.5 !text-[12px] !rounded-xl !font-semibold">
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="employee">Employee</option>
                          </select>
                          {!isMe && (
                            <button onClick={() => handleDelete(u.id)}
                              className="p-2 rounded-xl text-content-muted hover:text-red-500 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── INTEGRATIONS TAB ─── */}
      {tab === 'api' && (
        <div>
          <div className="glossy rounded-xl p-4 mb-5">
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[13px] text-content-secondary">{API_LIST.filter(a => apiStatus?.[a.key]).length} of {API_LIST.length} configured</span>
              <div className="flex items-center gap-3 text-[10px] text-content-muted">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" />Connected</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-surface-border" />Not configured</span>
              </div>
            </div>
          </div>

          {API_GROUPS.map((group) => {
            const items = API_LIST.filter((a) => a.group === group);
            return (
              <div key={group} className="mb-5">
                <h3 className="text-[11px] font-semibold text-content-muted uppercase tracking-wider mb-2">{group}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {items.map((api) => {
                    const isConnected = apiStatus?.[api.key];
                    return (
                      <div key={api.key} className={`glossy rounded-xl p-3 ${isConnected ? '!border-green-500/15' : ''}`}>
                        <div className="relative z-10 flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isConnected ? 'bg-green-500/10 text-green-500' : 'bg-surface-raised text-content-muted'}`}>
                            {isConnected ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[12px] font-medium text-content-primary truncate">{api.name}</p>
                              {api.required && <span className="text-[8px] px-1 bg-brand-purple/10 text-brand-purple rounded font-bold">REQ</span>}
                            </div>
                            <p className="text-[9px] text-content-muted truncate">{api.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="glossy rounded-2xl p-4">
            <div className="relative z-10">
              <p className="text-[13px] text-content-secondary">Add keys to <code className="bg-surface-raised px-1.5 py-0.5 rounded-lg text-[11px]">server/.env</code> and restart. OAuth integrations are configured in Connections.</p>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowInvite(false)} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glossy rounded-3xl p-6 max-w-md w-full shadow-elevated-lg">
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Invite Team Member</h3>
              <p className="text-[13px] text-content-muted mb-5">Create an account for a new team member</p>
              <InviteForm onSubmit={handleInvite} onCancel={() => setShowInvite(false)} />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function InviteForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-3">
      <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" />
      <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email address" type="email" />
      <input value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Temporary password" type="password" />
      <div>
        <label className="block text-[12px] font-medium text-content-secondary mb-2">Role</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'employee', label: 'Employee', icon: User },
            { value: 'manager', label: 'Manager', icon: Shield },
            { value: 'admin', label: 'Admin', icon: Crown },
          ].map((r) => {
            const Icon = r.icon;
            return (
              <button key={r.value} onClick={() => set('role', r.value)}
                className={`py-2.5 rounded-xl text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all ${
                  form.role === r.value ? 'bg-brand-purple text-white' : 'bg-surface-raised text-content-secondary border border-surface-border'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {r.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary text-sm font-medium">Cancel</button>
        <button onClick={() => onSubmit(form)} className="flex-1 py-3 rounded-2xl glossy-btn text-white text-sm font-semibold flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> Send Invite
        </button>
      </div>
    </div>
  );
}

function AccountTab({ currentUser, token, setAuth }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSave = async () => {
    if (password && password !== confirmPw) { setMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    setSaving(true); setMsg(null);
    try {
      const updates = {};
      if (name !== currentUser.name) updates.name = name;
      if (email !== currentUser.email) updates.email = email;
      if (password) updates.password = password;
      if (Object.keys(updates).length === 0) { setMsg({ type: 'info', text: 'No changes' }); setSaving(false); return; }
      const updated = await updateMe(updates);
      setAuth(updated, token);
      setPassword(''); setConfirmPw('');
      setMsg({ type: 'success', text: 'Account updated' });
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    setSaving(false);
  };

  return (
    <div className="max-w-md">
      <div className="glossy rounded-2xl p-6 mb-4">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full bg-brand-purple/15 flex items-center justify-center text-brand-purple text-xl font-bold">
              {(currentUser?.name || currentUser?.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-content-primary">{currentUser?.name || 'Admin'}</p>
              <p className="text-[12px] text-content-muted">{currentUser?.role} · {currentUser?.email}</p>
            </div>
          </div>
          <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Full Name</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></div>
        </div>
      </div>
      <div className="glossy rounded-2xl p-6 mb-4">
        <div className="relative z-10 space-y-4">
          <h3 className="text-[14px] font-semibold text-content-primary flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h3>
          <div><label className="block text-[12px] font-medium text-content-secondary mb-1">New Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Leave blank to keep current" /></div>
          <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Confirm Password</label><input value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} type="password" /></div>
        </div>
      </div>
      {msg && <div className={`mb-4 p-3 rounded-xl text-[12px] ${msg.type === 'success' ? 'bg-green-500/10 text-green-500' : msg.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-surface-raised text-content-muted'}`}>{msg.text}</div>}
      <button onClick={handleSave} disabled={saving} className="glossy-btn text-white px-6 py-3 rounded-2xl text-[13px] font-semibold flex items-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
