import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  loading,
  className = '',
  size = 'md',
}) {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 overflow-hidden';

  const sizes = {
    sm: 'px-5 py-2.5 text-[13px]',
    md: 'px-6 py-3 text-[14px]',
    lg: 'px-8 py-4 text-[15px]',
  };

  const variants = {
    primary:
      'bg-brand-purple hover:bg-brand-purple-dark text-white shadow-lg shadow-brand-purple/25 hover:shadow-brand-purple/40',
    secondary:
      'bg-surface-raised border border-surface-border text-content-primary hover:bg-surface-card hover:border-brand-purple/30 hover:shadow-glass-lg',
    ghost: 'text-content-secondary hover:text-content-primary hover:bg-surface-raised',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.975 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
