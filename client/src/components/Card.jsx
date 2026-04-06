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
        selected ? 'glossy-selected' : 'glossy hover:shadow-elevated-lg'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-brand-purple rounded-full flex items-center justify-center shadow-lg shadow-brand-purple/30 z-10">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
