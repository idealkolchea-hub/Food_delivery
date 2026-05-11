import { motion } from 'framer-motion';

export function Pill({ active, children, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`bb-chip px-4 py-2 text-sm normal-case tracking-[0.02em] ${active ? 'border-[rgba(239,127,26,0.34)] bg-[rgba(239,127,26,0.18)] text-white' : 'bb-chip--soft text-[color:var(--text-secondary)]'} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
