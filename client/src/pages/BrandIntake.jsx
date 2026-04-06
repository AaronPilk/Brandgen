import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Upload, Lightbulb, Compass } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import { useStore } from '../store/useStore';
import { createProfile, runAiAction, uploadFiles } from '../services/api';

const BUILD_STEPS = ['submode', 'details', 'personality', 'files'];
const DISCOVER_STEPS = ['submode', 'market', 'files'];

export default function BrandIntake() {
  const navigate = useNavigate();
  const { setCurrentProfile, addSpend, sessionId } = useStore();
  const [subMode, setSubMode] = useState('');
  const [step, setStep] = useState('submode');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  // Build My Brand fields
  const [buildForm, setBuildForm] = useState({
    brandName: '',
    whatYouSell: '',
    targetCustomer: '',
    competitorUrls: '',
    instagramUrls: '',
    personalityWords: '',
    formalOrCasual: '',
    brandVibe: '',
  });

  // Discover & Build fields
  const [discoverForm, setDiscoverForm] = useState({
    trendLinks: '',
    adBudget: '',
    targetAge: '',
    geoMarket: '',
    productCategory: '',
  });

  const setB = (key, val) => setBuildForm((p) => ({ ...p, [key]: val }));
  const setD = (key, val) => setDiscoverForm((p) => ({ ...p, [key]: val }));

  const steps = subMode === 'build' ? BUILD_STEPS : subMode === 'discover' ? DISCOVER_STEPS : ['submode'];

  const nextStep = () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const prevStep = () => {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
    else navigate('/');
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files).slice(0, 5));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let uploadedFiles = [];
      if (files.length > 0) {
        const result = await uploadFiles(files);
        uploadedFiles = result.files;
      }

      const mode = subMode === 'build' ? 'build-brand' : 'discover-build';
      const intake = subMode === 'build'
        ? { ...buildForm, files: uploadedFiles }
        : { ...discoverForm, files: uploadedFiles };

      const profile = await createProfile({ mode, intake });

      // Auto-run market research
      const research = await runAiAction('market-research', { profile, sessionId });
      profile.research = research.research;
      if (research.cost) addSpend(research.cost);

      setCurrentProfile(profile);
      navigate(`/dashboard/${profile.id}`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <button
        onClick={() => (step === 'submode' ? navigate('/') : prevStep())}
        className="flex items-center gap-2 text-content-secondary hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-bold mb-2">Build a Brand</h1>
      <p className="text-content-secondary mb-6">Let's create something iconic.</p>

      <ProgressBar steps={steps} currentStep={step} />

      {/* Sub-mode selection */}
      {step === 'submode' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">How would you like to start?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card
              selected={subMode === 'build'}
              onClick={() => setSubMode('build')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Lightbulb className="w-6 h-6 text-brand-purple" />
                <h3 className="font-semibold text-lg">Build My Brand</h3>
              </div>
              <p className="text-sm text-content-secondary">
                I already have a brand idea — help me build it out.
              </p>
            </Card>
            <Card
              selected={subMode === 'discover'}
              onClick={() => setSubMode('discover')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Compass className="w-6 h-6 text-brand-purple" />
                <h3 className="font-semibold text-lg">Discover & Build</h3>
              </div>
              <p className="text-sm text-content-secondary">
                Help me find a winning product or niche first, then build the brand.
              </p>
            </Card>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={nextStep} disabled={!subMode}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Build My Brand — Details */}
      {step === 'details' && subMode === 'build' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Brand Details</h2>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Brand Name or Idea</label>
            <input
              value={buildForm.brandName}
              onChange={(e) => setB('brandName', e.target.value)}
              placeholder="Rough is fine — we'll refine it"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">What Do You Sell?</label>
            <input
              value={buildForm.whatYouSell}
              onChange={(e) => setB('whatYouSell', e.target.value)}
              placeholder="e.g. Streetwear t-shirts, skincare, coaching"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Who Is Your Customer?</label>
            <textarea
              rows={2}
              value={buildForm.targetCustomer}
              onChange={(e) => setB('targetCustomer', e.target.value)}
              placeholder="Age, vibe, lifestyle — describe your ideal customer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Competitor Website URLs</label>
            <textarea
              rows={2}
              value={buildForm.competitorUrls}
              onChange={(e) => setB('competitorUrls', e.target.value)}
              placeholder="Paste URLs — we'll study them"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Competitor/Inspiration Instagram URLs</label>
            <textarea
              rows={2}
              value={buildForm.instagramUrls}
              onChange={(e) => setB('instagramUrls', e.target.value)}
              placeholder="Instagram profiles to study for content and aesthetic"
            />
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={nextStep} disabled={!buildForm.brandName}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Build My Brand — Personality */}
      {step === 'personality' && subMode === 'build' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Brand Personality</h2>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Describe Yourself in 3 Words</label>
            <input
              value={buildForm.personalityWords}
              onChange={(e) => setB('personalityWords', e.target.value)}
              placeholder="e.g. Bold, Creative, Relentless"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Tone</label>
            <div className="flex gap-3">
              {['Formal', 'Casual', 'Mix of Both'].map((t) => (
                <button
                  key={t}
                  onClick={() => setB('formalOrCasual', t.toLowerCase())}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    buildForm.formalOrCasual === t.toLowerCase()
                      ? 'border-brand-purple bg-brand-purple/10 text-white'
                      : 'border-surface-border bg-surface-card text-content-secondary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">What's Your Brand's Vibe?</label>
            <input
              value={buildForm.brandVibe}
              onChange={(e) => setB('brandVibe', e.target.value)}
              placeholder="e.g. Luxury streetwear, clean minimalism, edgy and raw"
            />
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={nextStep}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Discover & Build — Market */}
      {step === 'market' && subMode === 'discover' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Market Discovery</h2>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Trend Data Links <span className="text-content-muted">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={discoverForm.trendLinks}
              onChange={(e) => setD('trendLinks', e.target.value)}
              placeholder="Google Trends, AliExpress best sellers, Pinterest trending URLs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Monthly Ad Budget</label>
            <input
              value={discoverForm.adBudget}
              onChange={(e) => setD('adBudget', e.target.value)}
              placeholder="e.g. $2,000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Target Age Range</label>
            <input
              value={discoverForm.targetAge}
              onChange={(e) => setD('targetAge', e.target.value)}
              placeholder="e.g. 18-35"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Geographic Market</label>
            <input
              value={discoverForm.geoMarket}
              onChange={(e) => setD('geoMarket', e.target.value)}
              placeholder="e.g. US, UK, Global"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Product Category <span className="text-content-muted">(optional)</span>
            </label>
            <input
              value={discoverForm.productCategory}
              onChange={(e) => setD('productCategory', e.target.value)}
              placeholder="Leave blank for AI to decide"
            />
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={nextStep}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Files Step (both sub-modes) */}
      {step === 'files' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Upload Research Files</h2>
          <p className="text-content-secondary text-sm mb-4">
            PDFs, competitor screenshots, research images — max 5 files. Optional.
          </p>

          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-surface-border rounded-2xl cursor-pointer hover:border-brand-purple/50 transition-colors">
            <Upload className="w-8 h-8 text-content-muted mb-2" />
            <span className="text-sm text-content-secondary">
              {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload'}
            </span>
            <input
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
            />
          </label>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-content-secondary bg-brand-dark-surface rounded-lg px-3 py-2">
                  <span className="truncate">{f.name}</span>
                  <span className="text-content-muted">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {loading ? 'Running Market Research...' : 'Create Profile & Research'}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
