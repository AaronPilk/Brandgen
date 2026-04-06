import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getApiStatus } from '../services/api';

const API_LIST = [
  {
    key: 'anthropic',
    name: 'Anthropic Claude API',
    description: 'Required for all AI-powered features',
    envVar: 'ANTHROPIC_API_KEY',
    required: true,
  },
  {
    key: 'dalle',
    name: 'DALL-E 3 (OpenAI)',
    description: 'Logo concepts, product mockups, and ad visuals',
    envVar: 'OPENAI_API_KEY',
    note: 'Set MOCK_IMAGES=true to use placeholders instead',
  },
  {
    key: 'printful',
    name: 'Printful',
    description: 'Fulfillment for t-shirt and merch brands',
    envVar: 'PRINTFUL_API_KEY',
  },
  {
    key: 'pinterest',
    name: 'Pinterest API',
    description: 'Trend research and discovery',
    envVar: 'PINTEREST_API_KEY',
  },
  {
    key: 'twitter',
    name: 'Twitter/X API',
    description: 'Trend research and social listening',
    envVar: 'TWITTER_API_KEY',
  },
  {
    key: 'goHighLevel',
    name: 'GoHighLevel',
    description: 'CRM integration for lead routing',
    envVar: 'GOHIGHLEVEL_API_KEY',
    note: 'Stub — full integration coming soon',
  },
  {
    key: 'hubspot',
    name: 'HubSpot',
    description: 'CRM integration for lead management',
    envVar: 'HUBSPOT_API_KEY',
    note: 'Stub — full integration coming soon',
  },
  {
    key: 'metaPixel',
    name: 'Meta Pixel',
    description: 'Auto-injected into generated landing pages',
    envVar: 'META_PIXEL_ID',
  },
  {
    key: 'tiktokPixel',
    name: 'TikTok Pixel',
    description: 'Auto-injected into generated landing pages',
    envVar: 'TIKTOK_PIXEL_ID',
  },
  {
    key: 'googleAnalytics',
    name: 'Google Analytics',
    description: 'Auto-injected into generated landing pages',
    envVar: 'GOOGLE_ANALYTICS_ID',
  },
  {
    key: 'pinterestTag',
    name: 'Pinterest Tag',
    description: 'Auto-injected into generated landing pages',
    envVar: 'PINTEREST_TAG_ID',
  },
];

export default function ApiSettings() {
  const navigate = useNavigate();
  const { apiStatus, setApiStatus } = useStore();

  useEffect(() => {
    getApiStatus().then(setApiStatus).catch(console.error);
  }, []);

  const connected = apiStatus
    ? API_LIST.filter((a) => apiStatus[a.key]).length
    : 0;
  const total = API_LIST.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-content-secondary hover:text-content-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-bold mb-2">API Configuration</h1>
      <p className="text-content-secondary mb-6">
        {connected}/{total} APIs connected. The system works end-to-end with only the Anthropic API key. Add others to unlock more features.
      </p>

      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-content-secondary">Connection status</span>
          <div className="flex gap-1">
            {API_LIST.map((api) => (
              <div
                key={api.key}
                className={`w-2 h-2 rounded-full ${
                  apiStatus?.[api.key] ? 'bg-green-500' : 'bg-gray-700'
                }`}
                title={api.name}
              />
            ))}
          </div>
        </div>
      </div>

      {apiStatus?.mockImages && (
        <div className="mb-6 p-4 bg-brand-purple/5 border border-brand-purple/20 rounded-xl">
          <p className="text-sm text-brand-purple-light">
            Mock Image Mode is ON — DALL-E calls will show placeholder boxes instead of generating images. Set <code className="bg-surface-bg px-1 rounded">MOCK_IMAGES=false</code> and add your OpenAI key to enable real image generation.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {API_LIST.map((api) => {
          const isConnected = apiStatus?.[api.key];
          return (
            <div
              key={api.key}
              className={`p-4 rounded-xl border transition-all ${
                isConnected
                  ? 'border-green-800/50 bg-green-900/5'
                  : 'border-surface-border bg-surface-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isConnected
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-surface-raised text-content-muted'
                    }`}
                  >
                    {isConnected ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{api.name}</p>
                      {api.required && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-brand-purple/20 text-brand-purple rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-content-muted">{api.description}</p>
                  </div>
                </div>
                <code className="text-xs text-content-muted bg-surface-bg px-2 py-1 rounded hidden md:block">
                  {api.envVar}
                </code>
              </div>
              {api.note && !isConnected && (
                <p className="text-xs text-content-muted mt-2 ml-11">{api.note}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-surface-raised rounded-xl border border-surface-border">
        <h3 className="text-sm font-semibold mb-2">How to connect APIs</h3>
        <p className="text-xs text-content-secondary leading-relaxed">
          Add your API keys to the <code className="bg-surface-bg px-1 rounded">.env</code> file in the server
          directory, then restart the server. Copy <code className="bg-surface-bg px-1 rounded">.env.example</code> to
          get started. All APIs are optional except Anthropic — skip any and come back later.
        </p>
      </div>
    </motion.div>
  );
}
