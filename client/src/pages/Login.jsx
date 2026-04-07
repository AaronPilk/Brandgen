import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { login, register } from '../services/api';

export default function Login() {
  const { setAuth } = useStore();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await login(email, password)
        : await register(email, password, name);
      setAuth(res.user, res.token);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-purple/[0.03] dark:bg-brand-purple/[0.06] rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-content-primary mb-1">
            Brand<span className="text-brand-purple">Gen</span>
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glossy-badge text-[11px] font-medium text-brand-purple">
            <Sparkles className="w-3 h-3" /> AI-Powered Brand & Lead Generation
          </div>
        </div>

        {/* Card */}
        <div className="glossy rounded-3xl p-7">
          <div className="relative z-10">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-surface-raised rounded-2xl mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-surface-card text-content-primary shadow-sm'
                    : 'text-content-muted hover:text-content-secondary'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-surface-card text-content-primary shadow-sm'
                    : 'text-content-muted hover:text-content-secondary'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-[12px] font-medium text-content-secondary mb-1.5">Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="!pl-10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-content-secondary mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="!pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-content-secondary mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="!pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <p className="text-[12px] text-red-500 bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl glossy-btn text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] text-content-muted mt-5">
          Your data is saved and persists across sessions.
        </p>
      </motion.div>
    </div>
  );
}
