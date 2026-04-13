import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Shield, User, Trash2, Mail, Crown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getUsers, createUserAdmin, updateUserRole, deleteUserAdmin } from '../services/api';

export default function Team() {
  const navigate = useNavigate();
  const { user: currentUser } = useStore();
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role !== 'admin') { navigate('/'); return; }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) return alert("Can't delete yourself");
    if (!confirm('Delete this user?')) return;
    await deleteUserAdmin(id);
    loadUsers();
  };

  const handleRoleChange = async (id, role) => {
    if (id === currentUser.id) return;
    await updateUserRole(id, role);
    loadUsers();
  };

  const handleAddUser = async (data) => {
    try {
      await createUserAdmin(data);
      setShowAdd(false);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (currentUser?.role !== 'admin') return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-content-muted hover:text-content-primary mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-title">Team Management</h1>
          <p className="text-content-secondary text-sm mt-1">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2.5 rounded-2xl glossy-btn text-white text-[13px] font-semibold flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-content-muted">Loading...</div>
      ) : (
        <div className="space-y-2.5">
          {users.map((u) => {
            const isCurrentUser = u.id === currentUser.id;
            const isAdmin = u.role === 'admin';
            return (
              <div key={u.id} className="glossy rounded-2xl p-4">
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                    isAdmin ? 'bg-brand-purple/20 text-brand-purple' : 'bg-surface-raised text-content-muted'
                  }`}>
                    {isAdmin ? <Crown className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium text-content-primary">{u.name || 'Unnamed'}</p>
                      {isCurrentUser && <span className="text-[10px] px-1.5 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full font-semibold">You</span>}
                    </div>
                    <p className="text-[12px] text-content-muted flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {u.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={isCurrentUser}
                      className={`!w-auto !px-3 !py-1.5 !text-[12px] !rounded-xl !font-semibold ${
                        isAdmin ? '!text-brand-purple' : '!text-content-secondary'
                      }`}
                    >
                      <option value="admin">Admin</option>
                      <option value="employee">Employee</option>
                    </select>
                    {!isCurrentUser && (
                      <button onClick={() => handleDelete(u.id)} className="p-2 rounded-xl text-content-muted hover:text-red-500 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSubmit={handleAddUser} />}
    </motion.div>
  );
}

function AddUserModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glossy rounded-3xl p-6 max-w-md w-full shadow-elevated-lg">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-content-primary mb-4">Add Team Member</h3>
          <div className="space-y-3">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" />
            <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email" type="email" />
            <input value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Password" type="password" />
            <div className="flex gap-2">
              {['employee', 'admin'].map((r) => (
                <button key={r} onClick={() => set('role', r)}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all capitalize ${
                    form.role === r ? 'bg-brand-purple text-white' : 'bg-surface-raised text-content-secondary border border-surface-border'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary text-sm font-medium">Cancel</button>
            <button onClick={() => onSubmit(form)} className="flex-1 py-3 rounded-2xl glossy-btn text-white text-sm font-semibold">Add Member</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
