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
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all';

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const variants = {
    primary:
      'bg-brand-purple hover:bg-brand-purple-dark text-white shadow-lg shadow-brand-purple/25',
    secondary:
      'bg-surface-raised border border-surface-border text-content-primary hover:border-brand-purple/50',
    ghost: 'text-content-secondary hover:text-content-primary hover:bg-surface-raised',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
