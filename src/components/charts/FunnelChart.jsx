import { GlassCard } from '../ui/GlassCard';

export function FunnelChartView({ data }) {
  const max = data[0].value;
  return (
    <GlassCard className="p-6" interactive={false}>
      <div className="mb-5">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Retention funnel</p>
        <h3 className="font-display text-2xl italic text-white">How intent narrows into loyalty</h3>
      </div>
      <div className="space-y-4">
        {data.map((stage, index) => (
          <div key={stage.stage} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-white">
              <span>{stage.stage}</span>
              <span className="tabular-nums">{stage.value.toLocaleString()} {index > 0 && <span className="text-[color:var(--text-muted)]">· -{stage.dropoff}%</span>}</span>
            </div>
            <div className="h-12 overflow-hidden rounded-[18px] bg-white/6">
              <div
                className="flex h-full items-center rounded-[18px] bg-gradient-to-r from-[color:var(--accent-secondary)] to-[color:var(--accent-primary)] px-4 text-sm font-semibold text-white"
                style={{ width: `${stage.value / max * 100}%` }}
              >
                {Math.round(stage.value / max * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
