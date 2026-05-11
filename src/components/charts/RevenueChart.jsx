import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-3xl px-4 py-3">
      <p className="mb-1 text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{label}</p>
      <p className="text-sm font-semibold text-white">${payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export function RevenueChart({ data, activeRange, onRangeChange, onPointSelect }) {
  return (
    <GlassCard className="p-6" interactive={false}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Revenue arc</p>
          <h3 className="font-display text-3xl italic text-white">How the room is spending</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <Button key={range} variant={activeRange === range ? 'primary' : 'secondary'} className="px-4 py-2 text-xs" onClick={() => onRangeChange(range)}>
              {range.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} onClick={(state) => state?.activePayload?.[0] && onPointSelect(state.activePayload[0].payload)}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#FF6B35" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={3} fill="url(#revenueGradient)" isAnimationActive animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
