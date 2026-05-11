import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { revenueByRange, ordersByCategory, peakHours, topDishes, customerFunnel, kpis } from '../data/mockData';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';
import { KPICard } from '../components/charts/KPICard';
import { RevenueChart } from '../components/charts/RevenueChart';
import { CategoryDonut } from '../components/charts/CategoryDonut';
import { HeatmapGrid } from '../components/charts/HeatmapGrid';
import { LeaderboardChart } from '../components/charts/LeaderboardChart';
import { FunnelChartView } from '../components/charts/FunnelChart';
import { DrilldownModal } from '../components/modals/DrilldownModal';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [range, setRange] = useState('30d');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(ordersByCategory[0].name);

  return (
    <PageWrapper className="mx-auto max-w-[1400px]">
      <motion.section variants={childVariants}>
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Owner intelligence</p>
        <h1 className="font-display text-5xl italic text-white">The dashboard that closes the pitch</h1>
      </motion.section>

      <motion.section variants={childVariants} className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((metric) => <KPICard key={metric.label} metric={metric} />)}
      </motion.section>

      <motion.section variants={childVariants} className="mt-8">
        <RevenueChart data={revenueByRange[range]} activeRange={range} onRangeChange={setRange} onPointSelect={setSelectedPoint} />
      </motion.section>

      <motion.section variants={childVariants} className="mt-8 grid gap-8 xl:grid-cols-2">
        <CategoryDonut data={ordersByCategory} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
        <HeatmapGrid data={peakHours} />
      </motion.section>

      <motion.section variants={childVariants} className="mt-8 grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
        <LeaderboardChart data={topDishes} />
        <FunnelChartView data={customerFunnel} />
      </motion.section>

      <DrilldownModal
        open={Boolean(selectedPoint)}
        onClose={() => setSelectedPoint(null)}
        title={selectedPoint?.label || 'Daily detail'}
        subtitle="Top five sellers"
      >
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={selectedPoint?.topItems || []} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" width={150} stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#FF6B35" radius={[0, 12, 12, 0]} isAnimationActive animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DrilldownModal>
    </PageWrapper>
  );
}
