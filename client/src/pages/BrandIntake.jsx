import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Upload, Lightbulb, Compass } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import LoadingOverlay from '../components/LoadingOverlay';
import { useStore } from '../store/useStore';
import { createProfile, runAiAction, uploadFiles } from '../services/api';

const BUILD_STEPS = ['submode', 'details', 'personality', 'files'];
const DISCOVER_STEPS = ['submode', 'market', 'files'];

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

  const setB = (key, val) => setBuildForm((p) => ({ ...p, [key]: val }));
  const setD = (key, val) => setDiscoverForm((p) => ({ ...p, [key]: val }));

  const steps = subMode === 'build' ? BUILD_STEPS : subMode === 'discover' ? DISCOVER_STEPS : ['submode'];
  const nextStep = () => { const idx = steps.indexOf(step); if (idx < steps.length - 1) setStep(steps[idx + 1]); };
  const prevStep = () => { const idx = steps.indexOf(step); if (idx > 0) setStep(steps[idx - 1]); else navigate('/'); };
  const handleFileChange = (e) => setFiles(Array.from(e.target.files).slice(0, 5));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let uploadedFiles = [];
      if (files.length > 0) { const result = await uploadFiles(files); uploadedFiles = result.files; }
      const mode = subMode === 'build' ? 'build-brand' : 'discover-build';
      const intake = subMode === 'build' ? { ...buildForm, files: uploadedFiles } : { ...discoverForm, files: uploadedFiles };
      const profile = await createProfile({ mode, intake });
      const research = await runAiAction('market-research', { profile, sessionId });
      profile.research = research.research;
      if (research.cost) addSpend(research.cost);
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

      {step === 'submode' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">How would you like to start?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card selected={subMode === 'build'} onClick={() => setSubMode('build')}>
              <Lightbulb className="w-7 h-7 text-brand-purple mb-3" />
              <h3 className="font-semibold text-[15px] mb-1">Build My Brand</h3>
              <p className="text-[13px] text-content-secondary">I have a brand idea — help me build it out.</p>
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

      {step === 'files' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">Upload Research Files</h2>
          <p className="text-content-secondary text-sm">PDFs, screenshots, research images — max 5 files. Optional.</p>
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
