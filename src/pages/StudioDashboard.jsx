import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminStudio } from '../hooks/useAdminStudio';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { childVariants } from '../components/layout/PageWrapper';

function formatDate(value) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function prettify(value) {
  return String(value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMetadata(metadata) {
  return JSON.stringify(metadata, null, 2);
}

function MetricCard({ label, value, hint, testId }) {
  return (
    <GlassCard interactive={false} className="p-5" data-testid={testId}>
      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-3 text-4xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{hint}</div>
    </GlassCard>
  );
}

function FilterInput({ label, value, onChange, placeholder }) {
  return (
    <label className="bb-glass-inner p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bb-input mt-3"
        placeholder={placeholder}
      />
    </label>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="bb-glass-inner p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bb-input mt-3"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-950 text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function UserRow({ profile }) {
  return (
    <div
      className="grid gap-3 rounded-[22px] border border-white/10 bg-white/4 p-4 md:grid-cols-[1.3fr_0.8fr_1fr_0.8fr]"
      data-testid={`studio-user-${profile.id}`}
    >
      <div>
        <div className="font-semibold text-white">{profile.name}</div>
        <div className="mt-1 break-all text-sm text-[color:var(--text-secondary)]">{profile.email || 'No email on file'}</div>
        <div className="mt-1 text-xs text-[color:var(--text-muted)]">{profile.phone || 'No phone linked'}</div>
      </div>
      <div className="text-sm text-white">{prettify(profile.role)}</div>
      <div className="text-sm text-[color:var(--text-secondary)]">{formatDate(profile.lastLoginAt)}</div>
      <div className="text-sm text-[color:var(--text-secondary)]">{profile.verifiedAt ? 'Verified' : 'Pending'}</div>
    </div>
  );
}

function OrderRow({ order, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(order.id)}
      className={`grid w-full gap-3 rounded-[22px] border p-4 text-left transition ${
        selected
          ? 'border-amber-300/45 bg-amber-200/10 shadow-[0_0_0_1px_rgba(252,211,77,0.18)]'
          : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/6'
      } md:grid-cols-[1.15fr_0.9fr_0.75fr_0.9fr_0.9fr]`}
      data-testid={`studio-order-${order.id}`}
    >
      <div>
        <div className="font-semibold text-white">{order.restaurantName}</div>
        <div className="bb-mono mt-1 break-all text-xs text-[color:var(--text-muted)]">{order.id}</div>
        <div className="mt-1 text-sm text-[color:var(--text-secondary)]">
          {order.customerName}{order.customerEmail ? ` · ${order.customerEmail}` : ''}
        </div>
      </div>
      <div>
        <div className="text-sm text-white">{prettify(order.status)}</div>
        <div className="mt-1 text-xs text-[color:var(--text-muted)]">{prettify(order.paymentStatus)} · {String(order.paymentMethod || 'cod').toUpperCase()}</div>
      </div>
      <div className="text-sm font-semibold text-white">{formatCurrency(order.total)}</div>
      <div className="text-sm text-[color:var(--text-secondary)]">
        {order.deliveryName || 'Unassigned'}
        {order.deliveryEmail ? <div className="mt-1 break-all text-xs text-[color:var(--text-muted)]">{order.deliveryEmail}</div> : null}
      </div>
      <div className="text-sm text-[color:var(--text-secondary)]">{formatDate(order.updatedAt)}</div>
    </button>
  );
}

function TimelineEventCard({ event }) {
  const actorLabel = event.actorName
    ? `${event.actorName}${event.actorRole ? ` · ${prettify(event.actorRole)}` : ''}`
    : prettify(event.actorRole || 'system');

  return (
    <div
      className="bb-glass-inner p-5"
      data-testid={`studio-timeline-event-${event.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{event.title}</div>
          {event.detail ? <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{event.detail}</div> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bb-mono normal-case tracking-[0.04em] text-white">{event.eventType}</Badge>
          <Badge className="bb-mono normal-case tracking-[0.04em] text-[color:var(--text-secondary)]">{prettify(event.status)}</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-[color:var(--text-secondary)] md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Actor</div>
          <div className="mt-1 text-white">{actorLabel}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Previous status</div>
          <div className="mt-1 text-white">{event.previousStatus ? prettify(event.previousStatus) : 'Initial event'}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Source</div>
          <div className="mt-1 text-white">{prettify(event.source)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Recorded</div>
          <div className="mt-1 text-white">{formatDate(event.createdAt)}</div>
        </div>
      </div>

      {event.reasonCode ? (
        <div className="bb-mono mt-4 text-sm text-[color:var(--text-secondary)]">
          <span className="text-[color:var(--text-muted)]">Reason code:</span> {event.reasonCode}
        </div>
      ) : null}

      {event.hasMetadata ? (
        <div className="mt-4 rounded-[18px] border border-white/10 bg-slate-950/40 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Metadata</div>
          <pre className="bb-mono mt-3 overflow-x-auto text-xs leading-6 text-amber-100">{formatMetadata(event.metadata)}</pre>
        </div>
      ) : null}
    </div>
  );
}

function SelectedOrderPanel({ order, timeline, loading, error }) {
  return (
    <GlassCard interactive={false} className="p-6" data-testid="studio-order-detail">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Selected order</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">{order.restaurantName}</h3>
          <div className="bb-mono mt-2 break-all text-xs text-[color:var(--text-muted)]">{order.id}</div>
          <div className="mt-3 text-sm text-[color:var(--text-secondary)]">
            {order.customerName}{order.customerEmail ? ` · ${order.customerEmail}` : ''}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{prettify(order.status)}</Badge>
          <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{formatCurrency(order.total)}</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Payment</div>
          <div className="mt-2 text-white">{String(order.paymentMethod || 'cod').toUpperCase()} · {prettify(order.paymentStatus)}</div>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Delivery partner</div>
          <div className="mt-2 text-white">{order.deliveryName || 'Unassigned'}</div>
          {order.deliveryEmail ? <div className="mt-1 text-xs text-[color:var(--text-muted)]">{order.deliveryEmail}</div> : null}
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Updated</div>
          <div className="mt-2 text-white">{formatDate(order.updatedAt)}</div>
        </div>
      </div>

      <div className="mt-6 space-y-3" data-testid="studio-order-timeline">
        {loading ? (
          <div className="rounded-[22px] border border-dashed border-white/12 bg-white/4 p-6 text-sm text-[color:var(--text-secondary)]">
            Loading order timeline...
          </div>
        ) : error ? (
          <div className="rounded-[22px] border border-rose-400/25 bg-rose-400/10 p-6 text-sm text-rose-100">
            {error}
          </div>
        ) : timeline.length ? (
          timeline.map((event) => <TimelineEventCard key={event.id} event={event} />)
        ) : (
          <div className="rounded-[22px] border border-dashed border-white/12 bg-white/4 p-6 text-sm text-[color:var(--text-secondary)]">
            No order events are available for this order yet.
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default function StudioDashboard() {
  const {
    loading,
    error,
    metrics,
    profiles,
    orders,
    refreshedAt,
    refresh,
    selectedOrderId,
    selectedOrder,
    selectedTimeline,
    timelineLoading,
    timelineError,
    selectOrder,
  } = useAdminStudio();
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredProfiles = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return profiles.filter((profile) => {
      const matchesRole = userRoleFilter === 'all' || profile.role === userRoleFilter;
      const haystack = [profile.name, profile.email, profile.phone, profile.role].join(' ').toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesRole && matchesQuery;
    });
  }, [profiles, userRoleFilter, userSearch]);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      const haystack = [
        order.id,
        order.restaurantName,
        order.customerName,
        order.customerEmail,
        order.deliveryName,
        order.status,
        order.paymentStatus,
      ].join(' ').toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [orderSearch, orderStatusFilter, orders]);

  return (
    <motion.section variants={childVariants} className="space-y-6">
      <GlassCard interactive={false} className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-3">
              <Badge>Admin studio</Badge>
              <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">Live platform data</Badge>
            </div>
            <h2 className="font-display text-5xl italic text-white">Operate the platform from one live control surface</h2>
            <p className="mt-4 max-w-3xl text-sm text-[color:var(--text-secondary)]">
              Review registered accounts, monitor real order states, and inspect a structured event timeline without leaving the admin route family.
            </p>
          </div>
          <div className="min-w-[220px] rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm text-[color:var(--text-secondary)]">
            <div>Last refresh</div>
            <div className="mt-2 font-semibold text-white">{refreshedAt ? formatDate(refreshedAt) : 'Loading...'}</div>
            <Button
              variant="secondary"
              className="mt-4 w-full"
              disabled={refreshing}
              onClick={async () => {
                try {
                  setRefreshing(true);
                  await refresh();
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh now'}
            </Button>
          </div>
        </div>
        {error ? (
          <div className="mt-6 rounded-[22px] border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </GlassCard>

      <motion.section variants={childVariants} className="grid gap-5 md:grid-cols-2 xl:grid-cols-5" data-testid="studio-metrics">
        <MetricCard testId="studio-metric-total-orders" label="Total orders" value={metrics.totalOrders} hint="Every order visible to the admin role." />
        <MetricCard testId="studio-metric-active-deliveries" label="Active deliveries" value={metrics.activeDeliveries} hint="Orders in ready or picked-up delivery stages." />
        <MetricCard testId="studio-metric-completed-deliveries" label="Completed deliveries" value={metrics.completedDeliveries} hint="Delivered orders across the live marketplace." />
        <MetricCard testId="studio-metric-registered-vendors" label="Registered vendors" value={metrics.registeredVendors} hint="Profiles with vendor access in app_profiles." />
        <MetricCard testId="studio-metric-registered-customers" label="Registered customers" value={metrics.registeredCustomers} hint="Profiles with canonical customer access." />
      </motion.section>

      <motion.section variants={childVariants}>
        <GlassCard interactive={false} className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Users</p>
              <h3 className="mt-2 text-3xl font-semibold text-white">Filter real platform accounts</h3>
            </div>
            <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{filteredProfiles.length} visible</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <FilterInput
              label="Search users"
              value={userSearch}
              onChange={setUserSearch}
              placeholder="Name, email, phone, or role"
            />
            <FilterSelect
              label="Role"
              value={userRoleFilter}
              onChange={setUserRoleFilter}
              options={[
                { value: 'all', label: 'All roles' },
                { value: 'customer', label: 'Customer' },
                { value: 'vendor', label: 'Vendor' },
                { value: 'delivery_partner', label: 'Delivery partner' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </div>
          <div className="mt-6 space-y-3" data-testid="studio-users-list">
            {loading ? (
              <div className="rounded-[22px] border border-dashed border-white/12 bg-white/4 p-6 text-sm text-[color:var(--text-secondary)]">
                Loading user directory...
              </div>
            ) : filteredProfiles.length ? (
              filteredProfiles.map((profile) => <UserRow key={profile.id} profile={profile} />)
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/12 bg-white/4 p-6 text-sm text-[color:var(--text-secondary)]">
                No users match the current filters.
              </div>
            )}
          </div>
        </GlassCard>
      </motion.section>

      <motion.section variants={childVariants} className="space-y-6">
        {selectedOrder ? (
          <SelectedOrderPanel
            order={selectedOrder}
            timeline={selectedTimeline}
            loading={timelineLoading}
            error={timelineError}
          />
        ) : (
          <GlassCard interactive={false} className="p-6" data-testid="studio-order-detail-empty">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Selected order</p>
            <h3 className="mt-2 text-3xl font-semibold text-white">Choose an order to inspect the ledger</h3>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              Click any order row below to open a structured timeline of what happened, when it happened, and who recorded it.
            </p>
          </GlassCard>
        )}

        <GlassCard interactive={false} className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Orders</p>
              <h3 className="mt-2 text-3xl font-semibold text-white">Filter live marketplace orders</h3>
            </div>
            <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{filteredOrders.length} visible</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <FilterInput
              label="Search orders"
              value={orderSearch}
              onChange={setOrderSearch}
              placeholder="Order ID, restaurant, customer, delivery, payment"
            />
            <FilterSelect
              label="Status"
              value={orderStatusFilter}
              onChange={setOrderStatusFilter}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'preparing', label: 'Preparing' },
                { value: 'ready', label: 'Ready' },
                { value: 'picked_up', label: 'Picked up' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
          <div className="mt-6 space-y-3" data-testid="studio-orders-list">
            {loading ? (
              <div className="rounded-[22px] border border-dashed border-white/12 bg-white/4 p-6 text-sm text-[color:var(--text-secondary)]">
                Loading order ledger...
              </div>
            ) : filteredOrders.length ? (
              filteredOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  selected={selectedOrderId === order.id}
                  onSelect={selectOrder}
                />
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/12 bg-white/4 p-6 text-sm text-[color:var(--text-secondary)]">
                No orders match the current filters.
              </div>
            )}
          </div>
        </GlassCard>
      </motion.section>
    </motion.section>
  );
}
