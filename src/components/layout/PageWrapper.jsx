import { motion } from 'framer-motion';

export const pageVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delayChildren: 0.1, staggerChildren: 0.06 },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.98,
    filter: 'blur(4px)',
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

export const childVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

export function PageWrapper({ children, className = '' }) {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`bb-page relative z-10 min-h-screen px-4 pb-12 pt-28 md:px-8 xl:px-12 ${className}`}
    >
      {children}
    </motion.main>
  );
}
