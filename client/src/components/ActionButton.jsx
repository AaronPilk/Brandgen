import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, AlertTriangle, DollarSign } from 'lucide-react';
import { getEstimate } from '../services/api';
import { useStore } from '../store/useStore';

export default function ActionButton({
  icon: Icon,
  label,
  description,
  actionKey,
  onExecute,
  completed,
  disabled,
  disabledReason,
}) {
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { autonomousMode } = useStore();

  useEffect(() => {
    getEstimate(actionKey).then(setEstimate).catch(() => {});
  }, [actionKey]);

  const handleClick = async () => {
    if (disabled || loading || completed) return;

    if (autonomousMode) {
      await execute();
    } else {
      setConfirmOpen(true);
    }
  };

  const execute = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await onExecute();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={!disabled && !completed ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !completed ? { scale: 0.98 } : undefined}
        onClick={handleClick}
        disabled={disabled || loading}
        className={`relative w-full text-left p-5 rounded-2xl border transition-all ${
          completed
            ? 'border-green-600/50 bg-green-900/10 dark:bg-green-900/10 bg-green-50'
            : disabled
            ? 'border-surface-border bg-surface-card opacity-50 cursor-not-allowed'
            : 'border-surface-border bg-surface-card hover:border-brand-purple/50 hover:bg-surface-raised cursor-pointer'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl ${
              completed
                ? 'bg-green-900/30 dark:bg-green-900/30 bg-green-100 text-green-600 dark:text-green-400'
                : 'bg-brand-purple/10 text-brand-purple'
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : completed ? (
              <Check className="w-5 h-5" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-content-primary">{label}</h3>
              {estimate && !completed && (
                <span className="text-xs text-content-muted flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />~${estimate.estimatedCost}
                </span>
              )}
            </div>
            <p className="text-sm text-content-secondary mt-1">{description}</p>
            {disabled && disabledReason && (
              <p className="text-xs text-orange-400 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {disabledReason}
              </p>
            )}
          </div>
        </div>
      </motion.button>

      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-card border border-surface-border rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-content-primary mb-2">Confirm & Generate?</h3>
            <p className="text-content-secondary text-sm mb-4">{label}</p>
            {estimate && (
              <div className="bg-surface-raised rounded-lg p-3 mb-4 text-sm">
                <div className="flex justify-between text-content-secondary">
                  <span>Estimated cost</span>
                  <span className="text-brand-purple-light font-mono">
                    ~${estimate.estimatedCost}
                  </span>
                </div>
                {estimate.breakdown.images > 0 && (
                  <div className="flex justify-between text-content-muted text-xs mt-1">
                    <span>Includes {estimate.breakdown.images} image(s)</span>
                    <span>${estimate.breakdown.imageCost}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface-raised border border-surface-border text-content-secondary hover:text-content-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={execute}
                className="flex-1 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white font-semibold transition-colors"
              >
                Generate
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
