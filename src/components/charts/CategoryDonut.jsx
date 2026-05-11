import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { GlassCard } from '../ui/GlassCard';

const colors = ['#FF6B35', '#A78BFA', '#34D399', '#FBBF24', '#38BDF8', '#FB7185'];

function TooltipCard({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-3xl px-4 py-3 text-sm text-white">
      {payload[0].name}: {payload[0].value}
    </div>
  );
}

export function CategoryDonut({ data, selectedCategory, onSelect }) {
  const drilldown = data.find((item) => item.name === selectedCategory);
  return (
    <GlassCard className="p-6" interactive={false}>
      <div className="mb-5">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Orders by category</p>
        <h3 className="font-display text-2xl italic text-white">What guests are ordering</h3>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative h-[290px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={72}
                outerRadius={106}
                paddingAngle={4}
                onMouseEnter={(_, index) => onSelect(data[index].name)}
                onClick={(_, index) => onSelect(data[index].name)}
                isAnimationActive
                animationDuration={850}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} stroke={selectedCategory === entry.name ? '#ffffff' : 'rgba(255,255,255,0.08)'} strokeWidth={selectedCategory === entry.name ? 2 : 1} />
                ))}
              </Pie>
              <Tooltip content={<TooltipCard />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Total orders</div>
            <div className="text-4xl font-extrabold text-white tabular-nums">{data.reduce((sum, item) => sum + item.value, 0)}</div>
          </div>
        </div>
        <div className="h-[290px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(drilldown?.items || []).map((item) => ({ name: item.name, Lunch: item.lunch, Dinner: item.dinner }))}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip content={<TooltipCard />} />
              <Legend />
              <Bar dataKey="Lunch" stackId="a" fill="#A78BFA" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={800} />
              <Bar dataKey="Dinner" stackId="a" fill="#FF6B35" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={950} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </GlassCard>
  );
}
