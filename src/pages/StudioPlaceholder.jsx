import { motion } from 'framer-motion';
import { Badge } from '../components/ui/Badge';
import { GlassCard } from '../components/ui/GlassCard';
import { childVariants } from '../components/layout/PageWrapper';

export default function StudioPlaceholder() {
  return (
    <motion.section variants={childVariants} className="space-y-6">
      <GlassCard interactive={false} className="p-8 md:p-10">
        <div className="mb-5 flex flex-wrap gap-3">
          <Badge>Studio placeholder</Badge>
          <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">Phase 1 isolation</Badge>
        </div>
        <h2 className="font-display text-5xl italic text-white">Studio is isolated from the customer and partner products</h2>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--text-secondary)]">
          This minimal surface exists only to reserve the studio route family and its shell. Full studio functionality is intentionally out of scope for this phase.
        </p>
      </GlassCard>
    </motion.section>
  );
}
