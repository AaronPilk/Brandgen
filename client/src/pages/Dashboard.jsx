import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Globe, Image, Mail, MessageSquare, Palette, ShoppingBag,
  Instagram, Facebook, BarChart3, Megaphone, Link2, AlertTriangle,
  Eye, Zap, Package, ChevronRight, Upload, ExternalLink, Check, Unplug, Edit3, X, DollarSign,
  Share2, Target, Users, HardDrive, Loader2, Video, Server, Search, UserPlus, Calendar,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { BRAND_INTEGRATIONS, BRAND_GROUPS, TOP_BRAND_INTEGRATIONS } from '../data/integrations';
import { getProfile, runAiAction, updateProfile, uploadFiles, getOAuthConnections, startOAuthConnect, disconnectOAuth, prepareMetaCampaign, getMetaAdsStatus, createClientInvite, getAgentActions, approveAgentAction, rejectAgentAction, executeAgentAction, getAgentContext } from '../services/api';
import ActionButton from '../components/ActionButton';
import AssetViewer from '../components/AssetViewer';
import LoadingOverlay from '../components/LoadingOverlay';
import ApprovalQueue from '../components/ApprovalQueue';
import ActivityFeed from '../components/ActivityFeed';
import BrandOverview from '../components/BrandOverview';

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [metaAdsConfigured, setMetaAdsConfigured] = useState(false);
  const [metaCampaignModal, setMetaCampaignModal] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [inviteClientOpen, setInviteClientOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const profile = currentProfile;

  useEffect(() => {
    if (!profile || profile.id !== id) {
      getProfile(id).then(setCurrentProfile).catch(() => navigate('/'));
    }
  }, [id]);

  // Load connections for this profile + handle OAuth callback
  useEffect(() => {
    if (id) {
      getOAuthConnections(id).then(setConnections).catch(() => {});
      // Reload profile after OAuth callback to get fresh connection data
      const connected = searchParams.get('connected');
      if (connected) {
        getProfile(id).then(setCurrentProfile).catch(() => {});
        getOAuthConnections(id).then(setConnections).catch(() => {});
      }
    }
  }, [id, searchParams.get('connected')]);

  // Check if Meta Ads is configured
  useEffect(() => {
    getMetaAdsStatus().then((s) => setMetaAdsConfigured(s.configured)).catch(() => {});
  }, []);

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

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const profileLabel = intake.brandName || intake.industry || 'Brand Profile';

  const handleSaveName = async () => {
    if (nameValue.trim()) {
      const updatedIntake = { ...intake, brandName: nameValue.trim() };
      await updateProfile(profile.id, { intake: updatedIntake });
      setCurrentProfile({ ...profile, intake: updatedIntake });
    }
    setEditingName(false);
  };

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
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="!text-xl !font-bold !py-1 !px-2 !rounded-xl max-w-xs"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="p-1.5 rounded-lg bg-surface-raised text-content-muted hover:text-content-primary transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-title">{profileLabel}</h1>
                  <button
                    onClick={() => { setNameValue(profileLabel); setEditingName(true); }}
                    className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-raised opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 mt-1">
                <p className="text-content-secondary text-sm">
                  {isLeadGen ? 'Lead Generation' : 'Brand Building'} · {intake.businessType || intake.targetCustomer || intake.geoMarket || ''}
                </p>
                <button
                  onClick={() => navigate(`/crm/${id}`)}
                  className="text-[12px] font-semibold text-brand-purple bg-brand-purple/10 px-3 py-1 rounded-full hover:bg-brand-purple/20 transition-colors flex items-center gap-1"
                >
                  <Users className="w-3 h-3" /> CRM
                </button>
                <button
                  onClick={() => navigate(`/calendar/${id}`)}
                  className="text-[12px] font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3" /> Calendar
                </button>
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="text-[12px] font-semibold text-content-muted bg-surface-raised px-3 py-1 rounded-full hover:text-content-primary transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit Profile
                </button>
                <button
                  onClick={() => setInviteClientOpen(true)}
                  className="text-[12px] font-semibold text-content-muted bg-surface-raised px-3 py-1 rounded-full hover:text-content-primary transition-colors flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" /> Invite Client
                </button>
              </div>
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


      {/* ─── Row 1: Performance + Agents side by side ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
        <div className="lg:col-span-3">
          <BrandOverview profileId={id} />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-content-primary mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-purple" /> Agents
          </h2>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { name: 'Sales', key: 'sales_agent', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/40', glow: 'shadow-green-500/20', active: true },
              { name: 'Campaign', key: 'campaign_agent', icon: Megaphone, color: 'text-blue-500', bg: 'bg-blue-500/10', active: false },
              { name: 'Creative', key: 'creative_agent', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-500/10', active: false },
              { name: 'Analytics', key: 'analytics_agent', icon: BarChart3, color: 'text-brand-purple', bg: 'bg-brand-purple/10', active: false },
              { name: 'Social Media', key: 'social_media_agent', icon: Share2, color: 'text-orange-500', bg: 'bg-orange-500/10', active: false },
              { name: 'Retention', key: 'retention_agent', icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-500/10', active: false },
            ].map((agent) => {
              const AgentIcon = agent.icon;
              return (
                <button
                  key={agent.name}
                  onClick={() => agent.active && setActiveAgent(agent)}
                  className={`glossy rounded-lg p-2 text-left transition-all ${
                    agent.active
                      ? `opacity-100 cursor-pointer border ${agent.border} shadow-md ${agent.glow} hover:scale-[1.02]`
                      : 'opacity-40 cursor-default border border-transparent'
                  }`}
                >
                  <div className="relative z-10 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md ${agent.bg} flex items-center justify-center`}>
                      <AgentIcon className={`w-3 h-3 ${agent.color}`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-content-primary">{agent.name}</p>
                      {agent.active && <p className="text-[8px] text-green-400 font-medium">Active</p>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Row 2: Connected Accounts (prominent — clients interact here) ─── */}
      <ProfileConnections
        profileId={id}
        connections={connections}
        setConnections={setConnections}
        connectingPlatform={connectingPlatform}
        setConnectingPlatform={setConnectingPlatform}
      />

      {error && (
        <div className="my-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-red-600 dark:text-red-400 text-[12px]">
          {error}
        </div>
      )}

      {/* ─── Row 3: Actions + Assets side by side ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
        <div className="lg:col-span-2">
          <h2 className="text-[13px] font-semibold mb-2 text-content-primary">Generate</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

        {isLeadGen && (
          <>
            <ActionButton skipConfirm icon={Globe} label="Build Landing Page" description="Add reference links, docs & images" actionKey="landing-page" completed={!!assets['landing-page']}
              onExecute={() => handleActionWithInput('landing-page', {
                title: 'Landing Page References',
                subtitle: 'The more reference material you provide, the better the output.',
                fields: [
                  { key: 'referenceLinks', label: 'Landing pages you like (one URL per line)', type: 'textarea', placeholder: 'https://example.com/landing1\nhttps://competitor.com/offer' },
                  { key: 'notes', label: 'What do you want on this page?', type: 'textarea', placeholder: 'Hero section, benefits, testimonials, form...' },
                  { key: 'files', label: 'Upload references', type: 'file' },
                ],
              })}
            />
            <ActionButton skipConfirm icon={Megaphone} label="Create Ad Creatives" description="10 concepts for Meta & TikTok" actionKey="ad-creatives" completed={!!assets['ad-creatives']}
              onExecute={() => handleActionWithInput('ad-creatives', {
                title: 'Ad Creative Inspiration',
                subtitle: 'Share ads you like so AI can match the style.',
                fields: [
                  { key: 'inspirationLinks', label: 'Ads you like (one URL per line)', type: 'textarea', placeholder: 'https://facebook.com/ads/library/...' },
                  { key: 'adNotes', label: 'Angles or hooks?', type: 'textarea', placeholder: 'Pain points, urgency, free consultation...' },
                  { key: 'files', label: 'Upload examples', type: 'file' },
                ],
              })}
            />
            <ActionButton icon={Mail} label="Email Sequences" description="5-email nurture sequence" actionKey="email-sequences" completed={!!assets['email-sequences']} onExecute={() => executeAction('email-sequences')} />
            <ActionButton icon={MessageSquare} label="SMS Sequences" description="5-message follow-up" actionKey="sms-sequences" completed={!!assets['sms-sequences']} onExecute={() => executeAction('sms-sequences')} />
          </>
        )}

        {isBrand && (
          <>
            {/* Only show logo/website generation for NEW brands, not existing ones */}
            {profile.mode !== 'existing-brand' && (
              <>
                <ActionButton icon={Palette} label="Generate Logo Concepts" description="3 distinct logo variations" actionKey="logo-concepts" completed={!!assets['logo-concepts']} onExecute={() => executeAction('logo-concepts')} />
                <ActionButton icon={Image} label="Product Mockups" description="T-shirts, packaging, lifestyle" actionKey="product-mockups" completed={!!assets['product-mockups']} onExecute={() => executeAction('product-mockups')} />
              </>
            )}
            <ActionButton skipConfirm icon={Globe} label="Build Website" description="Add reference sites & docs" actionKey="landing-page" completed={!!assets['landing-page']}
              onExecute={() => handleActionWithInput('landing-page', {
                title: 'Website References',
                subtitle: 'The more reference material, the better.',
                fields: [
                  { key: 'referenceLinks', label: 'Websites you like', type: 'textarea', placeholder: 'https://example.com' },
                  { key: 'notes', label: 'What do you want?', type: 'textarea', placeholder: 'Hero, product showcase, contact form...' },
                  { key: 'files', label: 'Upload references', type: 'file' },
                ],
              })}
            />
            <ActionButton skipConfirm icon={Megaphone} label="Ad Creatives" description="10 concepts for Meta & TikTok" actionKey="ad-creatives" completed={!!assets['ad-creatives']}
              onExecute={() => handleActionWithInput('ad-creatives', {
                title: 'Ad Creative Inspiration',
                subtitle: 'Share ads you like.',
                fields: [
                  { key: 'inspirationLinks', label: 'Ads you like', type: 'textarea', placeholder: 'https://facebook.com/ads/library/...' },
                  { key: 'adNotes', label: 'Angles or hooks?', type: 'textarea', placeholder: 'Pain points, urgency...' },
                  { key: 'files', label: 'Upload examples', type: 'file' },
                ],
              })}
            />
            <ActionButton icon={Mail} label="Email Sequences" description="5-email nurture sequence" actionKey="email-sequences" completed={!!assets['email-sequences']} onExecute={() => executeAction('email-sequences')} />
            <ActionButton icon={MessageSquare} label="SMS Sequences" description="5-message follow-up" actionKey="sms-sequences" completed={!!assets['sms-sequences']} onExecute={() => executeAction('sms-sequences')} />
          </>
        )}
        {metaAdsConfigured && (
          <ActionButton
            skipConfirm icon={Megaphone} label="Prepare Meta Campaign" description="AI designs, you approve"
            actionKey="meta-campaign" onExecute={() => setMetaCampaignModal(true)}
          />
        )}
        <ActionButton
          skipConfirm icon={Share2} label="Create Social Posts" description="Posts for IG, FB, TikTok, X"
          actionKey="social-posts" completed={!!assets['social-posts']}
          onExecute={() => handleActionWithInput('social-posts', {
            title: 'Create Social Media Posts',
            subtitle: 'AI generates platform-optimized posts with captions, hashtags, and visual direction.',
            fields: [
              { key: 'topic', label: 'Topic or theme (optional)', type: 'textarea', placeholder: 'New product launch, seasonal sale, behind the scenes, industry tips...' },
              { key: 'platforms', label: 'Platforms (comma separated)', type: 'textarea', placeholder: 'Instagram, Facebook, TikTok, X' },
              { key: 'tone', label: 'Tone (optional)', type: 'textarea', placeholder: 'Professional, fun, edgy, inspirational...' },
              { key: 'notes', label: 'Additional notes', type: 'textarea', placeholder: 'Include call-to-action, mention specific products, use brand voice...' },
            ],
          })}
        />
          </div>
        </div>

        {/* Assets + Activity */}
        <div className="space-y-4">
          {Object.keys(assets).length > 0 && (
            <div>
              <h2 className="text-[13px] font-semibold mb-2 text-content-primary">Generated Assets</h2>
              <div className="space-y-1.5">
                {Object.entries(assets).map(([key, data]) => (
                  <button key={key}
                    onClick={() => {
                      const type = key === 'landing-page' ? 'html' : key === 'logo-concepts' || key === 'product-mockups' ? 'images' : 'json';
                      const displayData = type === 'html' ? data.html : type === 'images' ? data.concepts || data.mockups : data;
                      setViewing({ title: key.replace(/-/g, ' '), data: displayData, type });
                    }}
                    className="w-full glossy rounded-xl p-2.5 hover:shadow-elevated transition-all text-left"
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <p className="text-[11px] font-semibold capitalize text-content-primary">{key.replace(/-/g, ' ')}</p>
                      <ChevronRight className="w-3 h-3 text-content-muted" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <ActivityFeed profileId={id} />
        </div>
      </div>

      {/* Approval Queue */}
      <ApprovalQueue profileId={id} />

      {/* Modals */}
      {metaCampaignModal && (
        <MetaCampaignModal profile={profile} onClose={() => setMetaCampaignModal(false)} onSubmitted={() => setMetaCampaignModal(false)} />
      )}
      {editProfileOpen && (
        <EditProfileModal profile={profile} onClose={() => setEditProfileOpen(false)}
          onSaved={(updated) => { setCurrentProfile(updated); setEditProfileOpen(false); }} />
      )}
      {inviteClientOpen && (
        <InviteClientModal profileId={id} profileName={profileLabel} onClose={() => setInviteClientOpen(false)} />
      )}

      {viewing && <AssetViewer title={viewing.title} data={viewing.data} type={viewing.type} onClose={() => setViewing(null)} />}

      {/* Agent Panel */}
      {activeAgent && (
        <AgentPanel
          agent={activeAgent}
          profileId={id}
          onClose={() => setActiveAgent(null)}
        />
      )}

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
                    <input type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.svg,.doc,.docx,.xlsx,.pptx,.csv,.txt" onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 20))} />
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

function ProfileConnections({ profileId, connections, setConnections, connectingPlatform, setConnectingPlatform }) {
  const [expanded, setExpanded] = useState(false);
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
      setConnections((c) => { const next = { ...c }; delete next[platformKey]; return next; });
    } catch (err) { alert(err.message); }
  };

  // Show top-priority items by default, full list when expanded
  const visibleItems = expanded ? BRAND_INTEGRATIONS : TOP_BRAND_INTEGRATIONS;
  const hiddenCount = BRAND_INTEGRATIONS.length - TOP_BRAND_INTEGRATIONS.length;

  return (
    <div className="mt-8 mb-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-semibold text-content-primary">Connected Accounts</h2>
        <div className="flex items-center gap-2">
          {connectedCount > 0 && (
            <span className="text-[10px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
              {connectedCount} connected
            </span>
          )}
        </div>
      </div>

      {/* Grouped grid when expanded, flat grid when collapsed */}
      {expanded ? (
        <div className="space-y-4">
          {BRAND_GROUPS.map((group) => {
            const items = BRAND_INTEGRATIONS.filter((i) => i.group === group);
            return (
              <div key={group}>
                <p className="text-[10px] font-semibold text-content-muted uppercase tracking-wider mb-1.5">{group}</p>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                  {items.map((platform) => (
                    <ConnectionCard key={platform.key} platform={platform} connections={connections}
                      connectingPlatform={connectingPlatform} onConnect={handleConnect} onDisconnect={handleDisconnect} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
          {visibleItems.map((platform) => (
            <ConnectionCard key={platform.key} platform={platform} connections={connections}
              connectingPlatform={connectingPlatform} onConnect={handleConnect} onDisconnect={handleDisconnect} />
          ))}
        </div>
      )}

      {/* Show more / less */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 w-full py-2 rounded-xl text-[11px] font-medium text-content-muted hover:text-brand-purple hover:bg-brand-purple/5 transition-all flex items-center justify-center gap-1"
      >
        {expanded ? 'Show less' : `See all ${BRAND_INTEGRATIONS.length} integrations (+${hiddenCount} more)`}
      </button>

      {/* Tracking Pixels — clickable to set per-profile */}
      <PixelManager profileId={profileId} connections={connections} setConnections={setConnections} />
    </div>
  );
}

function ConnectionCard({ platform, connections, connectingPlatform, onConnect, onDisconnect }) {
  const isConnected = !!connections[platform.key];
  const isConnecting = connectingPlatform === platform.key;

  return (
    <div className={`glossy rounded-xl p-2.5 transition-all duration-200 ${isConnected ? '!border-green-500/20' : ''}`}>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
            isConnected ? 'bg-green-500/10 text-green-500' : 'bg-surface-raised text-content-muted'
          }`}>
            {isConnected ? <Check className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
          </div>
          <p className="text-[11px] font-semibold text-content-primary truncate">{platform.name}</p>
        </div>
        {isConnected ? (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-green-500 font-semibold">Connected</span>
            <button onClick={() => onDisconnect(platform.key)} className="text-[9px] text-red-400 hover:text-red-500">Disconnect</button>
          </div>
        ) : (
          <button onClick={() => onConnect(platform.key)} disabled={isConnecting}
            className="w-full py-1.5 rounded-lg text-[10px] font-semibold bg-surface-raised hover:bg-brand-purple/10 hover:text-brand-purple text-content-muted transition-all">
            {isConnecting ? '...' : 'Connect'}
          </button>
        )}
      </div>
    </div>
  );
}

const PIXELS = [
  { key: 'metaPixelId', label: 'Meta Pixel', placeholder: 'e.g. 123456789012345' },
  { key: 'tiktokPixelId', label: 'TikTok Pixel', placeholder: 'e.g. CXXXXXXXXXXXXXXXXX' },
  { key: 'googleAnalyticsId', label: 'Google Analytics', placeholder: 'e.g. G-XXXXXXXXXX' },
  { key: 'pinterestTagId', label: 'Pinterest Tag', placeholder: 'e.g. 2612345678901' },
];

function PixelManager({ profileId, connections }) {
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState('');
  const pixelConns = connections?.pixels || {};

  const handleSave = async (pixelKey) => {
    if (!value.trim()) { setEditing(null); return; }
    try {
      await updateProfile(profileId, {
        connections: { ...connections, pixels: { ...pixelConns, [pixelKey]: value.trim() } }
      });
      setEditing(null);
      setValue('');
    } catch {}
  };

  return (
    <div className="mt-3 flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Pixels:</span>
      {PIXELS.map((pixel) => {
        const isSet = !!pixelConns[pixel.key];
        const isEditing = editing === pixel.key;

        if (isEditing) {
          return (
            <div key={pixel.key} className="flex items-center gap-1">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={pixel.placeholder}
                className="!w-48 !py-1 !px-2 !text-[10px] !rounded-lg"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(pixel.key); if (e.key === 'Escape') setEditing(null); }}
              />
              <button onClick={() => handleSave(pixel.key)} className="text-[9px] text-green-500 font-bold">Save</button>
              <button onClick={() => setEditing(null)} className="text-[9px] text-content-muted">Cancel</button>
            </div>
          );
        }

        return (
          <button
            key={pixel.key}
            onClick={() => { setEditing(pixel.key); setValue(pixelConns[pixel.key] || ''); }}
            className={`text-[10px] px-2 py-1 rounded-full transition-all ${
              isSet
                ? 'bg-green-500/10 text-green-500 font-semibold'
                : 'bg-surface-raised text-content-muted hover:text-brand-purple hover:bg-brand-purple/5'
            }`}
          >
            {isSet ? `✓ ${pixel.label}` : `+ ${pixel.label}`}
          </button>
        );
      })}
    </div>
  );
}

function MetaCampaignModal({ profile, onClose, onSubmitted }) {
  const [dailyBudget, setDailyBudget] = useState('20');
  const [objective, setObjective] = useState('OUTCOME_LEADS');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const objectives = [
    { value: 'OUTCOME_LEADS', label: 'Lead Generation' },
    { value: 'OUTCOME_TRAFFIC', label: 'Website Traffic' },
    { value: 'OUTCOME_AWARENESS', label: 'Brand Awareness' },
    { value: 'OUTCOME_SALES', label: 'Sales / Conversions' },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await prepareMetaCampaign({
        profile,
        dailyBudget: parseFloat(dailyBudget) || 20,
        objective,
        notes,
      });
      onSubmitted();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
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
          <h3 className="text-lg font-semibold text-content-primary mb-1">Prepare Meta Ad Campaign</h3>
          <p className="text-[13px] text-content-secondary mb-5">
            AI will design a campaign based on your profile. You'll review and approve before anything goes live.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-content-secondary mb-2">Campaign Objective</label>
              <div className="grid grid-cols-2 gap-2">
                {objectives.map((obj) => (
                  <button
                    key={obj.value}
                    onClick={() => setObjective(obj.value)}
                    className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
                      objective === obj.value
                        ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
                        : 'bg-surface-raised text-content-secondary border border-surface-border'
                    }`}
                  >
                    {obj.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-content-secondary mb-2">Daily Budget ($)</label>
              <input
                type="number"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                placeholder="20"
                min="5"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-content-secondary mb-2">Additional Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific targeting, messaging, or creative direction..."
              />
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-red-500 bg-red-500/10 px-3 py-2 rounded-xl mt-4">{error}</p>
          )}

          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3 mt-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-yellow-700 dark:text-yellow-300">
              Nothing will be sent to Meta until you review and click Approve.
              Campaign will be created in PAUSED state — no spend until you activate.
            </p>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl glossy-btn text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              {loading ? 'AI Designing...' : 'Prepare Campaign'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EditProfileModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    brandName: profile.intake?.brandName || profile.intake?.industry || '',
    industry: profile.intake?.industry || '',
    whatYouSell: profile.intake?.whatYouSell || '',
    targetCustomer: profile.intake?.targetCustomer || '',
    geoTargets: profile.intake?.geoTargets || '',
    websiteUrl: profile.intake?.websiteUrl || '',
    competitorUrls: profile.intake?.competitorUrls || '',
    differentiator: profile.intake?.differentiator || '',
    adBudget: profile.intake?.adBudget || '',
    primaryGoal: profile.intake?.primaryGoal || '',
    metaAdAccountId: profile.connections?.meta_ads?.adAccountId || '',
    instagramAccountId: profile.connections?.instagram?.accountId || '',
  });
  const [saving, setSaving] = useState(false);
  const [rerunResearch, setRerunResearch] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { metaAdAccountId, instagramAccountId, ...intakeFields } = form;
      const updatedIntake = { ...profile.intake, ...intakeFields };

      // Save per-profile connection settings
      const connections = { ...profile.connections };
      if (metaAdAccountId) connections.meta_ads = { ...connections.meta_ads, adAccountId: metaAdAccountId };
      if (instagramAccountId) connections.instagram = { ...connections.instagram, accountId: instagramAccountId };

      await updateProfile(profile.id, { intake: updatedIntake, connections });

      let updatedProfile = { ...profile, intake: updatedIntake, connections };

      if (rerunResearch) {
        const research = await runAiAction('market-research', { profile: updatedProfile, sessionId: 'default' });
        updatedProfile.research = research.research;
        await updateProfile(profile.id, { research: updatedProfile.research });
      }

      onSaved(updatedProfile);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
      <div className="min-h-full flex items-start justify-center px-4 py-10">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glossy rounded-3xl p-6 max-w-lg w-full shadow-elevated-lg">
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-content-primary mb-1">Edit Profile</h3>
            <p className="text-[13px] text-content-muted mb-5">Update company info for this profile</p>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Brand / Company Name</label>
                <input value={form.brandName} onChange={(e) => set('brandName', e.target.value)} /></div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Industry</label>
                <input value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. Insurance, Real Estate" /></div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">What Do You Sell?</label>
                <input value={form.whatYouSell} onChange={(e) => set('whatYouSell', e.target.value)} /></div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Target Customer</label>
                <textarea rows={2} value={form.targetCustomer} onChange={(e) => set('targetCustomer', e.target.value)} /></div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Website URL</label>
                <input value={form.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} placeholder="https://..." /></div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Geographic Targets</label>
                <input value={form.geoTargets} onChange={(e) => set('geoTargets', e.target.value)} /></div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Competitor URLs</label>
                <textarea rows={2} value={form.competitorUrls} onChange={(e) => set('competitorUrls', e.target.value)} placeholder="One per line" /></div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">What Makes You Different</label>
                <textarea rows={2} value={form.differentiator} onChange={(e) => set('differentiator', e.target.value)} /></div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Monthly Ad Budget</label>
                <input value={form.adBudget} onChange={(e) => set('adBudget', e.target.value)} /></div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Primary Goal</label>
                <input value={form.primaryGoal} onChange={(e) => set('primaryGoal', e.target.value)} /></div>
              <div className="pt-2 border-t border-surface-border">
                <p className="text-[12px] font-semibold text-content-primary mb-2">Platform Accounts (per brand)</p>
              </div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Meta Ad Account ID</label>
                <input value={form.metaAdAccountId} onChange={(e) => set('metaAdAccountId', e.target.value)} placeholder="e.g. 1036979485088762" /></div>
              <div><label className="block text-[12px] font-medium text-content-secondary mb-1">Instagram Account ID</label>
                <input value={form.instagramAccountId} onChange={(e) => set('instagramAccountId', e.target.value)} placeholder="Auto-detected or enter manually" /></div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-brand-purple/5 border border-brand-purple/10">
              <label className="flex items-center gap-3 cursor-pointer">
                <button onClick={() => setRerunResearch(!rerunResearch)}
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                    rerunResearch ? 'border-brand-purple bg-brand-purple' : 'border-surface-border'
                  }`}>
                  {rerunResearch && <Check className="w-3 h-3 text-white" />}
                </button>
                <div>
                  <p className="text-[13px] font-medium text-content-primary">Re-run Market Research</p>
                  <p className="text-[11px] text-content-muted">Generate new research based on updated info</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary text-sm font-medium">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-2xl glossy-btn text-white text-sm font-semibold flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? (rerunResearch ? 'Saving & Researching...' : 'Saving...') : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function InviteClientModal({ profileId, profileName, onClose }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [days, setDays] = useState('30');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const data = await createClientInvite({
        email,
        name,
        profileIds: [profileId],
        expiresInDays: parseInt(days) || 30,
      });
      setResult(data);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glossy rounded-3xl p-6 max-w-md w-full shadow-elevated-lg">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-content-primary mb-1">Invite Client</h3>
          <p className="text-[13px] text-content-muted mb-4">
            Send access to <span className="text-content-primary font-medium">{profileName}</span> so they can connect their accounts.
          </p>

          {result ? (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <p className="text-[13px] font-semibold text-green-500 mb-2">Client account created!</p>
                <div className="space-y-1.5 text-[12px]">
                  <p className="text-content-secondary">Email: <span className="text-content-primary font-mono">{result.user?.email}</span></p>
                  <p className="text-content-secondary">Temp Password: <span className="text-content-primary font-mono">{result.tempPassword}</span></p>
                </div>
                <p className="text-[11px] text-content-muted mt-3">Send these credentials to the client. They'll only see this profile and can connect their accounts.</p>
              </div>
              <button onClick={() => {
                navigator.clipboard.writeText(`Login: ${result.user?.email}\nPassword: ${result.tempPassword}\nURL: ${window.location.origin}`);
              }} className="w-full py-2.5 rounded-xl bg-surface-raised text-content-secondary text-[13px] font-medium hover:text-content-primary transition-colors">
                Copy Credentials
              </button>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl glossy-btn text-white text-[13px] font-semibold">Done</button>
            </div>
          ) : (
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Client email" type="email" />
              <div>
                <label className="block text-[12px] font-medium text-content-secondary mb-1">Access expires in</label>
                <select value={days} onChange={(e) => setDays(e.target.value)} className="!text-[13px]">
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                  <option value="">Never expires</option>
                </select>
              </div>
              {error && <p className="text-[12px] text-red-500">{error}</p>}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary text-sm font-medium">Cancel</button>
                <button onClick={handleInvite} disabled={loading || !email} className="flex-1 py-3 rounded-2xl glossy-btn text-white text-sm font-semibold flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {loading ? 'Creating...' : 'Send Invite'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Agent Panel ───
function AgentPanel({ agent, profileId, onClose }) {
  const [tab, setTab] = useState('overview');
  const [actions, setActions] = useState([]);
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [executing, setExecuting] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [pending, approved, executed, rejected, ctx] = await Promise.all([
        getAgentActions(profileId, 'pending').catch(() => []),
        getAgentActions(profileId, 'approved').catch(() => []),
        getAgentActions(profileId, 'executed').catch(() => []),
        getAgentActions(profileId, 'rejected').catch(() => []),
        getAgentContext(profileId, 'brand,crm,calendar').catch(() => null),
      ]);
      setActions([...pending, ...approved, ...executed, ...rejected]);
      setContext(ctx);
      setError('');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleApprove = async (actionId) => {
    setExecuting(actionId);
    try {
      await approveAgentAction(actionId);
      await executeAgentAction(actionId);
      await loadData();
    } catch (err) { setError(err.message); }
    setExecuting(null);
  };

  const handleReject = async (actionId) => {
    setExecuting(actionId);
    try {
      await rejectAgentAction(actionId, 'Rejected by admin');
      await loadData();
    } catch (err) { setError(err.message); }
    setExecuting(null);
  };

  const AgentIcon = agent.icon;
  const pending = actions.filter(a => a.status === 'pending');
  const executed = actions.filter(a => a.status === 'executed');
  const rejected = actions.filter(a => a.status === 'rejected');

  const STATUS_BADGE = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
    approved: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Approved' },
    executed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Executed' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
    auto_approved: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Auto' },
    error: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Error' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-surface-card border border-border-subtle rounded-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${agent.bg} flex items-center justify-center`}>
              <AgentIcon className={`w-5 h-5 ${agent.color}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-primary">{agent.name} Agent</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] text-green-400 font-medium">Connected & Active</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-raised transition-colors">
            <X className="w-4 h-4 text-content-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 pb-2">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'queue', label: `Action Queue (${pending.length})` },
            { key: 'history', label: 'History' },
            { key: 'health', label: 'Health' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                tab === t.key ? 'bg-surface-raised text-content-primary' : 'text-content-muted hover:text-content-secondary'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-surface-raised text-center">
                  <div className="text-lg font-bold text-yellow-400">{pending.length}</div>
                  <div className="text-[10px] text-content-muted">Pending</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-raised text-center">
                  <div className="text-lg font-bold text-green-400">{executed.length}</div>
                  <div className="text-[10px] text-content-muted">Executed</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-raised text-center">
                  <div className="text-lg font-bold text-red-400">{rejected.length}</div>
                  <div className="text-[10px] text-content-muted">Rejected</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-raised text-center">
                  <div className="text-lg font-bold text-content-primary">{actions.length}</div>
                  <div className="text-[10px] text-content-muted">Total</div>
                </div>
              </div>

              {context && (
                <div className="p-4 rounded-xl bg-surface-raised space-y-2">
                  <h3 className="text-[12px] font-semibold text-content-primary">Agent Context</h3>
                  {context.brand && (
                    <div className="text-[11px] text-content-secondary">
                      Brand: <span className="text-content-primary font-medium">{context.brand.name}</span> · {context.brand.mode}
                    </div>
                  )}
                  {context.crm && (
                    <div className="text-[11px] text-content-secondary">
                      CRM: <span className="text-content-primary font-medium">{context.crm.contactStats?.total || 0}</span> contacts · <span className="text-content-primary font-medium">{context.crm.dealStats?.total || 0}</span> deals · Pipeline: <span className="text-green-400 font-medium">${(context.crm.dealStats?.totalValue || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {context.calendar && (
                    <div className="text-[11px] text-content-secondary">
                      Calendar: <span className="text-content-primary font-medium">{context.calendar.stats?.total || 0}</span> posts · <span className="text-blue-400 font-medium">{context.calendar.stats?.scheduled || 0}</span> scheduled
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 rounded-xl bg-surface-raised">
                <h3 className="text-[12px] font-semibold text-content-primary mb-2">Capabilities</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['Lead Scraping', 'Contact Enrichment', 'Lead Qualification', 'Email Sequences', 'Pipeline Analysis', 'Follow-up Automation'].map(cap => (
                    <span key={cap} className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-medium">{cap}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Queue Tab */}
          {tab === 'queue' && (
            <div className="mt-4 space-y-2">
              {pending.length === 0 ? (
                <div className="p-8 text-center text-content-muted text-[13px]">
                  No pending actions. The agent will propose actions as it analyzes your data.
                </div>
              ) : (
                pending.map(action => (
                  <div key={action.id} className="p-4 rounded-xl bg-surface-raised border border-border-subtle">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-content-primary capitalize">{action.type.replace(/_/g, ' ')}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-400">Pending Approval</span>
                    </div>
                    {action.reasoning && <p className="text-[11px] text-content-secondary mb-3">{action.reasoning}</p>}
                    {action.payload && (
                      <div className="text-[10px] text-content-muted bg-surface-bg rounded-lg p-2 mb-3 font-mono max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {JSON.stringify(action.payload, null, 2)}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(action.id)} disabled={executing === action.id}
                        className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-[11px] font-semibold hover:bg-green-500/30 transition-colors flex items-center gap-1">
                        {executing === action.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve & Execute
                      </button>
                      <button onClick={() => handleReject(action.id)} disabled={executing === action.id}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[11px] font-semibold hover:bg-red-500/30 transition-colors flex items-center gap-1">
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* History Tab */}
          {tab === 'history' && (
            <div className="mt-4 space-y-2">
              {actions.filter(a => a.status !== 'pending').length === 0 ? (
                <div className="p-8 text-center text-content-muted text-[13px]">No action history yet.</div>
              ) : (
                actions.filter(a => a.status !== 'pending').map(action => {
                  const badge = STATUS_BADGE[action.status] || STATUS_BADGE.error;
                  return (
                    <div key={action.id} className="p-3 rounded-xl bg-surface-raised flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>
                      <span className="text-[12px] text-content-primary font-medium capitalize flex-1">{action.type.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-content-muted">{new Date(action.createdAt).toLocaleString()}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Health Tab */}
          {tab === 'health' && (
            <div className="mt-4 space-y-3">
              <div className="p-4 rounded-xl bg-surface-raised">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-[13px] font-semibold text-content-primary">System Status</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Plugin Connection', status: 'ok', detail: 'Submodule loaded' },
                    { label: 'BrandGen API', status: 'ok', detail: 'Responding' },
                    { label: 'Action Queue', status: 'ok', detail: `${pending.length} pending` },
                    { label: 'AI Provider', status: context ? 'ok' : 'warn', detail: context ? 'Available' : 'Not configured' },
                    { label: 'Email (SMTP)', status: 'off', detail: 'Not configured' },
                    { label: 'Scraper', status: 'off', detail: 'Not configured' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
                      <span className="text-[12px] text-content-secondary">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-content-muted">{item.detail}</span>
                        <span className={`w-2 h-2 rounded-full ${
                          item.status === 'ok' ? 'bg-green-400' : item.status === 'warn' ? 'bg-yellow-400' : 'bg-gray-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-raised">
                <h3 className="text-[12px] font-semibold text-content-primary mb-2">Configuration Needed</h3>
                <ul className="space-y-1.5 text-[11px] text-content-secondary">
                  <li className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-yellow-400" /> Add Anthropic API key to sales agent .env</li>
                  <li className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-yellow-400" /> Configure SMTP for email sequences</li>
                  <li className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-yellow-400" /> Set scrape targets (industry, location)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
