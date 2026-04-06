import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, DollarSign, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';
import { setBudget as setBudgetApi } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

const PRESETS = [
  { amount: 5, label: '$5', sub: 'Testing' },
  { amount: 10, label: '$10', sub: 'Starter' },
  { amount: 20, label: '$20', sub: 'Standard' },
  { amount: 50, label: '$50', sub: 'Pro' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function BudgetGate() {
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const { setBudget, sessionId } = useStore();

  const handleContinue = async () => {
    const limit = selected === 'custom' ? parseFloat(custom) : selected;
    if (!limit || limit <= 0) return;
    setLoading(true);
    try {
      await setBudgetApi(sessionId, limit);
      setBudget(limit);
    } catch {
      setBudget(limit);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[85vh]"
    >
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 rounded-3xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-6 animate-float">
          <Zap className="w-8 h-8 text-brand-purple" />
        </div>
        <h1 className="text-headline mb-3">
          Welcome to <span className="text-brand-purple">BrandGen</span>
        </h1>
        <p className="text-body-lg text-content-secondary max-w-md mx-auto">
          Set your daily API spend limit to get started. You're always in control.
        </p>
      </motion.div>

      {/* Budget Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mb-4"
      >
        {PRESETS.map(({ amount, label, sub }) => (
          <motion.div key={amount} variants={item}>
            <Card
              selected={selected === amount}
              onClick={() => { setSelected(amount); setCustom(''); }}
              className="text-center !p-5"
            >
              <span className="text-2xl font-bold tracking-tight text-content-primary">{label}</span>
              <p className="text-[11px] text-content-muted mt-1 font-medium">{sub}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Custom */}
      <motion.div variants={item} initial="hidden" animate="show" className="w-full max-w-lg mb-8">
        <Card
          selected={selected === 'custom'}
          onClick={() => setSelected('custom')}
          className="!p-4"
        >
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-content-muted" />
            <input
              type="number"
              value={custom}
              onChange={(e) => { setCustom(e.target.value); setSelected('custom'); }}
              placeholder="Custom amount"
              className="!bg-transparent !border-none !p-0 !text-lg !font-semibold !rounded-none focus:!ring-0 focus:!shadow-none"
              min="1"
            />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-lg"
      >
        <Button
          onClick={handleContinue}
          loading={loading}
          disabled={!selected || (selected === 'custom' && (!custom || parseFloat(custom) <= 0))}
          size="lg"
          className="w-full"
        >
          Get Started
        </Button>

        <div className="flex items-center justify-center gap-2 mt-5 text-content-muted">
          <Shield className="w-3.5 h-3.5" />
          <p className="text-[12px]">
            No charges without your approval. Every action shows its cost first.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
