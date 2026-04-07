import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function LoadingOverlay({ label, visible }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Initializing...');

  useEffect(() => {
    if (!visible) { setProgress(0); return; }

    const stages = [
      { at: 5, text: 'Preparing context...' },
      { at: 15, text: 'Analyzing profile data...' },
      { at: 30, text: 'Sending to Claude AI...' },
      { at: 50, text: 'Generating content...' },
      { at: 70, text: 'Processing response...' },
      { at: 85, text: 'Finalizing output...' },
      { at: 95, text: 'Almost done...' },
    ];

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return 95;
        const next = p + (Math.random() * 3 + 0.5);
        const current = stages.filter((s) => s.at <= next).pop();
        if (current) setStage(current.text);
        return Math.min(next, 95);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [visible]);

  // Snap to 100% when finishing
  useEffect(() => {
    if (!visible && progress > 0) {
      setProgress(100);
      setStage('Complete!');
      const t = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative glossy rounded-3xl p-8 max-w-sm w-full text-center shadow-elevated-lg"
      >
        <div className="relative z-10">
          <Loader2 className="w-8 h-8 text-brand-purple animate-spin mx-auto mb-4" />
          <h3 className="text-[15px] font-semibold text-content-primary mb-1">{label || 'Generating...'}</h3>
          <p className="text-[13px] text-content-secondary mb-5">{stage}</p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-surface-border rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-purple to-brand-purple-light rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          </div>
          <p className="text-[12px] font-mono text-brand-purple">{Math.round(progress)}%</p>
        </div>
      </motion.div>
    </div>
  );
}
