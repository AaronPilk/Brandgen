import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Search, Phone, Mail, Building2, User,
  DollarSign, Trash2, Edit3, X, Check, Filter,
  Users, TrendingUp, Target, ChevronDown,
} from 'lucide-react';
import {
  getContacts, getContactStats, createContact, updateContact, deleteContactApi,
  getDeals, getDealStats, createDeal, updateDealApi, deleteDealApi,
  getProfile,
} from '../services/api';
import { useStore } from '../store/useStore';

const CONTACT_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-orange-500' },
  { value: 'proposal', label: 'Proposal', color: 'bg-purple-500' },
  { value: 'won', label: 'Won', color: 'bg-green-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
];

const DEAL_STAGES = [
  { value: 'lead', label: 'Lead', color: 'bg-blue-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-yellow-500' },
  { value: 'proposal', label: 'Proposal', color: 'bg-orange-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-purple-500' },
  { value: 'won', label: 'Won', color: 'bg-green-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
];

export default function CRM() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProfile, setCurrentProfile } = useStore();
  const [tab, setTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [contactStats, setContactStatsData] = useState(null);
  const [dealStats, setDealStatsData] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const profileName = currentProfile?.intake?.brandName || currentProfile?.intake?.industry || 'Profile';

  useEffect(() => {
    if (!currentProfile || currentProfile.id !== id) {
      getProfile(id).then(setCurrentProfile).catch(() => navigate('/'));
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [id, search, statusFilter]);

  const loadData = async () => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    const [c, cs, d, ds] = await Promise.all([
      getContacts(id, params).catch(() => []),
      getContactStats(id).catch(() => null),
      getDeals(id).catch(() => []),
      getDealStats(id).catch(() => null),
    ]);
    setContacts(c);
    setContactStatsData(cs);
    setDeals(d);
    setDealStatsData(ds);
  };

  const handleAddContact = async (data) => {
    await createContact(id, data);
    setShowAddContact(false);
    loadData();
  };

  const handleUpdateContact = async (contactId, data) => {
    await updateContact(contactId, data);
    setEditingContact(null);
    loadData();
  };

  const handleDeleteContact = async (contactId) => {
    if (!confirm('Delete this contact?')) return;
    await deleteContactApi(contactId);
    loadData();
  };

  const handleAddDeal = async (data) => {
    await createDeal(id, data);
    setShowAddDeal(false);
    loadData();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
      <button onClick={() => navigate(`/dashboard/${id}`)} className="flex items-center gap-2 text-content-muted hover:text-content-primary mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to {profileName}
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-title">{profileName} CRM</h1>
          <p className="text-content-secondary text-sm mt-1">Manage contacts, deals, and pipeline</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="Contacts" value={contactStats?.total || 0} color="text-blue-500" />
        <StatCard icon={Target} label="Deals" value={dealStats?.total || 0} color="text-purple-500" />
        <StatCard icon={DollarSign} label="Pipeline" value={`$${(dealStats?.totalValue || 0).toLocaleString()}`} color="text-green-500" />
        <StatCard icon={TrendingUp} label="Won" value={`$${(dealStats?.wonValue || 0).toLocaleString()}`} color="text-brand-purple" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-raised rounded-2xl mb-6 w-fit">
        {['contacts', 'deals'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-[13px] font-semibold capitalize transition-all ${
              tab === t ? 'bg-surface-card text-content-primary shadow-sm' : 'text-content-muted hover:text-content-secondary'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Contacts Tab */}
      {tab === 'contacts' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." className="!pl-10" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="!w-auto !px-3 !py-3 text-[13px]">
              <option value="">All statuses</option>
              {CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={() => setShowAddContact(true)}
              className="px-4 py-3 rounded-2xl glossy-btn text-white text-[13px] font-semibold flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          </div>

          <div className="space-y-2">
            {contacts.length === 0 ? (
              <div className="glossy rounded-2xl p-8 text-center">
                <div className="relative z-10">
                  <Users className="w-8 h-8 text-content-muted mx-auto mb-3" />
                  <p className="text-content-muted text-sm">No contacts yet. Add your first contact or they'll appear here from landing page submissions.</p>
                </div>
              </div>
            ) : contacts.map((contact) => (
              <motion.div key={contact.id} className="glossy rounded-2xl p-4" whileHover={{ y: -1 }}>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple font-semibold text-sm">
                    {(contact.firstName?.[0] || '') + (contact.lastName?.[0] || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-content-primary">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <div className="flex items-center gap-3 text-[12px] text-content-muted mt-0.5">
                      {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
                      {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
                      {contact.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{contact.company}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.value > 0 && (
                      <span className="text-[12px] font-mono text-green-500">${contact.value.toLocaleString()}</span>
                    )}
                    <select value={contact.status} onChange={(e) => handleUpdateContact(contact.id, { status: e.target.value })}
                      className="!w-auto !px-2 !py-1 !text-[11px] !rounded-lg !font-semibold">
                      {CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button onClick={() => handleDeleteContact(contact.id)}
                      className="p-1.5 rounded-lg text-content-muted hover:text-red-500 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Deals Tab */}
      {tab === 'deals' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-content-secondary text-sm">{deals.length} deal{deals.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setShowAddDeal(true)}
              className="px-4 py-2.5 rounded-2xl glossy-btn text-white text-[13px] font-semibold flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Deal
            </button>
          </div>

          {/* Pipeline columns */}
          <div className="grid grid-cols-6 gap-2">
            {DEAL_STAGES.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.value);
              return (
                <div key={stage.value}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="text-[11px] font-semibold text-content-muted uppercase">{stage.label}</span>
                    <span className="text-[10px] text-content-muted">({stageDeals.length})</span>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {stageDeals.map((deal) => (
                      <div key={deal.id} className="glossy rounded-xl p-3">
                        <div className="relative z-10">
                          <p className="text-[12px] font-medium text-content-primary truncate">{deal.title}</p>
                          <p className="text-[11px] text-green-500 font-mono mt-1">${(deal.value || 0).toLocaleString()}</p>
                          <div className="flex items-center justify-between mt-2">
                            <select value={deal.stage} onChange={(e) => { updateDealApi(deal.id, { stage: e.target.value }); loadData(); }}
                              className="!w-auto !px-1.5 !py-0.5 !text-[10px] !rounded-lg">
                              {DEAL_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <button onClick={() => { deleteDealApi(deal.id); loadData(); }}
                              className="p-1 text-content-muted hover:text-red-500 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
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

      {/* Add Contact Modal */}
      {showAddContact && <AddContactModal onClose={() => setShowAddContact(false)} onSubmit={handleAddContact} />}
      {showAddDeal && <AddDealModal onClose={() => setShowAddDeal(false)} onSubmit={handleAddDeal} contacts={contacts} />}
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glossy rounded-2xl p-4">
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-[10px] font-medium text-content-muted uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function AddContactModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', value: '', notes: '' });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glossy rounded-3xl p-6 max-w-md w-full shadow-elevated-lg">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-content-primary mb-4">Add Contact</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First name" />
              <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Last name" />
            </div>
            <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email" type="email" />
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone" />
            <input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Company" />
            <input value={form.value} onChange={(e) => set('value', e.target.value)} placeholder="Deal value ($)" type="number" />
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Notes" rows={2} />
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary text-sm font-medium">Cancel</button>
            <button onClick={() => onSubmit({ ...form, value: parseFloat(form.value) || 0 })}
              className="flex-1 py-3 rounded-2xl glossy-btn text-white text-sm font-semibold">Add Contact</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AddDealModal({ onClose, onSubmit, contacts }) {
  const [form, setForm] = useState({ title: '', value: '', contactId: '', notes: '' });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glossy rounded-3xl p-6 max-w-md w-full shadow-elevated-lg">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-content-primary mb-4">Add Deal</h3>
          <div className="space-y-3">
            <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Deal title" />
            <input value={form.value} onChange={(e) => set('value', e.target.value)} placeholder="Value ($)" type="number" />
            <select value={form.contactId} onChange={(e) => set('contactId', e.target.value)} className="!text-[13px]">
              <option value="">Link to contact (optional)</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Notes" rows={2} />
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary text-sm font-medium">Cancel</button>
            <button onClick={() => onSubmit({ ...form, value: parseFloat(form.value) || 0 })}
              className="flex-1 py-3 rounded-2xl glossy-btn text-white text-sm font-semibold">Add Deal</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
