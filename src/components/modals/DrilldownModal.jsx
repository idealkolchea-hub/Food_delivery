import { AnimatePresence, motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';

export function DrilldownModal({ open, title, subtitle, children, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-[rgba(6,8,18,0.58)] backdrop-blur-md"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            className="fixed bottom-0 left-0 right-0 z-[71] p-4 md:p-6"
          >
            <GlassCard interactive={false} className="mx-auto max-w-4xl rounded-[28px] p-6 md:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{subtitle}</p>
                  <h3 className="font-display text-3xl italic text-white">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white"
                >
                  ✕
                </button>
              </div>
              {children}
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
