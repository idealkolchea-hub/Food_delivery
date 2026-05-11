import { motion } from 'framer-motion';

export function GlassCard({ as: Component = motion.div, className = '', interactive = true, children, ...props }) {
  return (
    <Component
      whileHover={interactive ? { y: -4, scale: 1.01, borderColor: 'rgba(255,255,255,0.22)' } : undefined}
      transition={interactive ? { type: 'spring', stiffness: 300, damping: 20 } : undefined}
      className={`glass-card bb-card ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
