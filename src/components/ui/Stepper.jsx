import { motion } from 'framer-motion';

export function Stepper({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-2 py-2">
      {['-', '+'].map((symbol) => (
        <motion.button
          key={symbol}
          whileHover={{ scale: 1.08, boxShadow: '0 0 20px var(--accent-glow)' }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-lg font-semibold text-[color:var(--text-primary)]"
          onClick={() => onChange(symbol === '+' ? value + 1 : value - 1)}
        >
          {symbol}
        </motion.button>
      ))}
      <span className="min-w-6 text-center text-sm font-bold tabular-nums text-[color:var(--text-primary)]">{value}</span>
    </div>
  );
}
