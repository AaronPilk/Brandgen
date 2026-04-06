import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Globe,
  Image,
  Mail,
  MessageSquare,
  Palette,
  ShoppingBag,
  Instagram,
  Facebook,
  BarChart3,
  Megaphone,
  Link2,
  AlertTriangle,
  Eye,
  Zap,
  Package,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getProfile, runAiAction, updateProfile } from '../services/api';
import ActionButton from '../components/ActionButton';
import AssetViewer from '../components/AssetViewer';

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentProfile,
    setCurrentProfile,
    updateProfileAsset,
    addSpend,
    sessionId,
    apiStatus,
    autonomousMode,
    setAutonomousMode,
  } = useStore();

  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState('');

  const profile = currentProfile;

  useEffect(() => {
    if (!profile || profile.id !== id) {
      getProfile(id)
        .then(setCurrentProfile)
        .catch(() => navigate('/'));
    }
  }, [id]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-content-muted">Loading profile...</div>
      </div>
    );
  }

  const isLeadGen = profile.mode === 'lead-gen';
  const isBrand = profile.mode === 'build-brand' || profile.mode === 'discover-build';
  const intake = profile.intake || {};
  const assets = profile.assets || {};

  const executeAction = async (actionKey, opts = {}) => {
    setError('');
    try {
      const result = await runAiAction(actionKey, {
        profile,
        sessionId,
        ...opts,
      });
      if (result.cost) addSpend(result.cost);

      // Save asset to profile
      updateProfileAsset(actionKey, result);
      await updateProfile(profile.id, {
        assets: { ...assets, [actionKey]: result },
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const profileLabel =
    intake.brandName || intake.industry || 'Brand Profile';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-content-secondary hover:text-content-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      {/* Profile Header */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{profileLabel}</h1>
            <p className="text-content-secondary text-sm mt-1">
              {isLeadGen ? 'Lead Generation' : 'Brand Building'} ·{' '}
              {intake.businessType || intake.targetCustomer || intake.geoMarket || ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                profile.research
                  ? 'bg-green-900/30 text-green-400 border border-green-800'
                  : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
              }`}
            >
              {profile.research ? 'Research Complete' : 'No Research'}
            </span>
          </div>
        </div>

        {/* Research Preview */}
        {profile.research && (
          <div className="mt-4 pt-4 border-t border-surface-border">
            <button
              onClick={() =>
                setViewing({
                  title: 'Market Research',
                  data: profile.research,
                  type: 'json',
                })
              }
              className="text-sm text-brand-purple hover:text-brand-purple-light transition-colors flex items-center gap-1"
            >
              <Eye className="w-3 h-3" /> View Market Research
            </button>
          </div>
        )}
      </div>

      {/* Autonomous Mode Toggle */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium">Autonomous Mode</p>
              <p className="text-xs text-content-muted">Skip confirmation dialogs</p>
            </div>
          </div>
          <button
            onClick={() => setAutonomousMode(!autonomousMode)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              autonomousMode ? 'bg-yellow-600' : 'bg-surface-border'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                autonomousMode ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        {autonomousMode && (
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-400">
              Warning: Autonomous mode will execute actions without asking for confirmation.
              API costs will be charged immediately. This is not recommended for budget-conscious usage.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>

        {/* Lead Gen Actions */}
        {isLeadGen && (
          <>
            <ActionButton
              icon={Globe}
              label="Build Landing Page"
              description="High-converting landing page with lead capture form and UTM tracking"
              actionKey="landing-page"
              completed={!!assets['landing-page']}
              onExecute={() => executeAction('landing-page')}
            />
            <ActionButton
              icon={Megaphone}
              label="Create Ad Creatives"
              description="10 ad creative concepts for Meta and TikTok"
              actionKey="ad-creatives"
              completed={!!assets['ad-creatives']}
              onExecute={() => executeAction('ad-creatives')}
            />
            <ActionButton
              icon={Mail}
              label="Build Email Sequences"
              description="Industry-specific 5-email nurture sequence"
              actionKey="email-sequences"
              completed={!!assets['email-sequences']}
              onExecute={() => executeAction('email-sequences')}
            />
            <ActionButton
              icon={MessageSquare}
              label="Build SMS Sequences"
              description="5-message SMS follow-up sequence"
              actionKey="sms-sequences"
              completed={!!assets['sms-sequences']}
              onExecute={() => executeAction('sms-sequences')}
            />
            <ActionButton
              icon={Link2}
              label="Connect GoHighLevel"
              description="Connect your GoHighLevel CRM for lead routing"
              actionKey="gohighlevel"
              disabled
              disabledReason={
                apiStatus?.goHighLevel
                  ? undefined
                  : 'GoHighLevel API not connected — configure in Settings'
              }
              onExecute={() => {}}
            />
            <ActionButton
              icon={Link2}
              label="Connect HubSpot"
              description="Connect HubSpot CRM for lead management"
              actionKey="hubspot"
              disabled
              disabledReason={
                apiStatus?.hubspot
                  ? undefined
                  : 'HubSpot API not connected — configure in Settings'
              }
              onExecute={() => {}}
            />
            <ActionButton
              icon={BarChart3}
              label="Set Up Tracking Pixels"
              description="Meta Pixel, TikTok Pixel, Google Analytics, Pinterest Tag"
              actionKey="tracking-pixels"
              completed={!!assets['tracking-pixels']}
              onExecute={() => executeAction('tracking-pixels')}
            />
          </>
        )}

        {/* Brand Actions */}
        {isBrand && (
          <>
            <ActionButton
              icon={Palette}
              label="Generate Logo Concepts"
              description="3 distinct logo variations (uses DALL-E or shows placeholders)"
              actionKey="logo-concepts"
              completed={!!assets['logo-concepts']}
              onExecute={() => executeAction('logo-concepts')}
            />
            <ActionButton
              icon={Globe}
              label="Build Website / Landing Page"
              description="Conversion-optimized website with your brand identity"
              actionKey="landing-page"
              completed={!!assets['landing-page']}
              onExecute={() => executeAction('landing-page')}
            />
            <ActionButton
              icon={Image}
              label="Create Product Mockups"
              description="3 product mockups — t-shirts, packaging, lifestyle shots"
              actionKey="product-mockups"
              completed={!!assets['product-mockups']}
              onExecute={() => executeAction('product-mockups')}
            />
            <ActionButton
              icon={Megaphone}
              label="Create 10 Ad Creatives"
              description="Meta and TikTok ad creative concepts"
              actionKey="ad-creatives"
              completed={!!assets['ad-creatives']}
              onExecute={() => executeAction('ad-creatives')}
            />
            <ActionButton
              icon={Package}
              label="Connect Printful"
              description="Set up Printful fulfillment for t-shirt and merch brands"
              actionKey="printful"
              disabled
              disabledReason={
                apiStatus?.printful
                  ? undefined
                  : 'Printful API not connected — configure in Settings'
              }
              onExecute={() => {}}
            />
            <ActionButton
              icon={Instagram}
              label="Set Up Instagram"
              description="Complete Instagram profile setup with content strategy"
              actionKey="social-instagram"
              completed={!!assets['social-instagram']}
              onExecute={() => executeAction('social-setup', { platform: 'Instagram' })}
            />
            <ActionButton
              icon={Facebook}
              label="Set Up Facebook Page"
              description="Facebook business page setup with content plan"
              actionKey="social-facebook"
              completed={!!assets['social-facebook']}
              onExecute={() => executeAction('social-setup', { platform: 'Facebook' })}
            />
            <ActionButton
              icon={ShoppingBag}
              label="Connect Meta Ads"
              description="Meta Ads account setup guide and campaign structure"
              actionKey="meta-ads-setup"
              completed={!!assets['meta-ads-setup']}
              onExecute={() =>
                executeAction('social-setup', { platform: 'Meta Ads' })
              }
            />
            <ActionButton
              icon={BarChart3}
              label="Set Up All Tracking Pixels"
              description="Meta Pixel, TikTok Pixel, Google Analytics, Pinterest Tag"
              actionKey="tracking-pixels"
              completed={!!assets['tracking-pixels']}
              onExecute={() => executeAction('tracking-pixels')}
            />
          </>
        )}
      </div>

      {/* View completed assets */}
      {Object.keys(assets).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Generated Assets</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(assets).map(([key, data]) => (
              <button
                key={key}
                onClick={() => {
                  const type =
                    key === 'landing-page'
                      ? 'html'
                      : key === 'logo-concepts' || key === 'product-mockups'
                      ? 'images'
                      : 'json';
                  const displayData =
                    type === 'html'
                      ? data.html
                      : type === 'images'
                      ? data.concepts || data.mockups
                      : data;
                  setViewing({ title: key.replace(/-/g, ' '), data: displayData, type });
                }}
                className="p-4 rounded-xl bg-surface-raised border border-surface-border hover:border-brand-purple/50 transition-colors text-left"
              >
                <p className="text-sm font-medium capitalize">
                  {key.replace(/-/g, ' ')}
                </p>
                <p className="text-xs text-content-muted mt-1">Click to view</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Asset Viewer Modal */}
      {viewing && (
        <AssetViewer
          title={viewing.title}
          data={viewing.data}
          type={viewing.type}
          onClose={() => setViewing(null)}
        />
      )}
    </motion.div>
  );
}
