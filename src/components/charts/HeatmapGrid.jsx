import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';

const blocks = ['Morning', 'Lunch', 'Afternoon', 'Evening', 'Dinner', 'Late'];

export function HeatmapGrid({ data }) {
  const [tooltip, setTooltip] = useState(null);
  const max = Math.max(...data.flatMap((row) => blocks.map((block) => row[block.toLowerCase()])));

  return (
    <GlassCard className="relative p-6" interactive={false}>
      <div className="mb-5">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Peak hour heatmap</p>
        <h3 className="font-display text-2xl italic text-white">When the kitchen catches fire</h3>
      </div>
      <div className="grid grid-cols-[80px_repeat(6,minmax(0,1fr))] gap-2 text-center">
        <div />
        {blocks.map((block) => (
          <div key={block} className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{block}</div>
        ))}
        {data.map((row) => (
          <>
            <div key={`${row.day}-label`} className="flex items-center justify-start text-sm font-medium text-[color:var(--text-secondary)]">{row.day}</div>
            {blocks.map((block) => {
              const value = row[block.toLowerCase()];
              const opacity = 0.08 + value / max * 0.92;
              return (
                <button
                  key={`${row.day}-${block}`}
                  className="h-12 rounded-2xl border border-white/10 transition-transform hover:scale-[1.03]"
                  style={{ background: `rgba(255,107,53,${opacity})` }}
                  onMouseEnter={() => setTooltip({ day: row.day, block, value })}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </>
        ))}
      </div>
      {tooltip && (
        <div className="glass-card pointer-events-none absolute right-6 top-6 rounded-2xl px-3 py-2 text-sm text-white">
          {tooltip.day} · {tooltip.block}: {tooltip.value} orders
        </div>
      )}
    </GlassCard>
  );
}
