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
      whileHover={!disabled ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={disabled ? undefined : onClick}
      className={`relative rounded-2xl border p-6 transition-all ${
        selected
          ? 'border-brand-purple bg-brand-purple/10 shadow-lg shadow-brand-purple/10'
          : 'border-surface-border bg-surface-card hover:border-brand-purple/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {selected && (
        <motion.div
          layoutId="card-glow"
          className="absolute inset-0 rounded-2xl border-2 border-brand-purple pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
      {children}
    </motion.div>
  );
}
