import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Check, ExternalLink, Unplug, Loader2,
  Facebook, Instagram, Twitter, Share2, Target, Users, HardDrive,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getOAuthPlatforms, getOAuthConnections, startOAuthConnect, disconnectOAuth, getApiStatus } from '../services/api';
import { BRAND_INTEGRATIONS, BRAND_GROUPS } from '../data/integrations';

const LOGO_C = {
  meta: '1877F2', tiktok: '000', pinterest: 'E60023', twitter: '000', youtube: 'FF0000', linkedinAds: '0A66C2',
  gohighlevel: '28A745', hubspot: 'FF7A59', klaviyo: '000', mailchimp: 'FFE01B', activecampaign: '356AE6', twilio: 'F22F46',
  shopify: '96BF48', wordpress: '21759B', webflow: '4353FF', woocommerce: '96588A', stripe: '635BFF', printful: '28323C',
  google: '4285F4', canva: '00C4CC', notion: '000', airtable: '18BFFF', zoominfo: '6B3FA0',
  arcads: 'FF2D55', heygen: '7C3AED', synthesia: '0070F3', creatify: 'FF6B2B', captions: '000', kinsta: '5333ED',
};
const LOGO_L = {
  meta: 'f', tiktok: '♪', pinterest: 'P', twitter: '𝕏', youtube: '▶', linkedinAds: 'in',
  gohighlevel: 'G', hubspot: 'H', klaviyo: 'K', mailchimp: 'M', activecampaign: 'A', twilio: 'T',
  shopify: 'S', wordpress: 'W', webflow: 'W', woocommerce: 'W', stripe: 'S', printful: 'P',
  google: 'G', canva: 'C', notion: 'N', airtable: 'A', zoominfo: 'Z',
  arcads: 'A', heygen: 'H', synthesia: 'S', creatify: 'C', captions: 'C', kinsta: 'K',
};

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
  google: {
    icon: HardDrive,
    color: 'bg-blue-600',
    description: 'Google Drive',
    features: ['Pull client docs & sheets', 'Import brand assets', 'Sync research files'],
  },
  canva: {
    icon: Share2,
    color: 'bg-cyan-500',
    description: 'Canva',
    features: ['Import design assets', 'Export to Canva', 'Pull brand templates'],
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
  shopify: {
    icon: Share2,
    color: 'bg-green-500',
    description: 'Shopify Store',
    features: ['Push products to store', 'Deploy landing pages', 'Manage themes & content'],
  },
  wordpress: {
    icon: HardDrive,
    color: 'bg-blue-800',
    description: 'WordPress Site',
    features: ['Publish landing pages', 'Push blog content', 'Manage site pages'],
  },
  arcads: {
    icon: Share2,
    color: 'bg-pink-600',
    description: 'Arcads AI',
    features: ['Generate UGC-style videos', 'AI avatar ad creatives', 'TikTok & Reels content'],
  },
  kinsta: {
    icon: HardDrive,
    color: 'bg-indigo-600',
    description: 'Kinsta Hosting',
    features: ['Deploy landing pages live', 'Manage site environments', 'Custom domains & SSL'],
  },
  zoominfo: {
    icon: Share2,
    color: 'bg-blue-700',
    description: 'ZoomInfo',
    features: ['Lead enrichment', 'Company data & intent signals', 'Contact discovery'],
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
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    getApiStatus().then(setApiStatus).catch(() => {});
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
        <div>
          {BRAND_GROUPS.map((group) => {
            const items = BRAND_INTEGRATIONS.filter((i) => i.group === group);
            return (
              <div key={group} className="mb-5">
                <h3 className="text-[11px] font-semibold text-content-muted uppercase tracking-wider mb-2">{group}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {items.map((int) => {
                    const isConnected = !!connections[int.key];
                    const isConnecting = connecting === int.key;
                    const platformData = platforms.find((p) => p.key === int.key);
                    const isConfigured = platformData?.configured;

                    return (
                      <div key={int.key} className={`glossy rounded-2xl p-3.5 transition-all ${isConnected ? '!border-green-500/20' : ''}`}>
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${int.logo ? '#' : ''}${(LOGO_C[int.key] || '8B5CF6')}18` }}>
                              <span className="font-bold text-[11px]" style={{ color: `#${LOGO_C[int.key] || '8B5CF6'}` }}>{LOGO_L[int.key] || int.name[0]}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-content-primary truncate">{int.name}</p>
                              <p className="text-[10px] text-content-muted">{int.authType === 'oauth' ? 'OAuth' : 'API Key'}</p>
                            </div>
                          </div>
                          {isConnected ? (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><Check className="w-3 h-3" />Connected</span>
                              <button onClick={() => handleDisconnect(int.key)} className="text-[10px] text-red-400 hover:text-red-500 transition-colors">Disconnect</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleConnect(int.key)}
                              disabled={isConnecting}
                              className="w-full py-2 rounded-xl text-[11px] font-semibold bg-surface-raised hover:bg-brand-purple/10 hover:text-brand-purple text-content-secondary transition-all flex items-center justify-center gap-1.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {isConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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
        <ApiKeyStatus label="Anthropic Claude (AI)" envKey="ANTHROPIC_API_KEY" connected={apiStatus?.anthropic} required />
        <ApiKeyStatus label="OpenAI / DALL-E 3 (Images)" envKey="OPENAI_API_KEY" connected={apiStatus?.dalle} note={apiStatus?.mockImages ? 'Mock mode ON — using placeholders' : undefined} />
        <ApiKeyStatus label="Printful (Fulfillment)" envKey="PRINTFUL_API_KEY" connected={apiStatus?.printful} />
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

function ApiKeyStatus({ label, envKey, required, note, connected }) {
  return (
    <div className={`glossy rounded-2xl p-4 ${connected ? '!border-green-500/20' : ''}`}>
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            connected ? 'bg-green-500/10 text-green-500' : 'bg-surface-raised text-content-muted'
          }`}>
            {connected ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-content-muted" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-medium text-content-primary">{label}</p>
              {required && (
                <span className="text-[10px] px-1.5 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full font-semibold">Required</span>
              )}
              {connected && (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded-full font-semibold">Connected</span>
              )}
            </div>
            {note && <p className="text-[11px] text-content-muted mt-0.5">{note}</p>}
            {!connected && <p className="text-[11px] text-content-muted mt-0.5">Add {envKey} to server/.env</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
