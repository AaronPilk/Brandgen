import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Target, Palette, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { listProfiles, deleteProfile } from '../services/api';

export default function ProfilesList() {
  const navigate = useNavigate();
  const { setCurrentProfile } = useStore();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false));
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Profiles</h1>
          <p className="text-gray-400 text-sm mt-1">
            {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> New Profile
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No profiles yet</p>
          <button
            onClick={() => navigate('/')}
            className="text-brand-purple hover:text-brand-purple-light transition-colors"
          >
            Create your first profile
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <motion.div
              key={profile.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => openProfile(profile)}
              className="p-4 rounded-xl bg-brand-dark-card border border-brand-dark-border hover:border-brand-purple/30 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-purple/10">
                    {profile.mode === 'lead-gen' ? (
                      <Target className="w-5 h-5 text-brand-purple" />
                    ) : (
                      <Palette className="w-5 h-5 text-brand-purple" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {profile.intake?.brandName ||
                        profile.intake?.industry ||
                        'Untitled'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.mode === 'lead-gen'
                        ? 'Lead Gen'
                        : 'Brand'}{' '}
                      · {new Date(profile.createdAt).toLocaleDateString()}
                      {profile.assets &&
                        ` · ${Object.keys(profile.assets).length} assets`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(profile.id, e)}
                  className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
