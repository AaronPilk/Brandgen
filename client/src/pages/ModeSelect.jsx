import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Target, ArrowRight, Sparkles, Zap, Clock, Link2 } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function ModeSelect() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleStart = () => {
    if (selected === 'brand') navigate('/build-brand');
    if (selected === 'lead') navigate('/lead-gen');
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center min-h-[90vh] justify-center -mt-8"
    >
      {/* Powered badge */}
      <motion.div variants={item}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-purple/20 bg-brand-purple/5 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
          <span className="text-[12px] font-medium text-brand-purple">
            Powered by Claude AI + DALL·E 3
          </span>
        </div>
      </motion.div>

      {/* Hero Headline */}
      <motion.div variants={item} className="text-center mb-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-content-primary">
          Build a brand.
        </h1>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] bg-gradient-to-r from-brand-purple via-brand-purple-light to-brand-purple bg-clip-text text-transparent">
          Deploy in 48 hours.
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.p variants={item} className="text-content-secondary text-center text-lg max-w-xl mb-12 leading-relaxed">
        AI researches trends, builds your brand assets, writes your
        ads, and connects your tools — all in one flow.
      </motion.p>

      {/* Mode Cards */}
      <motion.div variants={item} className="grid md:grid-cols-2 gap-4 w-full max-w-3xl mb-8">
        {/* ECOM Card */}
        <motion.button
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={() => setSelected('brand')}
          className={`relative text-left p-6 rounded-2xl border transition-all duration-300 ${
            selected === 'brand'
              ? 'border-brand-purple bg-brand-purple/[0.08] shadow-purple'
              : 'border-surface-border bg-surface-card hover:border-brand-purple/30'
          }`}
        >
          {selected === 'brand' && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-brand-purple rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          )}
          <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center mb-4">
            <ShoppingBag className="w-5 h-5 text-content-secondary" />
          </div>
          <div className="text-[11px] font-semibold text-brand-purple uppercase tracking-wider mb-1.5">ECOM</div>
          <h3 className="text-lg font-bold text-content-primary mb-2">Build a sellable brand</h3>
          <p className="text-[13px] text-content-secondary mb-4 leading-relaxed">
            Products, drop shipping, and DTC brands with Printful fulfillment.
          </p>
          <ul className="space-y-2">
            {[
              'Trend-researched product selection',
              'Full brand identity + logo',
              'Shopify-ready landing page',
              'Ad creatives for Meta & TikTok',
              'Printful fulfillment connected',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12px] text-content-secondary">
                <span className="text-brand-purple mt-0.5">•</span> {f}
              </li>
            ))}
          </ul>
        </motion.button>

        {/* LEAD GEN Card */}
        <motion.button
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={() => setSelected('lead')}
          className={`relative text-left p-6 rounded-2xl border transition-all duration-300 ${
            selected === 'lead'
              ? 'border-brand-purple bg-brand-purple/[0.08] shadow-purple'
              : 'border-surface-border bg-surface-card hover:border-brand-purple/30'
          }`}
        >
          {selected === 'lead' && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-brand-purple rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          )}
          <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center mb-4">
            <Target className="w-5 h-5 text-content-secondary" />
          </div>
          <div className="text-[11px] font-semibold text-brand-purple uppercase tracking-wider mb-1.5">LEAD GEN</div>
          <h3 className="text-lg font-bold text-content-primary mb-2">Build a full funnel system</h3>
          <p className="text-[13px] text-content-secondary mb-4 leading-relaxed">
            Service businesses, local operators, and agency clients.
          </p>
          <ul className="space-y-2">
            {[
              'Industry-specific funnel copy',
              'Lead capture landing page',
              'GoHighLevel / HubSpot integration',
              'SMS + email follow-up sequences',
              '10 ad creatives for Meta',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12px] text-content-secondary">
                <span className="text-brand-purple mt-0.5">•</span> {f}
              </li>
            ))}
          </ul>
        </motion.button>
      </motion.div>

      {/* CTA */}
      <motion.div variants={item} className="flex flex-col items-center mb-16">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          disabled={!selected}
          className={`px-10 py-4 rounded-2xl text-white font-semibold text-[15px] flex items-center gap-2 transition-all duration-300 ${
            selected
              ? 'bg-brand-purple hover:bg-brand-purple-dark shadow-lg shadow-brand-purple/30 hover:shadow-brand-purple/50'
              : 'bg-surface-border text-content-muted cursor-not-allowed'
          }`}
        >
          Start Building <ArrowRight className="w-4 h-4" />
        </motion.button>
        <p className="text-[12px] text-content-muted mt-3">
          Select a mode above to continue
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="flex items-center gap-12 md:gap-16">
        <Stat icon={Zap} value="Real-time" label="trend data" />
        <Stat icon={Clock} value="48 hours" label="to deploy" />
        <Stat icon={Link2} value="10+" label="integrations" />
      </motion.div>
    </motion.div>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon className="w-4 h-4 text-content-muted mb-2" />
      <span className="text-lg font-bold text-content-primary">{value}</span>
      <span className="text-[11px] text-content-muted">{label}</span>
    </div>
  );
}
