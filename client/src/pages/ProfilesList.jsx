import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Target, Palette, Plus, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { listProfiles, deleteProfile } from '../services/api';

export default function ProfilesList() {
  const navigate = useNavigate();
  const { setCurrentProfile } = useStore();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProfiles().then(setProfiles).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this profile?')) return;
    await deleteProfile(id);
    setProfiles((p) => p.filter((x) => x.id !== id));
  };

  const openProfile = (profile) => {
    setCurrentProfile(profile);
    navigate(`/dashboard/${profile.id}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-content-muted hover:text-content-primary mb-8 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-title">Profiles</h1>
          <p className="text-content-secondary text-sm mt-1">{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-purple hover:bg-brand-purple-dark text-white text-[13px] font-semibold transition-colors shadow-lg shadow-brand-purple/25"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-content-muted text-sm animate-shimmer">Loading...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-3xl bg-surface-raised flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-content-muted" />
          </div>
          <p className="text-content-secondary mb-4">No profiles yet</p>
          <button onClick={() => navigate('/')} className="text-brand-purple hover:text-brand-purple-dark transition-colors text-sm font-medium">
            Create your first profile
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <motion.div
              key={profile.id}
              whileHover={{ y: -1 }}
              onClick={() => openProfile(profile)}
              className="group p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-brand-purple/20 hover:shadow-glass-lg cursor-pointer transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-purple/10 flex items-center justify-center">
                    {profile.mode === 'lead-gen' ? (
                      <Target className="w-5 h-5 text-brand-purple" />
                    ) : (
                      <Palette className="w-5 h-5 text-brand-purple" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[14px] text-content-primary">
                      {profile.intake?.brandName || profile.intake?.industry || 'Untitled'}
                    </p>
                    <p className="text-[12px] text-content-muted">
                      {profile.mode === 'lead-gen' ? 'Lead Gen' : 'Brand'} · {new Date(profile.createdAt).toLocaleDateString()}
                      {profile.assets && ` · ${Object.keys(profile.assets).length} assets`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(profile.id, e)}
                    className="p-2 rounded-xl text-content-muted hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-content-muted" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
