import { motion } from 'framer-motion';

export default function Card({
  children,
  onClick,
  selected,
  className = '',
  disabled,
}) {
  return (
    <motion.div
      whileHover={!disabled ? { y: -3, scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={disabled ? undefined : onClick}
      className={`relative rounded-3xl p-6 transition-all duration-300 ${
        selected
          ? 'bg-surface-card border-2 border-brand-purple shadow-purple'
          : 'bg-surface-card border border-surface-border shadow-glass hover:shadow-glass-lg hover:border-brand-purple/20'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {selected && (
        <div className="absolute -top-px -right-px w-6 h-6 bg-brand-purple rounded-bl-2xl rounded-tr-[1.4rem] flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      )}
      {children}
    </motion.div>
  );
}
