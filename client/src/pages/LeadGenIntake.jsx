import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Upload, Building2, Rocket } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import { useStore } from '../store/useStore';
import { createProfile, runAiAction, uploadFiles } from '../services/api';

const BUDGETS = ['$500', '$1k', '$2.5k', '$5k', '$10k+'];
const GOALS = ['Book a Call', 'Fill Out a Form', 'Get a Quote', 'Download a Lead Magnet'];
const SALES_CYCLES = ['Same day', '1-7 days', '1-4 weeks', '1-3 months', '3+ months'];
const REVENUES = ['Under $10k', '$10k-$50k', '$50k-$100k', '$100k+'];
const CHANNELS = ['Meta Ads', 'Google Ads', 'SEO', 'Email', 'None', 'Other'];

const STEPS = ['stage', 'basics', 'goals', 'details', 'files'];

export default function LeadGenIntake() {
  const navigate = useNavigate();
  const { setCurrentProfile, addSpend, sessionId } = useStore();
  const [step, setStep] = useState('stage');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  const [form, setForm] = useState({
    businessStage: '',
    industry: '',
    businessType: '',
    geoTargets: '',
    adBudget: '',
    primaryGoal: '',
    customerLTV: '',
    currentCRM: '',
    painPoint: '',
    salesCycle: '',
    differentiator: '',
    // Operating-only fields
    monthlyRevenue: '',
    leadVolume: '',
    websiteUrl: '',
    marketingChannels: [],
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const isOperating = form.businessStage === 'operating';

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
  };

  const toggleChannel = (ch) => {
    set(
      'marketingChannels',
      form.marketingChannels.includes(ch)
        ? form.marketingChannels.filter((c) => c !== ch)
        : [...form.marketingChannels, ch]
    );
  };

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
      // Upload files if any
      let uploadedFiles = [];
      if (files.length > 0) {
        const result = await uploadFiles(files);
        uploadedFiles = result.files;
      }

      // Create profile
      const profile = await createProfile({
        mode: 'lead-gen',
        intake: { ...form, files: uploadedFiles },
      });

      // Auto-run market research
      const research = await runAiAction('market-research', {
        profile,
        sessionId,
      });

      profile.research = research.research;
      if (research.cost) addSpend(research.cost);

      setCurrentProfile(profile);
      navigate(`/dashboard/${profile.id}`);
    } catch (err) {
      console.error(err);
      alert('Error creating profile: ' + err.message);
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
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-content-secondary hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-bold mb-2">Lead Gen Profile</h1>
      <p className="text-content-secondary mb-6">Tell us about your business so we can build your lead generation system.</p>

      <ProgressBar steps={STEPS} currentStep={step} />

      {/* Step: Business Stage */}
      {step === 'stage' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">What stage is your business?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card
              selected={form.businessStage === 'starting'}
              onClick={() => set('businessStage', 'starting')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="w-6 h-6 text-brand-purple" />
                <h3 className="font-semibold text-lg">Starting a Business</h3>
              </div>
              <p className="text-sm text-content-secondary">I'm launching something new and need a complete setup.</p>
            </Card>
            <Card
              selected={form.businessStage === 'operating'}
              onClick={() => set('businessStage', 'operating')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-6 h-6 text-brand-purple" />
                <h3 className="font-semibold text-lg">Already Operating</h3>
              </div>
              <p className="text-sm text-content-secondary">I have a business and need more leads.</p>
              <p className="text-xs text-brand-purple/70 mt-2">We'll skip brand setup and focus on getting you more leads.</p>
            </Card>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={nextStep} disabled={!form.businessStage}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step: Basics */}
      {step === 'basics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Business Details</h2>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Industry</label>
            <input
              value={form.industry}
              onChange={(e) => set('industry', e.target.value)}
              placeholder="e.g. Roofing, Insurance, HVAC, Real Estate"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Business Type</label>
            <div className="flex gap-3">
              {['Local', 'Regional', 'National'].map((t) => (
                <button
                  key={t}
                  onClick={() => set('businessType', t.toLowerCase())}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    form.businessType === t.toLowerCase()
                      ? 'border-brand-purple bg-brand-purple/10 text-white'
                      : 'border-surface-border bg-surface-card text-content-secondary hover:border-surface-border/80'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Geographic Targets</label>
            <input
              value={form.geoTargets}
              onChange={(e) => set('geoTargets', e.target.value)}
              placeholder="e.g. Dallas TX, Houston TX, Austin TX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Current CRM</label>
            <div className="flex gap-3">
              {['GoHighLevel', 'HubSpot', 'None'].map((c) => (
                <button
                  key={c}
                  onClick={() => set('currentCRM', c)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    form.currentCRM === c
                      ? 'border-brand-purple bg-brand-purple/10 text-white'
                      : 'border-surface-border bg-surface-card text-content-secondary'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {isOperating && (
            <>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Monthly Revenue</label>
                <div className="grid grid-cols-2 gap-2">
                  {REVENUES.map((r) => (
                    <button
                      key={r}
                      onClick={() => set('monthlyRevenue', r)}
                      className={`py-2.5 rounded-xl border text-sm transition-all ${
                        form.monthlyRevenue === r
                          ? 'border-brand-purple bg-brand-purple/10 text-white'
                          : 'border-surface-border bg-surface-card text-content-secondary'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Current Monthly Lead Volume</label>
                <input
                  value={form.leadVolume}
                  onChange={(e) => set('leadVolume', e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Existing Website URL</label>
                <input
                  value={form.websiteUrl}
                  onChange={(e) => set('websiteUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Current Marketing Channels</label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                        form.marketingChannels.includes(ch)
                          ? 'border-brand-purple bg-brand-purple/10 text-white'
                          : 'border-surface-border bg-surface-card text-content-secondary'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={nextStep} disabled={!form.industry}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step: Goals */}
      {step === 'goals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Goals & Budget</h2>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Monthly Ad Budget</label>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => set('adBudget', b)}
                  className={`px-4 py-2.5 rounded-xl border text-sm transition-all ${
                    form.adBudget === b
                      ? 'border-brand-purple bg-brand-purple/10 text-white'
                      : 'border-surface-border bg-surface-card text-content-secondary'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Primary Goal</label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => set('primaryGoal', g)}
                  className={`py-2.5 rounded-xl border text-sm transition-all ${
                    form.primaryGoal === g
                      ? 'border-brand-purple bg-brand-purple/10 text-white'
                      : 'border-surface-border bg-surface-card text-content-secondary'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Average Customer LTV</label>
            <input
              value={form.customerLTV}
              onChange={(e) => set('customerLTV', e.target.value)}
              placeholder="e.g. $5,000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Average Sales Cycle Length</label>
            <div className="flex flex-wrap gap-2">
              {SALES_CYCLES.map((s) => (
                <button
                  key={s}
                  onClick={() => set('salesCycle', s)}
                  className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                    form.salesCycle === s
                      ? 'border-brand-purple bg-brand-purple/10 text-white'
                      : 'border-surface-border bg-surface-card text-content-secondary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={nextStep} disabled={!form.primaryGoal}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step: Details */}
      {step === 'details' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Tell Us More</h2>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Biggest Pain Point in Getting Leads
            </label>
            <textarea
              rows={3}
              value={form.painPoint}
              onChange={(e) => set('painPoint', e.target.value)}
              placeholder="What's your biggest challenge with lead generation?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              What Makes You Different From Competitors
            </label>
            <textarea
              rows={3}
              value={form.differentiator}
              onChange={(e) => set('differentiator', e.target.value)}
              placeholder="Why should customers choose you?"
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

      {/* Step: Files */}
      {step === 'files' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Upload Supporting Files</h2>
          <p className="text-content-secondary text-sm mb-4">
            PDFs, competitor screenshots, images — max 5 files. Optional.
          </p>

          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-surface-border rounded-2xl cursor-pointer hover:border-brand-purple/50 transition-colors">
            <Upload className="w-8 h-8 text-content-muted mb-2" />
            <span className="text-sm text-content-secondary">
              {files.length > 0
                ? `${files.length} file(s) selected`
                : 'Click to upload or drag and drop'}
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
                <div key={i} className="flex items-center gap-2 text-sm text-content-secondary bg-surface-raised rounded-lg px-3 py-2">
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
