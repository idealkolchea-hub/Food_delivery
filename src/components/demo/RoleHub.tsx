import Link from 'next/link';
import {
  getDemoAgents,
  getDemoCustomer,
  getDemoFraudAlerts,
  getDemoOrders,
  getDemoPayouts,
  getDemoRestaurant,
  getDemoTickets,
} from '@/lib/demo-store';
import { getScreensForTab, getScreenPath, getTabPath } from '@/lib/navigation';
import { ALL_SCREENS, ALL_TABS, ROLE_META, type Role } from '@/lib/vault';

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function roleSummary(role: Role): { title: string; description: string; stats: Array<{ label: string; value: string }> } {
  const customer = getDemoCustomer();
  const restaurant = getDemoRestaurant('seed_1');
  const agents = getDemoAgents();
  const orders = getDemoOrders();
  const tickets = getDemoTickets();
  const payouts = getDemoPayouts();
  const alerts = getDemoFraudAlerts();

  switch (role) {
    case 'customer':
      return {
        title: 'Customer Workspace',
        description: 'Browse as a guest, sign in with demo OTP, or jump straight into order history, wallet, and support.',
        stats: [
          { label: 'Wallet balance', value: formatCurrency(customer?.walletBalance || 0) },
          { label: 'Saved addresses', value: String(customer?.addresses.length || 0) },
          { label: 'Recent orders', value: String(getDemoOrders({ customerId: customer?.id || null }).length) },
        ],
      };
    case 'partner':
      return {
        title: 'Partner Operations Hub',
        description: 'Track live orders, menu health, payouts, and kitchen readiness from one place.',
        stats: [
          { label: 'Trust score', value: `${restaurant?.trustScore || 0}/100` },
          { label: 'Live orders', value: String(orders.filter((order) => order.restaurantId === 'seed_1' && order.status !== 'delivered').length) },
          { label: 'Menu items', value: String(restaurant?.menu.length || 0) },
        ],
      };
    case 'agent':
      return {
        title: 'Agent Fleet Hub',
        description: 'Move from order offer to payout view with each rider flow connected and demo-ready.',
        stats: [
          { label: 'Online agents', value: String(agents.filter((agent) => agent.availabilityStatus === 'online').length) },
          { label: 'Pending payout', value: formatCurrency(agents.reduce((sum, agent) => sum + agent.earnings.pendingPayout, 0)) },
          { label: 'Open trips', value: String(orders.filter((order) => order.status !== 'delivered').length) },
        ],
      };
    case 'admin':
      return {
        title: 'Admin Command Hub',
        description: 'Demand, trust, entity review, and finance now share one connected operating surface.',
        stats: [
          { label: 'Open tickets', value: String(tickets.filter((ticket) => ticket.status !== 'resolved').length) },
          { label: 'Fraud alerts', value: String(alerts.length) },
          { label: 'Pending settlements', value: formatCurrency(payouts.reduce((sum, payout) => sum + payout.amount, 0)) },
        ],
      };
  }
}

export default function RoleHub({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  const tabs = ALL_TABS[role];
  const screens = ALL_SCREENS[role];
  const summary = roleSummary(role);
  const ungrouped = getScreensForTab(null, screens);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      <section
        style={{
          background: `linear-gradient(135deg, ${meta.color}20 0%, rgba(13,17,23,0.96) 72%)`,
          border: `1px solid ${meta.color}40`,
          borderRadius: 'var(--r-xl)',
          padding: 'var(--sp-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
          <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>
          <span style={{ color: meta.color, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {role}
          </span>
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
          {summary.title}
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', maxWidth: 720 }}>
          {summary.description}
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--sp-3)' }}>
        {summary.stats.map((stat) => (
          <div key={stat.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </section>

      <section style={{ display: 'grid', gap: 'var(--sp-4)' }}>
        {tabs.map((tab) => {
          const tabScreens = getScreensForTab(tab.key, screens);
          return (
            <div key={tab.key} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--sp-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{tab.label}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
                    {tabScreens.length} screens mapped into this tab.
                  </div>
                </div>
                <Link
                  href={getTabPath(role, tab, screens)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg-overlay)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                  }}
                >
                  Open {tab.label}
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--sp-3)' }}>
                {tabScreens.map(([key, screen]) => (
                  <Link
                    key={key}
                    href={getScreenPath(role, key)}
                    style={{
                      display: 'block',
                      background: 'var(--bg-overlay)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                      padding: 'var(--sp-4)',
                      color: 'var(--text)',
                    }}
                  >
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '4px' }}>
                      {screen.label}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                      {key}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {ungrouped.length > 0 && (
        <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--sp-5)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>
            Entry Screens
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--sp-3)' }}>
            {ungrouped.map(([key, screen]) => (
              <Link
                key={key}
                href={getScreenPath(role, key)}
                style={{
                  display: 'block',
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: 'var(--sp-4)',
                  color: 'var(--text)',
                }}
              >
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '4px' }}>
                  {screen.label}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                  {key}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
