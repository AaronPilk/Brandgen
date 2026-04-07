import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Upload, Building2, Rocket } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import LoadingOverlay from '../components/LoadingOverlay';
import { useStore } from '../store/useStore';
import { createProfile, runAiAction, uploadFiles } from '../services/api';

const BUDGETS = ['$500', '$1k', '$2.5k', '$5k', '$10k+'];
const GOALS = ['Book a Call', 'Fill Out a Form', 'Get a Quote', 'Download a Lead Magnet'];
const SALES_CYCLES = ['Same day', '1-7 days', '1-4 weeks', '1-3 months', '3+ months'];
const REVENUES = ['Under $10k', '$10k-$50k', '$50k-$100k', '$100k+'];
const CHANNELS = ['Meta Ads', 'Google Ads', 'SEO', 'Email', 'None', 'Other'];

const STEPS = ['stage', 'basics', 'goals', 'details', 'files'];

function Chip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 ${
        selected
          ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
          : 'bg-surface-raised text-content-secondary hover:text-content-primary hover:bg-surface-card border border-surface-border'
      }`}
    >
      {label}
    </button>
  );
}

function Label({ children }) {
  return <label className="block text-[13px] font-medium text-content-secondary mb-2">{children}</label>;
}

export default function LeadGenIntake() {
  const navigate = useNavigate();
  const { setCurrentProfile, addSpend, sessionId } = useStore();
  const [step, setStep] = useState('stage');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  const [form, setForm] = useState({
    businessStage: '', industry: '', businessType: '', geoTargets: '',
    adBudget: '', primaryGoal: '', customerLTV: '', currentCRM: '',
    painPoint: '', salesCycle: '', differentiator: '',
    monthlyRevenue: '', leadVolume: '', websiteUrl: '', marketingChannels: [],
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const isOperating = form.businessStage === 'operating';
  const handleFileChange = (e) => setFiles(Array.from(e.target.files).slice(0, 5));
  const toggleChannel = (ch) => set('marketingChannels',
    form.marketingChannels.includes(ch)
      ? form.marketingChannels.filter((c) => c !== ch)
      : [...form.marketingChannels, ch]
  );

  const nextStep = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };
  const prevStep = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let uploadedFiles = [];
      if (files.length > 0) {
        const result = await uploadFiles(files);
        uploadedFiles = result.files;
      }
      const profile = await createProfile({ mode: 'lead-gen', intake: { ...form, files: uploadedFiles } });
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <LoadingOverlay visible={loading} label="Running Market Research..." />
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-content-muted hover:text-content-primary mb-8 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-title mb-1">Lead Gen Profile</h1>
      <p className="text-content-secondary text-[15px] mb-8">Tell us about your business to build your lead system.</p>

      <ProgressBar steps={STEPS} currentStep={step} />

      {step === 'stage' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">What stage is your business?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card selected={form.businessStage === 'starting'} onClick={() => set('businessStage', 'starting')}>
              <Rocket className="w-7 h-7 text-brand-purple mb-3" />
              <h3 className="font-semibold text-[15px] mb-1">Starting a Business</h3>
              <p className="text-[13px] text-content-secondary">Launching something new and need a complete setup.</p>
            </Card>
            <Card selected={form.businessStage === 'operating'} onClick={() => set('businessStage', 'operating')}>
              <Building2 className="w-7 h-7 text-brand-purple mb-3" />
              <h3 className="font-semibold text-[15px] mb-1">Already Operating</h3>
              <p className="text-[13px] text-content-secondary">I have a business and need more leads.</p>
              <p className="text-[11px] text-brand-purple mt-2 font-medium">We'll skip brand setup and focus on leads.</p>
            </Card>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={nextStep} disabled={!form.businessStage}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {step === 'basics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">Business Details</h2>
          <div>
            <Label>Industry</Label>
            <input value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. Roofing, Insurance, HVAC, Real Estate" />
          </div>
          <div>
            <Label>Business Type</Label>
            <div className="flex gap-2">
              {['Local', 'Regional', 'National'].map((t) => (
                <Chip key={t} label={t} selected={form.businessType === t.toLowerCase()} onClick={() => set('businessType', t.toLowerCase())} />
              ))}
            </div>
          </div>
          <div>
            <Label>Geographic Targets</Label>
            <input value={form.geoTargets} onChange={(e) => set('geoTargets', e.target.value)} placeholder="e.g. Dallas TX, Houston TX, Austin TX" />
          </div>
          <div>
            <Label>Current CRM</Label>
            <div className="flex gap-2">
              {['GoHighLevel', 'HubSpot', 'None'].map((c) => (
                <Chip key={c} label={c} selected={form.currentCRM === c} onClick={() => set('currentCRM', c)} />
              ))}
            </div>
          </div>
          {isOperating && (
            <>
              <div>
                <Label>Monthly Revenue</Label>
                <div className="grid grid-cols-2 gap-2">
                  {REVENUES.map((r) => <Chip key={r} label={r} selected={form.monthlyRevenue === r} onClick={() => set('monthlyRevenue', r)} />)}
                </div>
              </div>
              <div>
                <Label>Current Monthly Lead Volume</Label>
                <input value={form.leadVolume} onChange={(e) => set('leadVolume', e.target.value)} placeholder="e.g. 50" />
              </div>
              <div>
                <Label>Existing Website URL</Label>
                <input value={form.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Current Marketing Channels</Label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((ch) => <Chip key={ch} label={ch} selected={form.marketingChannels.includes(ch)} onClick={() => toggleChannel(ch)} />)}
                </div>
              </div>
            </>
          )}
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={nextStep} disabled={!form.industry}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {step === 'goals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">Goals & Budget</h2>
          <div>
            <Label>Monthly Ad Budget</Label>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => <Chip key={b} label={b} selected={form.adBudget === b} onClick={() => set('adBudget', b)} />)}
            </div>
          </div>
          <div>
            <Label>Primary Goal</Label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => <Chip key={g} label={g} selected={form.primaryGoal === g} onClick={() => set('primaryGoal', g)} />)}
            </div>
          </div>
          <div>
            <Label>Average Customer LTV</Label>
            <input value={form.customerLTV} onChange={(e) => set('customerLTV', e.target.value)} placeholder="e.g. $5,000" />
          </div>
          <div>
            <Label>Average Sales Cycle Length</Label>
            <div className="flex flex-wrap gap-2">
              {SALES_CYCLES.map((s) => <Chip key={s} label={s} selected={form.salesCycle === s} onClick={() => set('salesCycle', s)} />)}
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={nextStep} disabled={!form.primaryGoal}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {step === 'details' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">Tell Us More</h2>
          <div>
            <Label>Biggest Pain Point in Getting Leads</Label>
            <textarea rows={3} value={form.painPoint} onChange={(e) => set('painPoint', e.target.value)} placeholder="What's your biggest challenge with lead generation?" />
          </div>
          <div>
            <Label>What Makes You Different From Competitors</Label>
            <textarea rows={3} value={form.differentiator} onChange={(e) => set('differentiator', e.target.value)} placeholder="Why should customers choose you?" />
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={nextStep}>Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </motion.div>
      )}

      {step === 'files' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <h2 className="text-lg font-semibold">Upload Supporting Files</h2>
          <p className="text-content-secondary text-sm">PDFs, competitor screenshots, images — max 5 files. Optional.</p>
          <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-surface-border rounded-3xl cursor-pointer hover:border-brand-purple/30 hover:bg-brand-purple/[0.02] transition-all duration-300">
            <Upload className="w-8 h-8 text-content-muted mb-3" />
            <span className="text-sm text-content-secondary font-medium">
              {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload'}
            </span>
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
            <Button onClick={handleSubmit} loading={loading}>
              {loading ? 'Running Research...' : 'Create Profile'}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
