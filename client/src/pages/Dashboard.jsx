import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Globe, Image, Mail, MessageSquare, Palette, ShoppingBag,
  Instagram, Facebook, BarChart3, Megaphone, Link2, AlertTriangle,
  Eye, Zap, Package, ChevronRight, Upload, ExternalLink, Check, Unplug, Edit3, X, DollarSign,
  Share2, Target, Users, HardDrive, Loader2, Video, Server, Search,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { BRAND_INTEGRATIONS, BRAND_GROUPS, TOP_BRAND_INTEGRATIONS } from '../data/integrations';
import { getProfile, runAiAction, updateProfile, uploadFiles, getOAuthConnections, startOAuthConnect, disconnectOAuth, prepareMetaCampaign, getMetaAdsStatus } from '../services/api';
import ActionButton from '../components/ActionButton';
import AssetViewer from '../components/AssetViewer';
import LoadingOverlay from '../components/LoadingOverlay';
import ApprovalQueue from '../components/ApprovalQueue';
import ActivityFeed from '../components/ActivityFeed';
import PerformanceDashboard from '../components/PerformanceDashboard';

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
  const [metaAdsConfigured, setMetaAdsConfigured] = useState(false);
  const [metaCampaignModal, setMetaCampaignModal] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
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
                  onClick={() => setEditProfileOpen(true)}
                  className="text-[12px] font-semibold text-content-muted bg-surface-raised px-3 py-1 rounded-full hover:text-content-primary transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit Profile
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


      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT COLUMN — Actions + Agents */}
        <div className="lg:col-span-1 space-y-5">
          {/* Agents */}
          <div>
            <h2 className="text-[14px] font-semibold text-content-primary mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-purple" /> Agents
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Sales', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
                { name: 'Campaign', icon: Megaphone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { name: 'Creative', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                { name: 'Projects', icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                { name: 'Analytics', icon: BarChart3, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
                { name: 'Retention', icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
              ].map((agent) => {
                const AgentIcon = agent.icon;
                return (
                  <div key={agent.name} className="glossy rounded-xl p-3 opacity-70 cursor-default">
                    <div className="relative z-10 text-center">
                      <div className={`w-8 h-8 rounded-lg ${agent.bg} flex items-center justify-center mx-auto mb-1.5`}>
                        <AgentIcon className={`w-4 h-4 ${agent.color}`} />
                      </div>
                      <p className="text-[10px] font-semibold text-content-primary">{agent.name}</p>
                      <p className="text-[8px] text-content-muted uppercase">Soon</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-600 dark:text-red-400 text-[12px]">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <h2 className="text-[14px] font-semibold mb-2 text-content-primary">Actions</h2>

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
        {/* Meta Ads — available for both modes when configured */}
        {metaAdsConfigured && (
          <ActionButton
            skipConfirm
            icon={Megaphone}
            label="Prepare Meta Ad Campaign"
            description="AI designs a campaign — you approve before anything goes live"
            actionKey="meta-campaign"
            onExecute={() => setMetaCampaignModal(true)}
          />
        )}
          </div>

          {/* Generated Assets */}
          {Object.keys(assets).length > 0 && (
            <div>
              <h2 className="text-[14px] font-semibold mb-2 text-content-primary">Generated Assets</h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(assets).map(([key, data]) => (
                  <motion.button key={key} whileHover={{ y: -1 }}
                    onClick={() => {
                      const type = key === 'landing-page' ? 'html' : key === 'logo-concepts' || key === 'product-mockups' ? 'images' : 'json';
                      const displayData = type === 'html' ? data.html : type === 'images' ? data.concepts || data.mockups : data;
                      setViewing({ title: key.replace(/-/g, ' '), data: displayData, type });
                    }}
                    className="glossy p-3 rounded-xl hover:shadow-elevated-lg transition-all text-left"
                  >
                    <div className="relative z-10">
                      <p className="text-[12px] font-semibold capitalize text-content-primary">{key.replace(/-/g, ' ')}</p>
                      <p className="text-[10px] text-content-muted">View</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Performance + Campaigns + Activity */}
        <div className="lg:col-span-2 space-y-5">
          <PerformanceDashboard profileId={id} />
          <ApprovalQueue profileId={id} />
          <ActivityFeed profileId={id} />
        </div>
      </div>

      {/* Connected Accounts — full width below */}
      <ProfileConnections
        profileId={id}
        connections={connections}
        setConnections={setConnections}
        connectingPlatform={connectingPlatform}
        setConnectingPlatform={setConnectingPlatform}
      />

      {/* Modals */}
      {metaCampaignModal && (
        <MetaCampaignModal profile={profile} onClose={() => setMetaCampaignModal(false)} onSubmitted={() => setMetaCampaignModal(false)} />
      )}
      {editProfileOpen && (
        <EditProfileModal profile={profile} onClose={() => setEditProfileOpen(false)}
          onSaved={(updated) => { setCurrentProfile(updated); setEditProfileOpen(false); }} />
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

      {/* Tracking Pixels — compact row */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Pixels:</span>
        {['Meta Pixel', 'TikTok Pixel', 'Google Analytics', 'Pinterest Tag'].map((p) => (
          <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised text-content-muted">{p}</span>
        ))}
      </div>
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
  });
  const [saving, setSaving] = useState(false);
  const [rerunResearch, setRerunResearch] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedIntake = { ...profile.intake, ...form };
      await updateProfile(profile.id, { intake: updatedIntake });

      let updatedProfile = { ...profile, intake: updatedIntake };

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
