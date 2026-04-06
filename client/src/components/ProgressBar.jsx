import { motion } from 'framer-motion';

export default function ProgressBar({ steps, currentStep }) {
  const currentIdx = steps.indexOf(currentStep);

  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((step, i) => (
        <div key={step} className="flex-1 flex items-center gap-1">
          <motion.div
            className={`h-1 w-full rounded-full ${
              i <= currentIdx ? 'bg-brand-purple' : 'bg-brand-dark-border'
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.05 }}
          />
        </div>
      ))}
    </div>
  );
}
