import { ResponsiveContainer, XAxis, YAxis, BarChart, Bar, CartesianGrid, Cell } from 'recharts';
import { GlassCard } from '../ui/GlassCard';

export function LeaderboardChart({ data }) {
  return (
    <GlassCard className="p-6" interactive={false}>
      <div className="mb-5">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Top dishes</p>
        <h3 className="font-display text-2xl italic text-white">The dishes carrying the night</h3>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 8, bottom: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" width={140} stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
              <Bar dataKey="orders" radius={[0, 12, 12, 0]} isAnimationActive animationDuration={900}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={index % 2 === 0 ? '#FF6B35' : '#A78BFA'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.slice(0, 5).map((dish) => (
            <div key={dish.name} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/8 p-3">
              <img src={dish.image} alt={dish.name} className="h-12 w-12 rounded-2xl object-cover" />
              <div>
                <div className="text-sm font-semibold text-white">{dish.name}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">{dish.orders} orders · ${dish.revenue}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
