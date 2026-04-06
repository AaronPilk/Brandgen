import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getApiStatus } from '../services/api';

const API_LIST = [
  { key: 'anthropic', name: 'Anthropic Claude', description: 'All AI-powered features', envVar: 'ANTHROPIC_API_KEY', required: true },
  { key: 'dalle', name: 'DALL-E 3', description: 'Logo, mockup, and ad image generation', envVar: 'OPENAI_API_KEY', note: 'Set MOCK_IMAGES=true for placeholders' },
  { key: 'printful', name: 'Printful', description: 'T-shirt and merch fulfillment', envVar: 'PRINTFUL_API_KEY' },
  { key: 'pinterest', name: 'Pinterest API', description: 'Trend research and discovery', envVar: 'PINTEREST_API_KEY' },
  { key: 'twitter', name: 'Twitter/X API', description: 'Trend research and social listening', envVar: 'TWITTER_API_KEY' },
  { key: 'goHighLevel', name: 'GoHighLevel', description: 'CRM integration', envVar: 'GOHIGHLEVEL_API_KEY', note: 'Coming soon' },
  { key: 'hubspot', name: 'HubSpot', description: 'CRM integration', envVar: 'HUBSPOT_API_KEY', note: 'Coming soon' },
  { key: 'metaPixel', name: 'Meta Pixel', description: 'Auto-injected into landing pages', envVar: 'META_PIXEL_ID' },
  { key: 'tiktokPixel', name: 'TikTok Pixel', description: 'Auto-injected into landing pages', envVar: 'TIKTOK_PIXEL_ID' },
  { key: 'googleAnalytics', name: 'Google Analytics', description: 'Auto-injected into landing pages', envVar: 'GOOGLE_ANALYTICS_ID' },
  { key: 'pinterestTag', name: 'Pinterest Tag', description: 'Auto-injected into landing pages', envVar: 'PINTEREST_TAG_ID' },
];

export default function ApiSettings() {
  const navigate = useNavigate();
  const { apiStatus, setApiStatus } = useStore();

  useEffect(() => { getApiStatus().then(setApiStatus).catch(console.error); }, []);

  const connected = apiStatus ? API_LIST.filter((a) => apiStatus[a.key]).length : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-content-muted hover:text-content-primary mb-8 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-title mb-1">API Configuration</h1>
      <p className="text-content-secondary text-[15px] mb-8">
        {connected}/{API_LIST.length} connected. Only Anthropic is required — add others anytime.
      </p>

      {/* Status bar */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-5 shadow-glass">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-content-secondary">Connection overview</span>
          <div className="flex gap-1">
            {API_LIST.map((api) => (
              <div key={api.key} className={`w-2 h-2 rounded-full transition-colors ${apiStatus?.[api.key] ? 'bg-green-500' : 'bg-surface-border'}`} title={api.name} />
            ))}
          </div>
        </div>
      </div>

      {apiStatus?.mockImages && (
        <div className="mb-5 p-4 bg-brand-purple/5 border border-brand-purple/10 rounded-2xl">
          <p className="text-[13px] text-brand-purple">
            Mock Image Mode is ON — images show as placeholders. Set <code className="bg-surface-raised px-1.5 py-0.5 rounded-lg text-[12px]">MOCK_IMAGES=false</code> to enable DALL-E.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {API_LIST.map((api) => {
          const isConnected = apiStatus?.[api.key];
          return (
            <div key={api.key} className={`p-4 rounded-2xl border transition-all duration-300 ${
              isConnected ? 'bg-green-500/5 border-green-500/15' : 'bg-surface-card border-surface-border'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isConnected ? 'bg-green-500/10 text-green-500' : 'bg-surface-raised text-content-muted'
                  }`}>
                    {isConnected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium text-content-primary">{api.name}</p>
                      {api.required && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full font-semibold">Required</span>
                      )}
                    </div>
                    <p className="text-[12px] text-content-muted">{api.description}</p>
                  </div>
                </div>
                <code className="text-[11px] text-content-muted bg-surface-raised px-2 py-1 rounded-lg hidden md:block font-mono">{api.envVar}</code>
              </div>
              {api.note && !isConnected && (
                <p className="text-[11px] text-content-muted mt-2 ml-11">{api.note}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-5 bg-surface-card rounded-2xl border border-surface-border shadow-glass">
        <h3 className="text-[14px] font-semibold mb-2 text-content-primary">How to connect</h3>
        <p className="text-[13px] text-content-secondary leading-relaxed">
          Add your keys to <code className="bg-surface-raised px-1.5 py-0.5 rounded-lg text-[12px]">server/.env</code> and restart.
          Copy <code className="bg-surface-raised px-1.5 py-0.5 rounded-lg text-[12px]">.env.example</code> to get started. All APIs except Anthropic are optional.
        </p>
      </div>
    </motion.div>
  );
}
