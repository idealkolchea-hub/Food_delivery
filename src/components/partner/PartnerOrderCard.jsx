import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

function formatElapsed(minutes) {
  if (minutes < 60) return `${minutes}m open`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m open`;
}

function paymentTone(status) {
  if (status === 'paid') return 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100';
  if (status === 'refunded') return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
  return 'border-white/12 bg-white/8 text-[color:var(--text-secondary)]';
}

function ActionButton({ label, variant = 'secondary', disabled = false, onClick }) {
  return (
    <Button
      type="button"
      variant={variant}
      className="px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function PartnerOrderCard({
  order,
  pendingAction = '',
  onAction,
  detailHref = null,
}) {
  return (
    <GlassCard interactive={false} className="overflow-hidden p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{order.statusLabel}</Badge>
            <Badge className={paymentTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
            <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{formatElapsed(order.elapsedMinutes)}</Badge>
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-white">{order.customerName}</h3>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{order.itemCount} items · {order.totalLabel} · {order.paymentMethod}</p>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--text-secondary)]">{order.destination}</p>
        </div>
        <div className="min-w-[140px] text-left md:text-right">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Order ID</div>
          <div className="mt-2 break-all text-sm font-semibold text-white">{order.id}</div>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-white/6 p-4">
        <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Packing snapshot</div>
        <div className="space-y-2 text-sm text-[color:var(--text-secondary)]">
          {order.items.slice(0, 3).map((item) => (
            <div key={`${order.id}-${item.id || item.name}`} className="flex items-center justify-between gap-4">
              <span className="text-white">{item.quantity} × {item.name}</span>
              <span className="tabular-nums text-[color:var(--text-secondary)]">₹{item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
          {order.items.length > 3 ? (
            <div className="pt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">+{order.items.length - 3} more items in detail</div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {order.canAccept ? (
          <ActionButton
            label={pendingAction === 'accepted' ? 'Accepting...' : 'Accept order'}
            disabled={Boolean(pendingAction)}
            onClick={() => onAction?.({ orderId: order.id, targetStatus: 'accepted' })}
          />
        ) : null}
        {order.canMarkPreparing ? (
          <ActionButton
            label={pendingAction === 'preparing' ? 'Moving to prep...' : 'Mark preparing'}
            disabled={Boolean(pendingAction)}
            onClick={() => onAction?.({ orderId: order.id, targetStatus: 'preparing' })}
          />
        ) : null}
        {order.canMarkReady ? (
          <ActionButton
            label={pendingAction === 'ready' ? 'Marking ready...' : 'Mark ready'}
            disabled={Boolean(pendingAction)}
            onClick={() => onAction?.({ orderId: order.id, targetStatus: 'ready' })}
          />
        ) : null}
        {order.canReject ? (
          <ActionButton
            label={pendingAction === 'cancelled' ? 'Rejecting...' : 'Reject order'}
            variant="ghost"
            disabled={Boolean(pendingAction)}
            onClick={() => onAction?.({ orderId: order.id, targetStatus: 'cancelled', reasonCode: 'restaurant_rejected' })}
          />
        ) : null}
        {detailHref ? (
          <Link to={detailHref}>
            <Button variant="secondary" className="px-4 py-2 text-xs">Open detail</Button>
          </Link>
        ) : null}
      </div>
    </GlassCard>
  );
}
