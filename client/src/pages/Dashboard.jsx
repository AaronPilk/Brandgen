import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Globe, Image, Mail, MessageSquare, Palette, ShoppingBag,
  Instagram, Facebook, BarChart3, Megaphone, Link2, AlertTriangle,
  Eye, Zap, Package, ChevronRight, Upload,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getProfile, runAiAction, updateProfile, uploadFiles } from '../services/api';
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
  const profile = currentProfile;

  useEffect(() => {
    if (!profile || profile.id !== id) {
      getProfile(id).then(setCurrentProfile).catch(() => navigate('/'));
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
  const isBrand = profile.mode === 'build-brand' || profile.mode === 'discover-build';
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
                onClick={() => setViewing({ title: 'Market Research', data: profile.research, type: 'json' })}
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
            <ActionButton icon={Globe} label="Build Landing Page" description="Landing page with lead capture — add reference links & files" actionKey="landing-page" completed={!!assets['landing-page']}
              onExecute={() => handleActionWithInput('landing-page', {
                title: 'Landing Page References',
                fields: [
                  { key: 'referenceLinks', label: 'Reference landing page URLs (one per line)', type: 'textarea', placeholder: 'https://example.com/landing1\nhttps://example.com/landing2' },
                  { key: 'files', label: 'Upload reference images or PDFs', type: 'file' },
                ],
              })}
            />
            <ActionButton icon={Megaphone} label="Create Ad Creatives" description="10 ad concepts — add inspiration ad links" actionKey="ad-creatives" completed={!!assets['ad-creatives']}
              onExecute={() => handleActionWithInput('ad-creatives', {
                title: 'Ad Creative Inspiration',
                fields: [
                  { key: 'inspirationLinks', label: 'Links to ads you like (one per line)', type: 'textarea', placeholder: 'https://facebook.com/ads/...\nhttps://tiktok.com/...' },
                ],
              })}
            />
            <ActionButton icon={Mail} label="Build Email Sequences" description="Industry-specific 5-email nurture sequence" actionKey="email-sequences" completed={!!assets['email-sequences']} onExecute={() => executeAction('email-sequences')} />
            <ActionButton icon={MessageSquare} label="Build SMS Sequences" description="5-message SMS follow-up sequence" actionKey="sms-sequences" completed={!!assets['sms-sequences']} onExecute={() => executeAction('sms-sequences')} />
            <ActionButton icon={Link2} label="Connect GoHighLevel" description="CRM integration for lead routing" actionKey="gohighlevel" disabled disabledReason={apiStatus?.goHighLevel ? undefined : 'Not connected — configure in Settings'} onExecute={() => {}} />
            <ActionButton icon={Link2} label="Connect HubSpot" description="CRM integration for lead management" actionKey="hubspot" disabled disabledReason={apiStatus?.hubspot ? undefined : 'Not connected — configure in Settings'} onExecute={() => {}} />
            <ActionButton icon={BarChart3} label="Set Up Tracking Pixels" description="Meta, TikTok, Google Analytics, Pinterest" actionKey="tracking-pixels" completed={!!assets['tracking-pixels']} onExecute={() => executeAction('tracking-pixels')} />
          </>
        )}

        {isBrand && (
          <>
            <ActionButton icon={Palette} label="Generate Logo Concepts" description="3 distinct logo variations" actionKey="logo-concepts" completed={!!assets['logo-concepts']} onExecute={() => executeAction('logo-concepts')} />
            <ActionButton icon={Globe} label="Build Website" description="Conversion-optimized site — add reference links & files" actionKey="landing-page" completed={!!assets['landing-page']}
              onExecute={() => handleActionWithInput('landing-page', {
                title: 'Website References',
                fields: [
                  { key: 'referenceLinks', label: 'Reference website URLs (one per line)', type: 'textarea', placeholder: 'https://example.com\nhttps://competitor.com' },
                  { key: 'files', label: 'Upload reference images or PDFs', type: 'file' },
                ],
              })}
            />
            <ActionButton icon={Image} label="Create Product Mockups" description="T-shirts, packaging, lifestyle shots" actionKey="product-mockups" completed={!!assets['product-mockups']} onExecute={() => executeAction('product-mockups')} />
            <ActionButton icon={Megaphone} label="Create 10 Ad Creatives" description="Meta and TikTok — add inspiration links" actionKey="ad-creatives" completed={!!assets['ad-creatives']}
              onExecute={() => handleActionWithInput('ad-creatives', {
                title: 'Ad Creative Inspiration',
                fields: [
                  { key: 'inspirationLinks', label: 'Links to ads you like (one per line)', type: 'textarea', placeholder: 'https://facebook.com/ads/...\nhttps://tiktok.com/...' },
                ],
              })}
            />
            <ActionButton icon={Package} label="Connect Printful" description="Fulfillment for t-shirt and merch brands" actionKey="printful" disabled disabledReason={apiStatus?.printful ? undefined : 'Not connected — configure in Settings'} onExecute={() => {}} />
            <ActionButton icon={Instagram} label="Set Up Instagram" description="Profile setup with content strategy" actionKey="social-instagram" completed={!!assets['social-instagram']} onExecute={() => executeAction('social-setup', { platform: 'Instagram' })} />
            <ActionButton icon={Facebook} label="Set Up Facebook Page" description="Business page with content plan" actionKey="social-facebook" completed={!!assets['social-facebook']} onExecute={() => executeAction('social-setup', { platform: 'Facebook' })} />
            <ActionButton icon={ShoppingBag} label="Connect Meta Ads" description="Campaign structure and setup guide" actionKey="meta-ads-setup" completed={!!assets['meta-ads-setup']} onExecute={() => executeAction('social-setup', { platform: 'Meta Ads' })} />
            <ActionButton icon={BarChart3} label="Set Up Tracking Pixels" description="Meta, TikTok, Google Analytics, Pinterest" actionKey="tracking-pixels" completed={!!assets['tracking-pixels']} onExecute={() => executeAction('tracking-pixels')} />
          </>
        )}
      </div>

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
          <p className="text-[13px] text-content-muted mb-5">Optional — add references for better results</p>

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
