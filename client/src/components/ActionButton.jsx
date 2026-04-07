import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  skipConfirm,
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
    if (skipConfirm) {
      await onExecute();
      return;
    }
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
        whileHover={!disabled && !completed ? { y: -2 } : undefined}
        whileTap={!disabled && !completed ? { scale: 0.985 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={handleClick}
        disabled={disabled || loading}
        className={`group relative w-full text-left p-5 rounded-2xl transition-all duration-300 ${
          completed
            ? 'glossy border-green-500/20'
            : disabled
            ? 'glossy opacity-40 cursor-not-allowed'
            : 'glossy hover:shadow-elevated-lg cursor-pointer'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl transition-all duration-300 ${
              completed
                ? 'bg-green-500/10 text-green-500'
                : loading
                ? 'bg-brand-purple/10 text-brand-purple'
                : 'bg-surface-raised text-content-muted group-hover:bg-brand-purple/10 group-hover:text-brand-purple'
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
              <h3 className="font-semibold text-content-primary text-[15px]">{label}</h3>
              {estimate && !completed && (
                <span className="text-[11px] text-content-muted flex items-center gap-0.5 font-mono">
                  <DollarSign className="w-3 h-3" />{estimate.estimatedCost}
                </span>
              )}
            </div>
            <p className="text-[13px] text-content-secondary mt-0.5 leading-relaxed">{description}</p>
            {disabled && disabledReason && (
              <p className="text-[11px] text-orange-500 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {disabledReason}
              </p>
            )}
          </div>
        </div>
      </motion.button>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmOpen(false)}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative glass border border-surface-border rounded-3xl p-6 max-w-sm w-full shadow-elevated-lg"
            >
              <h3 className="text-lg font-semibold text-content-primary mb-1">Confirm & Generate?</h3>
              <p className="text-content-secondary text-sm mb-5">{label}</p>
              {estimate && (
                <div className="bg-surface-raised rounded-2xl p-4 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-content-secondary">Estimated cost</span>
                    <span className="text-brand-purple font-mono font-semibold">
                      ~${estimate.estimatedCost}
                    </span>
                  </div>
                  {estimate.breakdown.images > 0 && (
                    <div className="flex justify-between text-content-muted text-xs mt-1.5">
                      <span>Includes {estimate.breakdown.images} image(s)</span>
                      <span>${estimate.breakdown.imageCost}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-surface-raised text-content-secondary hover:text-content-primary text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={execute}
                  className="flex-1 py-3 rounded-2xl bg-brand-purple hover:bg-brand-purple-dark text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-purple/25"
                >
                  Generate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
