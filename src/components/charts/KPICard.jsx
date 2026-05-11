import { ResponsiveContainer, Line, LineChart } from 'recharts';
import { motion, useTransform } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

export function KPICard({ metric }) {
  const spring = useAnimatedCounter(metric.value);
  const displayValue = useTransform(spring, (latest) => {
    if (metric.label === 'Customer Rating') return latest.toFixed(1);
    if (metric.prefix === '$') return `${metric.prefix}${Math.round(latest).toLocaleString()}`;
    if (metric.suffix) return `${Math.round(latest)}${metric.suffix}`;
    return Math.round(latest).toLocaleString();
  });

  return (
    <GlassCard className="p-5" interactive>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{metric.label}</p>
          <motion.p className="text-3xl font-extrabold tabular-nums text-white">{displayValue}</motion.p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${metric.delta >= 0 ? 'bg-emerald-400/12 text-emerald-300' : 'bg-amber-300/12 text-amber-200'}`}>
          {metric.delta >= 0 ? '+' : ''}{metric.delta}%
        </span>
      </div>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metric.sparkline.map((value, index) => ({ x: index, value }))}>
            <Line type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
