import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../../hooks/useToast';

const glowByType = {
  success: '0 0 24px rgba(52, 211, 153, 0.25)',
  error: '0 0 24px rgba(239, 68, 68, 0.25)',
  info: '0 0 24px rgba(167, 139, 250, 0.25)',
};

export function ToastStack() {
  const { toasts } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[80] flex w-full max-w-xl -translate-x-1/2 flex-col items-center gap-3 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card pointer-events-auto w-full max-w-md overflow-hidden px-4 py-4"
            style={{ boxShadow: glowByType[toast.type] }}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">{toast.title}</p>
                <p className="text-sm text-[color:var(--text-secondary)]">{toast.description}</p>
              </div>
            </div>
            <motion.div
              className="h-1 rounded-full bg-[color:var(--accent-primary)]"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: (toast.duration || 3000) / 1000, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
