import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Upload, Lightbulb, Compass, Building2, Plus, X, Globe } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import LoadingOverlay from '../components/LoadingOverlay';
import { useStore } from '../store/useStore';
import { createProfile, runAiAction, uploadFiles, updateProfile } from '../services/api';

const BUILD_STEPS = ['submode', 'details', 'personality', 'files'];
const DISCOVER_STEPS = ['submode', 'market', 'files'];
const EXISTING_STEPS = ['submode', 'existing-info', 'existing-digital', 'existing-goals', 'files'];

function Label({ children }) {
  return <label className="block text-[13px] font-medium text-content-secondary mb-2">{children}</label>;
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 ${
        selected
          ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
          : 'bg-surface-raised text-content-secondary hover:text-content-primary border border-surface-border'
      }`}
    >
      {label}
    </button>
  );
}

function UrlListInput({ label, sublabel, value, onChange }) {
  const urls = (value || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  const [draft, setDraft] = useState('');

  const addUrl = () => {
    const cleaned = draft.trim();
    if (!cleaned) return;
    onChange([...urls, cleaned].join('\n'));
    setDraft('');
  };
  const removeUrl = (idx) => onChange(urls.filter((_, i) => i !== idx).join('\n'));
  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } };

  return (
    <div>
      <Label>{label}</Label>
      {sublabel && <p className="text-[11px] text-content-muted -mt-1 mb-3">{sublabel}</p>}
      {urls.length > 0 && (
        <div className="space-y-2 mb-3">
          {urls.map((url, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 glossy rounded-xl px-3 py-2.5">
              <Globe className="w-4 h-4 text-brand-purple shrink-0 relative z-10" />
              <span className="text-[13px] text-content-primary truncate flex-1 relative z-10">{url}</span>
              <button onClick={() => removeUrl(i)} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-content-muted hover:text-red-500 transition-colors relative z-10">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKeyDown} placeholder="https://..." className="flex-1" />
        <button type="button" onClick={addUrl} disabled={!draft.trim()}
          className={`px-4 rounded-2xl text-[13px] font-medium flex items-center gap-1.5 transition-all ${
            draft.trim() ? 'glossy-btn text-white' : 'bg-surface-raised text-content-muted cursor-not-allowed'
          }`}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

export default function BrandIntake() {
  const navigate = useNavigate();
  const { setCurrentProfile, addSpend, sessionId } = useStore();
  const [subMode, setSubMode] = useState('');
  const [step, setStep] = useState('submode');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  const [buildForm, setBuildForm] = useState({
    brandName: '', whatYouSell: '', targetCustomer: '',
    competitorUrls: '', instagramUrls: '',
    personalityWords: '', formalOrCasual: '', brandVibe: '',
  });

  const [discoverForm, setDiscoverForm] = useState({
    trendLinks: '', adBudget: '', targetAge: '', geoMarket: '', productCategory: '',
  });

  const [existingForm, setExistingForm] = useState({
    brandName: '', industry: '', whatYouSell: '', targetCustomer: '',
    websiteUrl: '', instagramUrl: '', facebookUrl: '', tiktokUrl: '',
    competitorUrls: '',
    hasLogo: '', hasWebsite: '', hasSocialMedia: '', hasCRM: '', hasEmailMarketing: '',
    monthlyRevenue: '', adBudget: '',
    biggestChallenge: '', whatYouNeed: '',
  });

  const setB = (key, val) => setBuildForm((p) => ({ ...p, [key]: val }));
  const setD = (key, val) => setDiscoverForm((p) => ({ ...p, [key]: val }));
  const setE = (key, val) => setExistingForm((p) => ({ ...p, [key]: val }));

  const steps = subMode === 'build' ? BUILD_STEPS
    : subMode === 'discover' ? DISCOVER_STEPS
    : subMode === 'existing' ? EXISTING_STEPS
    : ['submode'];

  const nextStep = () => { const idx = steps.indexOf(step); if (idx < steps.length - 1) setStep(steps[idx + 1]); };
  const prevStep = () => { const idx = steps.indexOf(step); if (idx > 0) setStep(steps[idx - 1]); else navigate('/'); };
  const handleFileChange = (e) => setFiles(Array.from(e.target.files).slice(0, 5));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let uploadedFiles = [];
      if (files.length > 0) { const result = await uploadFiles(files); uploadedFiles = result.files; }
      const mode = subMode === 'existing' ? 'existing-brand'
        : subMode === 'build' ? 'build-brand' : 'discover-build';
      const intake = subMode === 'build' ? { ...buildForm, files: uploadedFiles }
        : subMode === 'existing' ? { ...existingForm, files: uploadedFiles }
        : { ...discoverForm, files: uploadedFiles };
      const profile = await createProfile({ mode, intake });
      const research = await runAiAction('market-research', { profile, sessionId });
      profile.research = research.research;
      if (research.cost) addSpend(research.cost);
      await updateProfile(profile.id, { research: profile.research });
      setCurrentProfile(profile);
      navigate(`/dashboard/${profile.id}`);
    } catch (err) { alert('Error: ' + err.message); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <LoadingOverlay visible={loading} label="Running Market Research..." />
      <button onClick={() => (step === 'submode' ? navigate('/') : prevStep())} className="flex items-center gap-2 text-content-muted hover:text-content-primary mb-8 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-title mb-1">Build a Brand</h1>
      <p className="text-content-secondary text-[15px] mb-8">Let's create something iconic.</p>

      <ProgressBar steps={steps} currentStep={step} />

      {/* Sub-mode Selection */}
      {step === 'submode' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">How would you like to start?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card selected={subMode === 'build'} onClick={() => setSubMode('build')}>
              <Lightbulb className="w-7 h-7 text-brand-purple mb-3" />
              <h3 className="font-semibold text-[15px] mb-1">Build My Brand</h3>
              <p className="text-[13px] text-content-secondary">I have a brand idea — help me build it from scratch.</p>
            </Card>
            <Card selected={subMode === 'existing'} onClick={() => setSubMode('existing')}>
              <Building2 className="w-7 h-7 text-brand-purple mb-3" />
              <h3 className="font-semibold text-[15px] mb-1">Existing Brand</h3>
              <p className="text-[13px] text-content-secondary">I have a brand but need digital presence, CRM, ads, and funnels.</p>
            </Card>
            <Card selected={subMode === 'discover'} onClick={() => setSubMode('discover')}>
              <Compass className="w-7 h-7 text-brand-purple mb-3" />
              <h3 className="font-semibold text-[15px] mb-1">Discover & Build</h3>
              <p className="text-[13px] text-content-secondary">Help me find a winning niche first, then build.</p>
            </Card>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={nextStep} disabled={!subMode}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* ─── EXISTING BRAND: Info ─── */}
      {step === 'existing-info' && subMode === 'existing' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">About Your Brand</h2>
          <div><Label>Brand Name</Label><input value={existingForm.brandName} onChange={(e) => setE('brandName', e.target.value)} placeholder="Your brand name" /></div>
          <div><Label>Industry</Label><input value={existingForm.industry} onChange={(e) => setE('industry', e.target.value)} placeholder="e.g. Fitness, Beauty, Real Estate, Restaurant" /></div>
          <div><Label>What Do You Sell?</Label><input value={existingForm.whatYouSell} onChange={(e) => setE('whatYouSell', e.target.value)} placeholder="Products, services, or both" /></div>
          <div><Label>Who Is Your Customer?</Label><textarea rows={2} value={existingForm.targetCustomer} onChange={(e) => setE('targetCustomer', e.target.value)} placeholder="Age, demographics, lifestyle, pain points" /></div>
          <div><Label>Monthly Revenue</Label>
            <div className="grid grid-cols-2 gap-2">
              {['Under $10k', '$10k-$50k', '$50k-$100k', '$100k+'].map((r) => (
                <Chip key={r} label={r} selected={existingForm.monthlyRevenue === r} onClick={() => setE('monthlyRevenue', r)} />
              ))}
            </div>
          </div>
          <div><Label>Monthly Ad Budget</Label><input value={existingForm.adBudget} onChange={(e) => setE('adBudget', e.target.value)} placeholder="e.g. $2,000/mo" /></div>
          <UrlListInput label="Competitor Websites" sublabel="We'll analyze these to inform your strategy" value={existingForm.competitorUrls} onChange={(val) => setE('competitorUrls', val)} />
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={nextStep} disabled={!existingForm.brandName}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* ─── EXISTING BRAND: Digital Presence ─── */}
      {step === 'existing-digital' && subMode === 'existing' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">Current Digital Presence</h2>
          <p className="text-content-secondary text-[13px] mb-2">Tell us what you already have so we know what to build.</p>

          <div><Label>Website URL</Label><input value={existingForm.websiteUrl} onChange={(e) => setE('websiteUrl', e.target.value)} placeholder="https://yourbrand.com (leave blank if none)" /></div>
          <div><Label>Instagram URL</Label><input value={existingForm.instagramUrl} onChange={(e) => setE('instagramUrl', e.target.value)} placeholder="https://instagram.com/yourbrand (leave blank if none)" /></div>
          <div><Label>Facebook URL</Label><input value={existingForm.facebookUrl} onChange={(e) => setE('facebookUrl', e.target.value)} placeholder="https://facebook.com/yourbrand (leave blank if none)" /></div>
          <div><Label>TikTok URL</Label><input value={existingForm.tiktokUrl} onChange={(e) => setE('tiktokUrl', e.target.value)} placeholder="https://tiktok.com/@yourbrand (leave blank if none)" /></div>

          <div>
            <Label>What do you currently have?</Label>
            <div className="space-y-2.5 mt-1">
              {[
                { key: 'hasLogo', label: 'Professional logo & brand identity' },
                { key: 'hasWebsite', label: 'Website or landing page' },
                { key: 'hasSocialMedia', label: 'Active social media accounts' },
                { key: 'hasCRM', label: 'CRM (GoHighLevel, HubSpot, etc.)' },
                { key: 'hasEmailMarketing', label: 'Email marketing setup' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setE(key, existingForm[key] === 'yes' ? 'no' : 'yes')}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    existingForm[key] === 'yes'
                      ? 'border-brand-purple/30 bg-brand-purple/5'
                      : 'border-surface-border bg-surface-card'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                    existingForm[key] === 'yes'
                      ? 'border-brand-purple bg-brand-purple'
                      : 'border-surface-border'
                  }`}>
                    {existingForm[key] === 'yes' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[13px] text-content-primary">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={nextStep}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* ─── EXISTING BRAND: Goals ─── */}
      {step === 'existing-goals' && subMode === 'existing' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">What Do You Need?</h2>
          <div>
            <Label>Biggest Challenge Right Now</Label>
            <textarea rows={3} value={existingForm.biggestChallenge} onChange={(e) => setE('biggestChallenge', e.target.value)}
              placeholder="e.g. No online presence, not getting leads, brand looks outdated, no ad campaigns running..." />
          </div>
          <div>
            <Label>What do you want us to build?</Label>
            <p className="text-[11px] text-content-muted -mt-1 mb-3">Select everything that applies — we'll build it on your dashboard</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Logo & Brand Identity', 'Website / Landing Page', 'Social Media Setup',
                'Ad Creatives (Meta & TikTok)', 'Email Sequences', 'SMS Follow-ups',
                'CRM Setup', 'Tracking Pixels', 'Product Mockups',
              ].map((need) => (
                <Chip
                  key={need}
                  label={need}
                  selected={(existingForm.whatYouNeed || '').includes(need)}
                  onClick={() => {
                    const current = (existingForm.whatYouNeed || '').split('|').filter(Boolean);
                    const next = current.includes(need)
                      ? current.filter((n) => n !== need)
                      : [...current, need];
                    setE('whatYouNeed', next.join('|'));
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={nextStep}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* ─── BUILD MY BRAND: Details ─── */}
      {step === 'details' && subMode === 'build' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">Brand Details</h2>
          <div><Label>Brand Name or Idea</Label><input value={buildForm.brandName} onChange={(e) => setB('brandName', e.target.value)} placeholder="Rough is fine — we'll refine it" /></div>
          <div><Label>What Do You Sell?</Label><input value={buildForm.whatYouSell} onChange={(e) => setB('whatYouSell', e.target.value)} placeholder="e.g. Streetwear t-shirts, skincare, coaching" /></div>
          <div><Label>Who Is Your Customer?</Label><textarea rows={2} value={buildForm.targetCustomer} onChange={(e) => setB('targetCustomer', e.target.value)} placeholder="Age, vibe, lifestyle — describe your ideal customer" /></div>
          <div><Label>Competitor Website URLs</Label><textarea rows={2} value={buildForm.competitorUrls} onChange={(e) => setB('competitorUrls', e.target.value)} placeholder="Paste URLs — we'll study them" /></div>
          <div><Label>Competitor/Inspiration Instagram URLs</Label><textarea rows={2} value={buildForm.instagramUrls} onChange={(e) => setB('instagramUrls', e.target.value)} placeholder="Instagram profiles for content and aesthetic research" /></div>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={nextStep} disabled={!buildForm.brandName}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* ─── BUILD MY BRAND: Personality ─── */}
      {step === 'personality' && subMode === 'build' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">Brand Personality</h2>
          <div><Label>Describe Yourself in 3 Words</Label><input value={buildForm.personalityWords} onChange={(e) => setB('personalityWords', e.target.value)} placeholder="e.g. Bold, Creative, Relentless" /></div>
          <div>
            <Label>Tone</Label>
            <div className="flex gap-2">
              {['Formal', 'Casual', 'Mix of Both'].map((t) => (
                <Chip key={t} label={t} selected={buildForm.formalOrCasual === t.toLowerCase()} onClick={() => setB('formalOrCasual', t.toLowerCase())} />
              ))}
            </div>
          </div>
          <div><Label>What's Your Brand's Vibe?</Label><input value={buildForm.brandVibe} onChange={(e) => setB('brandVibe', e.target.value)} placeholder="e.g. Luxury streetwear, clean minimalism, edgy and raw" /></div>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={nextStep}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* ─── DISCOVER & BUILD: Market ─── */}
      {step === 'market' && subMode === 'discover' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">Market Discovery</h2>
          <div><Label>Trend Data Links <span className="text-content-muted">(optional)</span></Label><textarea rows={2} value={discoverForm.trendLinks} onChange={(e) => setD('trendLinks', e.target.value)} placeholder="Google Trends, AliExpress, Pinterest URLs" /></div>
          <div><Label>Monthly Ad Budget</Label><input value={discoverForm.adBudget} onChange={(e) => setD('adBudget', e.target.value)} placeholder="e.g. $2,000" /></div>
          <div><Label>Target Age Range</Label><input value={discoverForm.targetAge} onChange={(e) => setD('targetAge', e.target.value)} placeholder="e.g. 18-35" /></div>
          <div><Label>Geographic Market</Label><input value={discoverForm.geoMarket} onChange={(e) => setD('geoMarket', e.target.value)} placeholder="e.g. US, UK, Global" /></div>
          <div><Label>Product Category <span className="text-content-muted">(optional)</span></Label><input value={discoverForm.productCategory} onChange={(e) => setD('productCategory', e.target.value)} placeholder="Leave blank for AI to decide" /></div>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={nextStep}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {/* ─── FILES (all sub-modes) ─── */}
      {step === 'files' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">Upload Supporting Files</h2>
          <p className="text-content-secondary text-sm">
            {subMode === 'existing'
              ? 'Upload your current logo, brand guidelines, product photos, or any reference material.'
              : 'PDFs, screenshots, research images — max 5 files. Optional.'}
          </p>
          <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-surface-border rounded-3xl cursor-pointer hover:border-brand-purple/30 hover:bg-brand-purple/[0.02] transition-all duration-300">
            <Upload className="w-8 h-8 text-content-muted mb-3" />
            <span className="text-sm text-content-secondary font-medium">{files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload'}</span>
            <span className="text-[11px] text-content-muted mt-1">PDF, PNG, JPG, WebP</span>
            <input type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
          </label>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-surface-raised rounded-2xl px-4 py-3">
                  <span className="text-content-primary truncate">{f.name}</span>
                  <span className="text-content-muted text-xs">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={handleSubmit} loading={loading}>{loading ? 'Running Research...' : 'Create Profile'}</Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
