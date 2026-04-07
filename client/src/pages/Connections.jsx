import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Check, ExternalLink, Unplug, Loader2,
  Facebook, Instagram, Twitter, Share2, Target, Users,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getOAuthPlatforms, getOAuthConnections, startOAuthConnect, disconnectOAuth } from '../services/api';

const PLATFORM_META = {
  meta: {
    icon: Facebook,
    color: 'bg-blue-500',
    description: 'Facebook Pages, Instagram, Meta Ads',
    features: ['Post to Facebook & Instagram', 'Create Meta ad campaigns', 'Pull audience insights'],
  },
  tiktok: {
    icon: Share2,
    color: 'bg-gray-900 dark:bg-white dark:text-black',
    description: 'TikTok for Business',
    features: ['Post videos', 'Create TikTok ad campaigns', 'Pull trending data'],
  },
  pinterest: {
    icon: Share2,
    color: 'bg-red-600',
    description: 'Pinterest Business',
    features: ['Pull trending pins & topics', 'Create pin campaigns', 'Trend research data'],
  },
  twitter: {
    icon: Twitter,
    color: 'bg-black dark:bg-white dark:text-black',
    description: 'X (Twitter) Account',
    features: ['Post tweets', 'Pull trending topics', 'Social listening data'],
  },
  gohighlevel: {
    icon: Target,
    color: 'bg-green-600',
    description: 'GoHighLevel CRM',
    features: ['Auto-route leads to CRM', 'Trigger follow-up workflows', 'Sync contact data'],
  },
  hubspot: {
    icon: Users,
    color: 'bg-orange-500',
    description: 'HubSpot CRM',
    features: ['Auto-route leads to CRM', 'Sync deals & contacts', 'Trigger email sequences'],
  },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Connections() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sessionId } = useStore();
  const [platforms, setPlatforms] = useState([]);
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([
      getOAuthPlatforms(),
      getOAuthConnections(sessionId),
    ]).then(([plats, conns]) => {
      setPlatforms(plats);
      setConnections(conns);
    }).catch(console.error).finally(() => setLoading(false));

    // Handle OAuth callback messages
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) {
      setToast({ type: 'success', message: `${connected} connected successfully!` });
      // Refresh connections
      getOAuthConnections(sessionId).then(setConnections).catch(() => {});
    }
    if (error) {
      setToast({ type: 'error', message: `Connection failed: ${error}` });
    }
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleConnect = async (platformKey) => {
    setConnecting(platformKey);
    try {
      const { url } = await startOAuthConnect(platformKey, sessionId);
      window.location.href = url;
    } catch (err) {
      setToast({ type: 'error', message: err.message });
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformKey) => {
    try {
      await disconnectOAuth(platformKey, sessionId);
      setConnections((c) => {
        const next = { ...c };
        delete next[platformKey];
        return next;
      });
      setToast({ type: 'success', message: `${platformKey} disconnected` });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const connectedCount = Object.keys(connections).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-elevated-lg ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </motion.div>
      )}

      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-content-muted hover:text-content-primary mb-8 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-title mb-1">Connections</h1>
        <p className="text-content-secondary text-[15px]">
          Connect your accounts. Click connect, authorize, and you're set.
          {connectedCount > 0 && ` ${connectedCount} connected.`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {platforms.map((platform) => {
            const meta = PLATFORM_META[platform.key] || {};
            const Icon = meta.icon || Share2;
            const isConnected = !!connections[platform.key];
            const isConnecting = connecting === platform.key;

            return (
              <motion.div
                key={platform.key}
                variants={item}
                className={`glossy rounded-2xl p-5 transition-all duration-300 ${
                  isConnected ? '!border-green-500/20' : ''
                }`}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl ${meta.color || 'bg-gray-600'} flex items-center justify-center text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-content-primary">{platform.name}</h3>
                          {isConnected && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" /> Connected
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-content-muted mt-0.5">{meta.description}</p>
                      </div>
                    </div>

                    {isConnected ? (
                      <button
                        onClick={() => handleDisconnect(platform.key)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Unplug className="w-3.5 h-3.5" /> Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform.key)}
                        disabled={isConnecting || !platform.configured}
                        className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          platform.configured
                            ? 'glossy-btn text-white'
                            : 'bg-surface-raised text-content-muted cursor-not-allowed'
                        }`}
                      >
                        {isConnecting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5" />
                        )}
                        {platform.configured ? 'Connect' : 'Not configured'}
                      </button>
                    )}
                  </div>

                  {/* Features list */}
                  {meta.features && (
                    <div className="flex flex-wrap gap-2 mt-4 ml-15">
                      {meta.features.map((f) => (
                        <span key={f} className="text-[11px] px-2.5 py-1 rounded-full bg-surface-raised text-content-muted font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {!platform.configured && (
                    <p className="text-[11px] text-content-muted mt-3 ml-15">
                      Add {platform.key.toUpperCase()}_CLIENT_ID and {platform.key.toUpperCase()}_CLIENT_SECRET to your .env file to enable.
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Tracking Pixels Section */}
      <div className="mt-10 mb-4">
        <h2 className="text-lg font-semibold text-content-primary mb-1">Tracking Pixels</h2>
        <p className="text-[13px] text-content-muted">Paste your pixel/tag IDs. These auto-inject into generated landing pages.</p>
      </div>

      <div className="space-y-2.5">
        <PixelInput label="Meta Pixel ID" envKey="META_PIXEL_ID" />
        <PixelInput label="TikTok Pixel ID" envKey="TIKTOK_PIXEL_ID" />
        <PixelInput label="Google Analytics ID" envKey="GOOGLE_ANALYTICS_ID" />
        <PixelInput label="Pinterest Tag ID" envKey="PINTEREST_TAG_ID" />
      </div>

      {/* API Keys Section */}
      <div className="mt-10 mb-4">
        <h2 className="text-lg font-semibold text-content-primary mb-1">API Keys</h2>
        <p className="text-[13px] text-content-muted">These require API keys (no OAuth available). Add to server/.env</p>
      </div>

      <div className="space-y-2.5">
        <ApiKeyStatus label="Anthropic Claude" envKey="ANTHROPIC_API_KEY" required />
        <ApiKeyStatus label="OpenAI DALL-E" envKey="OPENAI_API_KEY" note="Set MOCK_IMAGES=true for placeholders" />
        <ApiKeyStatus label="Printful" envKey="PRINTFUL_API_KEY" />
      </div>
    </motion.div>
  );
}

function PixelInput({ label, envKey }) {
  return (
    <div className="glossy rounded-2xl p-4">
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-medium text-content-primary">{label}</p>
          <p className="text-[11px] text-content-muted mt-0.5">Set in server/.env as {envKey}</p>
        </div>
        <code className="text-[11px] text-content-muted bg-surface-raised px-2 py-1 rounded-lg font-mono">{envKey}</code>
      </div>
    </div>
  );
}

function ApiKeyStatus({ label, envKey, required, note }) {
  return (
    <div className="glossy rounded-2xl p-4">
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium text-content-primary">{label}</p>
            {required && (
              <span className="text-[10px] px-1.5 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full font-semibold">Required</span>
            )}
          </div>
          {note && <p className="text-[11px] text-content-muted mt-0.5">{note}</p>}
        </div>
        <code className="text-[11px] text-content-muted bg-surface-raised px-2 py-1 rounded-lg font-mono">{envKey}</code>
      </div>
    </div>
  );
}
