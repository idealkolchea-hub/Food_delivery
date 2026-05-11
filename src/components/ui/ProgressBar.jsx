import { motion } from 'framer-motion';

export function ProgressBar({ progress, className = '', color = 'var(--accent-primary)' }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-white/8 ${className}`}>
      <motion.div
        className="h-full rounded-full"
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 140, damping: 20 }}
        style={{ background: color }}
      />
    </div>
  );
}
