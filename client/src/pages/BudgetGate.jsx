import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';
import { setBudget as setBudgetApi } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

const PRESETS = [5, 10, 20, 50];

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[80vh]"
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center mb-6">
        <Zap className="w-8 h-8 text-brand-purple" />
      </div>

      <h1 className="text-3xl font-bold mb-2 text-center">
        Welcome to Brand<span className="text-brand-purple">Gen</span>
      </h1>
      <p className="text-gray-400 text-center mb-8 max-w-md">
        Before we start, set your daily API spend limit. This keeps your costs under control.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-4">
        {PRESETS.map((amount) => (
          <Card
            key={amount}
            selected={selected === amount}
            onClick={() => { setSelected(amount); setCustom(''); }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-1">
              <DollarSign className="w-4 h-4 text-brand-purple" />
              <span className="text-2xl font-bold">{amount}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">per day</p>
          </Card>
        ))}
      </div>

      <div className="w-full max-w-md mb-6">
        <Card
          selected={selected === 'custom'}
          onClick={() => setSelected('custom')}
        >
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Custom:</span>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setSelected('custom'); }}
                placeholder="Enter amount"
                className="bg-transparent border-none p-0 text-lg font-semibold focus:ring-0 w-full"
                min="1"
              />
            </div>
          </div>
        </Card>
      </div>

      <Button
        onClick={handleContinue}
        loading={loading}
        disabled={!selected || (selected === 'custom' && (!custom || parseFloat(custom) <= 0))}
        size="lg"
        className="w-full max-w-md"
      >
        Continue
      </Button>

      <p className="text-xs text-gray-600 mt-4 text-center max-w-sm">
        No money will be spent without your explicit approval. Every action shows its estimated cost first.
      </p>
    </motion.div>
  );
}
