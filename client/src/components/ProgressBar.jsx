import { motion } from 'framer-motion';

export default function ProgressBar({ steps, currentStep }) {
  const currentIdx = steps.indexOf(currentStep);
  const progress = ((currentIdx + 1) / steps.length) * 100;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-content-muted">
          Step {currentIdx + 1} of {steps.length}
        </span>
        <span className="text-xs font-medium text-brand-purple">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-1 w-full bg-surface-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand-purple rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
}
