import { motion } from 'framer-motion';

export function Button({ children, className = '', variant = 'primary', ...props }) {
  const variants = {
    primary: 'bb-button bb-button-primary',
    secondary: 'bb-button bb-button-secondary',
    ghost: 'bb-button bb-button-ghost',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
