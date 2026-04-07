import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Globe, Image, Mail, MessageSquare, Palette, ShoppingBag,
  Instagram, Facebook, BarChart3, Megaphone, Link2, AlertTriangle,
  Eye, Zap, Package, ChevronRight, Upload, ExternalLink, Check, Unplug,
  Share2, Target, Users, HardDrive,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getProfile, runAiAction, updateProfile, uploadFiles, getOAuthConnections, startOAuthConnect, disconnectOAuth } from '../services/api';
import ActionButton from '../components/ActionButton';
import AssetViewer from '../components/AssetViewer';
import LoadingOverlay from '../components/LoadingOverlay';

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentProfile, setCurrentProfile, updateProfileAsset,
    addSpend, sessionId, apiStatus, autonomousMode, setAutonomousMode,
  } = useStore();

  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const [inputModal, setInputModal] = useState(null);
  const [connections, setConnections] = useState({});
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const profile = currentProfile;

  useEffect(() => {
    if (!profile || profile.id !== id) {
      getProfile(id).then(setCurrentProfile).catch(() => navigate('/'));
    }
  }, [id]);

  // Load connections for this profile
  useEffect(() => {
    if (id) {
      getOAuthConnections(id).then(setConnections).catch(() => {});
    }
  }, [id]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-shimmer text-content-muted text-sm">Loading profile...</div>
      </div>
    );
  }

  const isLeadGen = profile.mode === 'lead-gen';
  const isBrand = profile.mode === 'build-brand' || profile.mode === 'discover-build' || profile.mode === 'existing-brand';
  const intake = profile.intake || {};
  const assets = profile.assets || {};

  const executeAction = async (actionKey, opts = {}) => {
    setError('');
    setLoadingAction(actionKey);
    try {
      const result = await runAiAction(actionKey, { profile, sessionId, ...opts });
      if (result.cost) addSpend(result.cost);
      updateProfileAsset(actionKey, result);
      await updateProfile(profile.id, { assets: { ...assets, [actionKey]: result } });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoadingAction(null);
    }
  };

  // Actions that need extra input before executing
  const handleActionWithInput = (actionKey, config) => {
    setInputModal({ actionKey, ...config });
  };

  const submitInputModal = async () => {
    if (!inputModal) return;
    const { actionKey, extraData } = inputModal;
    setInputModal(null);
    await executeAction(actionKey, extraData || {});
  };

  const profileLabel = intake.brandName || intake.industry || 'Brand Profile';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Loading Overlay */}
      <LoadingOverlay
        visible={!!loadingAction}
        label={loadingAction ? `Generating ${loadingAction.replace(/-/g, ' ')}...` : ''}
      />

      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-content-muted hover:text-content-primary mb-8 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Profile Header */}
      <div className="glossy rounded-3xl p-6 mb-5">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-title">{profileLabel}</h1>
              <p className="text-content-secondary text-sm mt-1">
                {isLeadGen ? 'Lead Generation' : 'Brand Building'} · {intake.businessType || intake.targetCustomer || intake.geoMarket || ''}
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${
              profile.research
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
            }`}>
              {profile.research ? 'Research Complete' : 'No Research'}
            </span>
          </div>

          {profile.research && (
            <div className="mt-4 pt-4 border-t border-surface-border">
              <button
                onClick={() => {
                  // research might be a string, or an object like { research: "...", usage, cost }
                  let researchData = profile.research;
                  if (researchData && typeof researchData === 'object' && researchData.research) {
                    researchData = researchData.research;
                  }
                  setViewing({ title: 'Market Research', data: researchData, type: 'json' });
                }}
                className="flex items-center gap-1.5 text-sm text-brand-purple hover:text-brand-purple-dark font-medium transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View Research <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Autonomous Mode */}
      <div className="glossy rounded-3xl p-5 mb-5">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-content-primary">Autonomous Mode</p>
                <p className="text-[12px] text-content-muted">Skip confirmations</p>
              </div>
            </div>
            <button
              onClick={() => setAutonomousMode(!autonomousMode)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                autonomousMode ? 'bg-yellow-500' : 'bg-surface-border'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                autonomousMode ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          {autonomousMode && (
            <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-[12px] text-yellow-700 dark:text-yellow-300">
                Actions will execute immediately without cost confirmation.
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2.5">
        <h2 className="text-lg font-semibold mb-3 text-content-primary">Actions</h2>

        {isLeadGen && (
          <>
            <ActionButton skipConfirm icon={Globe} label="Build Landing Page" description="Add reference links, docs & images for best results" actionKey="landing-page" completed={!!assets['landing-page']}
              onExecute={() => handleActionWithInput('landing-page', {
                title: 'Landing Page References',
                subtitle: 'The more reference material you provide, the better the output.',
                fields: [
                  { key: 'referenceLinks', label: 'Landing pages you like (one URL per line)', type: 'textarea', placeholder: 'https://example.com/landing1\nhttps://competitor.com/offer' },
                  { key: 'notes', label: 'What do you want on this page? Any specific sections, copy, or style?', type: 'textarea', placeholder: 'I want a hero section with a bold headline, a benefits section, testimonials, and a form...' },
                  { key: 'files', label: 'Upload reference screenshots, PDFs, or design files', type: 'file' },
                ],
              })}
            />
            <ActionButton skipConfirm icon={Megaphone} label="Create Ad Creatives" description="Add links to ads you like for inspiration" actionKey="ad-creatives" completed={!!assets['ad-creatives']}
              onExecute={() => handleActionWithInput('ad-creatives', {
                title: 'Ad Creative Inspiration',
                subtitle: 'Share ads you like so AI can match the style, tone, and format.',
                fields: [
                  { key: 'inspirationLinks', label: 'Links to ads you like (Facebook Ad Library, TikTok, etc.)', type: 'textarea', placeholder: 'https://www.facebook.com/ads/library/?id=...\nhttps://tiktok.com/@brand/video/...' },
                  { key: 'adNotes', label: 'What angles or hooks do you want? Any specific offers to highlight?', type: 'textarea', placeholder: 'Focus on pain points, use urgency, highlight free consultation offer...' },
                  { key: 'files', label: 'Upload screenshot examples of ads you like', type: 'file' },
                ],
              })}
            />
            <ActionButton icon={Mail} label="Build Email Sequences" description="Industry-specific 5-email nurture sequence" actionKey="email-sequences" completed={!!assets['email-sequences']} onExecute={() => executeAction('email-sequences')} />
            <ActionButton icon={MessageSquare} label="Build SMS Sequences" description="5-message SMS follow-up sequence" actionKey="sms-sequences" completed={!!assets['sms-sequences']} onExecute={() => executeAction('sms-sequences')} />
          </>
        )}

        {isBrand && (
          <>
            <ActionButton icon={Palette} label="Generate Logo Concepts" description="3 distinct logo variations" actionKey="logo-concepts" completed={!!assets['logo-concepts']} onExecute={() => executeAction('logo-concepts')} />
            <ActionButton skipConfirm icon={Globe} label="Build Website" description="Add reference sites, docs & images for best results" actionKey="landing-page" completed={!!assets['landing-page']}
              onExecute={() => handleActionWithInput('landing-page', {
                title: 'Website References',
                subtitle: 'The more reference material you provide, the better the output.',
                fields: [
                  { key: 'referenceLinks', label: 'Websites you like (one URL per line)', type: 'textarea', placeholder: 'https://example.com\nhttps://competitor.com' },
                  { key: 'notes', label: 'What do you want on this site? Specific sections, copy, or style?', type: 'textarea', placeholder: 'I want a hero section, product showcase, about section, and contact form...' },
                  { key: 'files', label: 'Upload reference screenshots, PDFs, or design files', type: 'file' },
                ],
              })}
            />
            <ActionButton icon={Image} label="Create Product Mockups" description="T-shirts, packaging, lifestyle shots" actionKey="product-mockups" completed={!!assets['product-mockups']} onExecute={() => executeAction('product-mockups')} />
            <ActionButton skipConfirm icon={Megaphone} label="Create 10 Ad Creatives" description="Add links to ads you like for inspiration" actionKey="ad-creatives" completed={!!assets['ad-creatives']}
              onExecute={() => handleActionWithInput('ad-creatives', {
                title: 'Ad Creative Inspiration',
                subtitle: 'Share ads you like so AI can match the style, tone, and format.',
                fields: [
                  { key: 'inspirationLinks', label: 'Links to ads you like (Facebook Ad Library, TikTok, etc.)', type: 'textarea', placeholder: 'https://www.facebook.com/ads/library/?id=...\nhttps://tiktok.com/@brand/video/...' },
                  { key: 'adNotes', label: 'What angles or hooks do you want? Specific offers to highlight?', type: 'textarea', placeholder: 'Focus on pain points, use urgency, highlight free consultation offer...' },
                  { key: 'files', label: 'Upload screenshot examples of ads you like', type: 'file' },
                ],
              })}
            />
            <ActionButton icon={Instagram} label="Set Up Instagram" description="Profile setup with content strategy" actionKey="social-instagram" completed={!!assets['social-instagram']} onExecute={() => executeAction('social-setup', { platform: 'Instagram' })} />
            <ActionButton icon={Facebook} label="Set Up Facebook Page" description="Business page with content plan" actionKey="social-facebook" completed={!!assets['social-facebook']} onExecute={() => executeAction('social-setup', { platform: 'Facebook' })} />
          </>
        )}
      </div>

      {/* Connected Accounts */}
      <ProfileConnections
        profileId={id}
        connections={connections}
        setConnections={setConnections}
        connectingPlatform={connectingPlatform}
        setConnectingPlatform={setConnectingPlatform}
      />

      {/* Generated Assets */}
      {Object.keys(assets).length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4 text-content-primary">Generated Assets</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(assets).map(([key, data]) => (
              <motion.button
                key={key}
                whileHover={{ y: -2 }}
                onClick={() => {
                  const type = key === 'landing-page' ? 'html' : key === 'logo-concepts' || key === 'product-mockups' ? 'images' : 'json';
                  const displayData = type === 'html' ? data.html : type === 'images' ? data.concepts || data.mockups : data;
                  setViewing({ title: key.replace(/-/g, ' '), data: displayData, type });
                }}
                className="glossy p-4 rounded-2xl hover:shadow-elevated-lg transition-all duration-300 text-left"
              >
                <div className="relative z-10">
                  <p className="text-[13px] font-semibold capitalize text-content-primary">{key.replace(/-/g, ' ')}</p>
                  <p className="text-[11px] text-content-muted mt-1">Click to view</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {viewing && <AssetViewer title={viewing.title} data={viewing.data} type={viewing.type} onClose={() => setViewing(null)} />}

      {/* Input Modal for actions that need extra data */}
      <InputModal
        config={inputModal}
        onClose={() => setInputModal(null)}
        onSubmit={async (extraData) => {
          const actionKey = inputModal.actionKey;
          setInputModal(null);
          await executeAction(actionKey, { extraData });
        }}
      />
    </motion.div>
  );
}

function InputModal({ config, onClose, onSubmit }) {
  const [values, setValues] = useState({});
  const [files, setFiles] = useState([]);

  useEffect(() => {
    setValues({});
    setFiles([]);
  }, [config]);

  if (!config) return null;

  const handleSubmit = async () => {
    let uploadedFiles = [];
    if (files.length > 0) {
      try {
        const result = await uploadFiles(files);
        uploadedFiles = result.files;
      } catch {}
    }
    onSubmit({ ...values, uploadedFiles });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative glossy rounded-3xl p-6 max-w-lg w-full shadow-elevated-lg"
      >
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-content-primary mb-1">{config.title}</h3>
          <p className="text-[13px] text-content-secondary mb-5">
            {config.subtitle || 'Add references for better results. You can skip any field.'}
          </p>

          <div className="space-y-4">
            {config.fields?.map((field) => (
              <div key={field.key}>
                <label className="block text-[13px] font-medium text-content-secondary mb-2">{field.label}</label>
                {field.type === 'textarea' && (
                  <textarea
                    rows={3}
                    value={values[field.key] || ''}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                )}
                {field.type === 'file' && (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-surface-border rounded-2xl cursor-pointer hover:border-brand-purple/30 transition-all">
                    <Upload className="w-5 h-5 text-content-muted mb-1.5" />
                    <span className="text-[12px] text-content-secondary">
                      {files.length > 0 ? `${files.length} file(s)` : 'Click to upload'}
                    </span>
                    <input type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))} />
                  </label>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary hover:text-content-primary text-sm font-medium transition-colors">
              Skip
            </button>
            <button onClick={handleSubmit} className="flex-1 py-3 rounded-2xl glossy-btn text-white text-sm font-semibold transition-all">
              Continue & Generate
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const PROFILE_PLATFORMS = [
  { key: 'meta', icon: Facebook, color: 'bg-blue-500', name: 'Facebook & Instagram', desc: 'Pages, Instagram, Meta Ads' },
  { key: 'tiktok', icon: Share2, color: 'bg-gray-900 dark:bg-white dark:text-black', name: 'TikTok', desc: 'TikTok for Business' },
  { key: 'pinterest', icon: Share2, color: 'bg-red-600', name: 'Pinterest', desc: 'Pinterest Business' },
  { key: 'twitter', icon: Share2, color: 'bg-black dark:bg-white dark:text-black', name: 'X (Twitter)', desc: 'Social account' },
  { key: 'google', icon: HardDrive, color: 'bg-blue-600', name: 'Google Drive', desc: 'Pull docs, sheets & files' },
  { key: 'gohighlevel', icon: Target, color: 'bg-green-600', name: 'GoHighLevel', desc: 'CRM for lead routing' },
  { key: 'hubspot', icon: Users, color: 'bg-orange-500', name: 'HubSpot', desc: 'CRM for contacts & deals' },
  { key: 'canva', icon: Palette, color: 'bg-cyan-500', name: 'Canva', desc: 'Design assets & templates' },
  { key: 'printful', icon: Package, color: 'bg-violet-600', name: 'Printful', desc: 'T-shirt & merch fulfillment' },
  { key: 'shopify', icon: ShoppingBag, color: 'bg-green-500', name: 'Shopify', desc: 'Products, store & themes' },
  { key: 'wordpress', icon: Globe, color: 'bg-blue-800', name: 'WordPress', desc: 'Publish pages & content' },
];

function ProfileConnections({ profileId, connections, setConnections, connectingPlatform, setConnectingPlatform }) {
  const connectedCount = Object.keys(connections).length;

  const handleConnect = async (platformKey) => {
    setConnectingPlatform(platformKey);
    try {
      const { url } = await startOAuthConnect(platformKey, profileId);
      window.location.href = url;
    } catch (err) {
      alert(err.message);
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (platformKey) => {
    try {
      await disconnectOAuth(platformKey, profileId);
      setConnections((c) => {
        const next = { ...c };
        delete next[platformKey];
        return next;
      });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="mt-10 mb-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-content-primary">Connected Accounts</h2>
        {connectedCount > 0 && (
          <span className="text-[11px] font-semibold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
            {connectedCount} connected
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {PROFILE_PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const isConnected = !!connections[platform.key];
          const isConnecting = connectingPlatform === platform.key;

          return (
            <div
              key={platform.key}
              className={`glossy rounded-2xl p-4 transition-all duration-300 ${
                isConnected ? '!border-green-500/20' : ''
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center text-white shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-content-primary truncate">{platform.name}</p>
                    <p className="text-[10px] text-content-muted">{platform.desc}</p>
                  </div>
                </div>

                {isConnected ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-green-500">
                      <Check className="w-3 h-3" /> Connected
                    </span>
                    <button
                      onClick={() => handleDisconnect(platform.key)}
                      className="text-[10px] text-red-400 hover:text-red-500 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.key)}
                    disabled={isConnecting}
                    className="w-full py-2 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 bg-surface-raised hover:bg-brand-purple/10 hover:text-brand-purple text-content-secondary transition-all"
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

      {/* Tracking Pixels */}
      <div className="mt-6">
        <h3 className="text-[14px] font-semibold text-content-primary mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-purple" />
          Tracking Pixels
          <span className="text-[11px] text-content-muted font-normal">Auto-injected into generated pages</span>
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Meta Pixel', env: 'META_PIXEL_ID' },
            { label: 'TikTok Pixel', env: 'TIKTOK_PIXEL_ID' },
            { label: 'Google Analytics', env: 'GOOGLE_ANALYTICS_ID' },
            { label: 'Pinterest Tag', env: 'PINTEREST_TAG_ID' },
          ].map((pixel) => (
            <div key={pixel.env} className="glossy rounded-xl p-3">
              <div className="relative z-10">
                <p className="text-[12px] font-medium text-content-primary">{pixel.label}</p>
                <p className="text-[10px] text-content-muted">Set {pixel.env} in .env</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
