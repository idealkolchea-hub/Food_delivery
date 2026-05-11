import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getDemoAgents,
  getDemoCustomer,
  getDemoFraudAlerts,
  getDemoOrders,
  getDemoPayouts,
  getDemoRestaurant,
  getDemoSnapshot,
  getDemoTickets,
  getMenuItems,
  getWalletSummary,
} from '@/lib/demo-store';
import { getRoleHomePath, getScreensForTab, getScreenPath } from '@/lib/navigation';
import { ALL_SCREENS, ALL_TABS, ROLE_META, type Role } from '@/lib/vault';

type Tone = 'default' | 'good' | 'warn' | 'danger' | 'info';

interface Stat {
  label: string;
  value: string;
}

interface Action {
  label: string;
  href: string;
}

interface PanelItem {
  title: string;
  meta?: string;
  body?: string;
  tone?: Tone;
  href?: string;
}

interface Panel {
  title: string;
  description?: string;
  items: PanelItem[];
}

interface ScreenContent {
  summary: string;
  stats: Stat[];
  actions: Action[];
  panels: Panel[];
}

const toneStyles: Record<Tone, { border: string; color: string; background: string }> = {
  default: {
    border: 'var(--border)',
    color: 'var(--text-subtle)',
    background: 'var(--bg-overlay)',
  },
  good: {
    border: 'rgba(63,185,80,0.35)',
    color: 'var(--green)',
    background: 'var(--green-bg)',
  },
  warn: {
    border: 'rgba(227,179,65,0.35)',
    color: 'var(--amber)',
    background: 'var(--yellow-bg)',
  },
  danger: {
    border: 'rgba(248,81,73,0.35)',
    color: 'var(--red)',
    background: 'var(--red-bg)',
  },
  info: {
    border: 'rgba(88,166,255,0.35)',
    color: 'var(--blue)',
    background: 'var(--blue-bg)',
  },
};

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatOrderStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

function toneForStatus(status: string): Tone {
  if (['delivered', 'completed', 'resolved', 'verified', 'approved'].includes(status)) {
    return 'good';
  }
  if (['cancelled', 'rejected', 'failed', 'refunded', 'confirmed'].includes(status)) {
    return 'danger';
  }
  if (['pending', 'open', 'in_progress', 'processing', 'preparing'].includes(status)) {
    return 'warn';
  }
  return 'info';
}

function orderItems(limit = 4): PanelItem[] {
  return getDemoOrders()
    .slice(0, limit)
    .map((order) => ({
      title: `${order.restaurantName} · ${formatCurrency(order.total)}`,
      meta: `${order.id} · ${formatOrderStatus(order.status)} · ETA ${order.etaMinutes} min`,
      body: `${order.customerName} · ${order.items.reduce((sum, item) => sum + item.quantity, 0)} items · ${order.paymentMethod.toUpperCase()}`,
      tone: toneForStatus(order.status),
    }));
}

function ticketItems(limit = 4): PanelItem[] {
  return getDemoTickets()
    .slice(0, limit)
    .map((ticket) => ({
      title: ticket.subject,
      meta: `${ticket.id} · ${ticket.priority.toUpperCase()} · ${ticket.category.replace(/_/g, ' ')}`,
      body: ticket.description,
      tone: toneForStatus(ticket.status),
    }));
}

function payoutItems(limit = 4): PanelItem[] {
  return getDemoPayouts()
    .slice(0, limit)
    .map((payout) => ({
      title: `${formatCurrency(payout.amount)} · ${payout.recipientType}`,
      meta: `${payout.id} · ${payout.status.replace(/_/g, ' ')}`,
      body: payout.bankRef ? `Bank ref ${payout.bankRef}` : 'Awaiting settlement file and reconciliation.',
      tone: toneForStatus(payout.status),
    }));
}

function alertItems(limit = 4): PanelItem[] {
  return getDemoFraudAlerts()
    .slice(0, limit)
    .map((alert) => ({
      title: `${alert.type.replace(/_/g, ' ')} · ${alert.severity}`,
      meta: `${alert.id} · ${alert.status.replace(/_/g, ' ')}`,
      body: alert.evidence.join(' · '),
      tone: toneForStatus(alert.status === 'confirmed' ? 'failed' : alert.status),
    }));
}

function menuItems(limit = 5): PanelItem[] {
  const restaurant = getDemoRestaurant('seed_1');
  return getMenuItems('seed_1')
    .slice(0, limit)
    .map((item) => ({
      title: `${item.name} · ${formatCurrency(item.price)}`,
      meta: `${item.category} · ${item.preparationTime || 0} min`,
      body: `${item.isVeg ? 'Veg' : 'Non-veg'}${item.isBestseller ? ' · Bestseller' : ''}${item.isAvailable ? ' · Available' : ' · Snoozed'}${restaurant ? ` · ${restaurant.name}` : ''}`,
      tone: item.isAvailable ? 'good' : 'warn',
    }));
}

function agentItems(limit = 4): PanelItem[] {
  return getDemoAgents()
    .slice(0, limit)
    .map((agent) => ({
      title: `${agent.name} · ${agent.zone}`,
      meta: `${agent.vehicle} · ${agent.rating} stars · ${agent.completedTrips} trips`,
      body: `KYC ${agent.kycStatus} · ${agent.availabilityStatus} · pending payout ${formatCurrency(agent.earnings.pendingPayout)}`,
      tone: toneForStatus(agent.availabilityStatus === 'online' ? 'approved' : agent.kycStatus),
    }));
}

function buildCustomerContent(screenKey: string): ScreenContent {
  const customer = getDemoCustomer();
  const wallet = getWalletSummary(customer?.id);
  const orders = getDemoOrders({ customerId: customer?.id || null });
  const latestOrder = orders[0];

  switch (screenKey) {
    case 'auth_profile':
      return {
        summary: 'Finish profile setup so saved addresses, wallet credits, and trust-based support all stay attached to one account.',
        stats: [
          { label: 'Trust score', value: `${customer?.trustScore || 0}/100` },
          { label: 'Saved addresses', value: String(customer?.addresses.length || 0) },
          { label: 'Wallet balance', value: formatCurrency(customer?.walletBalance || 0) },
        ],
        actions: [
          { label: 'Go To Home', href: '/customer/home_logged' },
          { label: 'Manage Addresses', href: '/customer/addresses' },
        ],
        panels: [
          {
            title: 'Profile Completion',
            description: 'Fields the customer journey depends on.',
            items: [
              { title: customer?.name || 'Name pending', meta: `+91 ${customer?.phone || ''}`, body: customer?.email || 'Add email for invoices and alerts.', tone: 'good' },
              { title: 'Primary address', meta: customer?.addresses[0]?.label || 'Missing', body: customer?.addresses[0] ? `${customer.addresses[0].building}, ${customer.addresses[0].area}` : 'Add a delivery-friendly address.' },
              { title: 'Support identity', meta: 'Customer wallet and ticket history stay unified', body: 'Completing profile reduces friction during refunds, top-ups, and escalations.', tone: 'info' },
            ],
          },
          {
            title: 'What Unlocks Next',
            items: [
              { title: 'Repeat ordering', meta: 'Fast checkout', body: 'Saved address and last-used payment method appear automatically.', tone: 'good' },
              { title: 'Priority support context', meta: 'Faster ticket routing', body: 'Resolved and open tickets stay attached to the same customer record.', tone: 'info' },
            ],
          },
        ],
      };
    case 'offers':
      return {
        summary: 'Show the active promo stack so a customer can decide whether to reorder, top up the wallet, or switch restaurants.',
        stats: [
          { label: 'Live offers', value: '6' },
          { label: 'Best coupon', value: 'BITE10' },
          { label: 'Eligible wallet cashback', value: formatCurrency(75) },
        ],
        actions: [
          { label: 'Browse Restaurants', href: '/customer/home_guest' },
          { label: 'Open Wallet', href: '/customer/wallet' },
        ],
        panels: [
          {
            title: 'Recommended Promos',
            items: [
              { title: 'BITE10', meta: '10% off up to ₹120', body: 'Applies to Spice Garden and Biryani Boulevard today.', tone: 'good' },
              { title: 'LATE20', meta: 'Compensation credit', body: 'Auto-applies when an order breaches the tracked ETA threshold.', tone: 'warn' },
              { title: 'WALLET75', meta: 'Top up ₹500, get ₹75', body: 'Stacks well for repeat lunches this week.', tone: 'info' },
            ],
          },
          {
            title: 'Recent Order Signals',
            items: orders.slice(0, 3).map((order) => ({
              title: order.restaurantName,
              meta: `${order.id} · ${formatOrderStatus(order.status)}`,
              body: `Previous spend ${formatCurrency(order.total)} · offer score derived from repeat-cuisine behavior.`,
              tone: toneForStatus(order.status),
            })),
          },
        ],
      };
    case 'order_history':
      return {
        summary: 'Give the customer a clean ledger of recent orders, current statuses, and direct jumps to tracking or support.',
        stats: [
          { label: 'Orders this month', value: String(orders.length) },
          { label: 'Latest ETA', value: latestOrder ? `${latestOrder.etaMinutes} min` : 'n/a' },
          { label: 'Open tickets', value: String(getDemoTickets({ customerId: customer?.id || null }).filter((ticket) => ticket.status !== 'resolved').length) },
        ],
        actions: [
          { label: 'Track Active Order', href: '/customer/delivery_track' },
          { label: 'Raise Ticket', href: '/customer/raise_ticket' },
        ],
        panels: [
          { title: 'Recent Orders', items: orders.map((order) => ({
            title: `${order.restaurantName} · ${formatCurrency(order.total)}`,
            meta: `${order.id} · ${formatOrderStatus(order.status)}`,
            body: `${order.items.reduce((sum, item) => sum + item.quantity, 0)} items · ${order.paymentStatus.replace(/_/g, ' ')}`,
            tone: toneForStatus(order.status),
          })) },
          { title: 'Support Timeline', items: ticketItems(3) },
        ],
      };
    case 'payment_failed':
      return {
        summary: 'Explain what broke in checkout and show the safest recovery path without leaving the customer stranded.',
        stats: [
          { label: 'Failure type', value: 'UPI timeout' },
          { label: 'Retry window', value: '10 min' },
          { label: 'Fallback methods', value: '3' },
        ],
        actions: [
          { label: 'Retry Payment', href: '/customer/payment_select' },
          { label: 'Use Wallet', href: '/customer/wallet' },
        ],
        panels: [
          {
            title: 'Recovery Checklist',
            items: [
              { title: 'Retry the same order', meta: 'Cart is still intact for 10 minutes', body: 'Use the stored cart and head back to payment selection.', tone: 'warn' },
              { title: 'Switch payment rail', meta: 'Wallet or COD', body: 'Alternate methods reduce the chance of another PSP timeout.', tone: 'info' },
              { title: 'Ask support for payment proof review', meta: 'Needed only if debit happened', body: 'Raise a ticket with screenshot evidence.', tone: 'danger' },
            ],
          },
        ],
      };
    case 'order_rejected':
      return {
        summary: 'Capture what happened when a partner rejects an order and guide the customer toward a retry or fast refund path.',
        stats: [
          { label: 'Refund SLA', value: '< 30 min' },
          { label: 'Nearby alternatives', value: '4' },
          { label: 'Auto-credit path', value: 'Wallet' },
        ],
        actions: [
          { label: 'Browse Alternatives', href: '/customer/home_guest' },
          { label: 'View Wallet', href: '/customer/wallet' },
        ],
        panels: [
          {
            title: 'Next Best Actions',
            items: [
              { title: 'Reorder from similar cuisine', meta: 'Suggested nearby kitchens', body: 'Pizza Forge and Burger Brigade are both accepting orders right now.', tone: 'good' },
              { title: 'Refund watch', meta: 'Wallet-first crediting', body: 'Support can always reverse the wallet credit back to source after audit.', tone: 'info' },
            ],
          },
        ],
      };
    case 'raise_ticket':
    case 'report_issue':
      return {
        summary: 'Keep issue reporting structured so the ops queue gets enough evidence to route the case correctly on the first pass.',
        stats: [
          { label: 'Open queue', value: String(getDemoTickets().filter((ticket) => ticket.status !== 'resolved').length) },
          { label: 'P1 SLA', value: '< 60 min' },
          { label: 'Evidence types', value: '4' },
        ],
        actions: [
          { label: 'Resolved Example', href: '/customer/ticket_resolved' },
          { label: 'Order History', href: '/customer/order_history' },
        ],
        panels: [
          {
            title: 'Issue Categories',
            items: [
              { title: 'Missing or wrong item', meta: 'Use order-level ticket', body: 'Attach a food photo if packaging was already opened.', tone: 'warn' },
              { title: 'Delivery conduct or late arrival', meta: 'Route to support + trust review', body: 'GPS trail and timeline already exist in the order trace.', tone: 'info' },
              { title: 'Payment dispute', meta: 'Escalates faster with screenshot proof', body: 'Use wallet or bank proof so finance can reconcile the transaction.', tone: 'danger' },
            ],
          },
          { title: 'Active Examples', items: ticketItems(3) },
        ],
      };
    case 'ticket_resolved':
      return {
        summary: 'Show closure clearly so customers know what changed, which credit landed, and when they can reopen the case.',
        stats: [
          { label: 'Latest resolution', value: 'Completed' },
          { label: 'Credit issued', value: formatCurrency(80) },
          { label: 'Reopen window', value: '24 hrs' },
        ],
        actions: [
          { label: 'View Wallet Credit', href: '/customer/wallet' },
          { label: 'Report Another Issue', href: '/customer/report_issue' },
        ],
        panels: [
          {
            title: 'Resolved Ticket Snapshot',
            items: [
              { title: 'TKT_1001', meta: 'Delivery delay · resolved', body: 'An ₹80 courtesy credit was applied after ETA miss review.', tone: 'good' },
              { title: 'Agent coaching logged', meta: 'Quality follow-up complete', body: 'Ops marked the route exception and completed a handoff coaching note.', tone: 'info' },
            ],
          },
        ],
      };
    case 'wallet':
      return {
        summary: 'Treat wallet as a real product surface with balance, recent movement, and clear top-up and refund visibility.',
        stats: [
          { label: 'Current balance', value: formatCurrency((wallet as { balance?: number }).balance || 0) },
          { label: 'Recent movements', value: String((wallet as { transactions: unknown[] }).transactions.length) },
          { label: 'Refund-ready', value: 'Yes' },
        ],
        actions: [
          { label: 'Top Up Wallet', href: '/customer/wallet_topup' },
          { label: 'See Offers', href: '/customer/offers' },
        ],
        panels: [
          {
            title: 'Ledger',
            items: ((wallet as { transactions: Array<{ type: string; amount: number; reason: string; balanceAfter: number; createdAt: string }> }).transactions || []).slice(0, 5).map((tx) => ({
              title: `${tx.type === 'credit' ? '+' : '-'}${formatCurrency(tx.amount)} · ${tx.reason}`,
              meta: `${new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
              body: `Balance after movement: ${formatCurrency(tx.balanceAfter)}`,
              tone: tx.type === 'credit' ? 'good' : 'default',
            })),
          },
          {
            title: 'Wallet Behaviors',
            items: [
              { title: 'Refund routing', meta: 'Wallet-first fallback', body: 'When source settlement lags, provisional credits can still unblock the customer.', tone: 'info' },
              { title: 'Promo stacking', meta: 'Top-up + coupon aware', body: 'Wallet campaigns and restaurant offers remain visible in checkout decisions.', tone: 'good' },
            ],
          },
        ],
      };
    case 'wallet_topup':
      return {
        summary: 'Make it obvious how much to load, what the customer gains, and where the money is safest to keep for repeat orders.',
        stats: [
          { label: 'Suggested load', value: formatCurrency(500) },
          { label: 'Bonus credit', value: formatCurrency(75) },
          { label: 'Fastest rail', value: 'UPI' },
        ],
        actions: [
          { label: 'Back To Wallet', href: '/customer/wallet' },
          { label: 'See Promo', href: '/customer/offers' },
        ],
        panels: [
          {
            title: 'Preset Top-ups',
            items: [
              { title: '₹300', meta: 'Quick lunch buffer', body: 'Useful if the customer mainly orders solo meals.' },
              { title: '₹500', meta: 'Unlocks wallet bonus', body: 'Best value if the user places 2-3 orders this week.', tone: 'good' },
              { title: '₹1,000', meta: 'Household mode', body: 'Ideal for repeat family orders and smoother refunds.', tone: 'info' },
            ],
          },
        ],
      };
    case 'profile':
      return {
        summary: 'Pull together identity, saved defaults, trust posture, and the main places a customer needs to self-serve.',
        stats: [
          { label: 'Customer name', value: customer?.name || 'Guest' },
          { label: 'Trust score', value: `${customer?.trustScore || 0}/100` },
          { label: 'Addresses', value: String(customer?.addresses.length || 0) },
        ],
        actions: [
          { label: 'Manage Notifications', href: '/customer/notifications' },
          { label: 'Saved Addresses', href: '/customer/addresses' },
        ],
        panels: [
          {
            title: 'Account Snapshot',
            items: [
              { title: customer?.name || 'Customer', meta: `+91 ${customer?.phone || ''}`, body: customer?.email || 'Add email for invoices and ticket updates.', tone: 'good' },
              { title: 'Primary support path', meta: 'Order history -> report issue -> wallet credit', body: 'The account ties together both order events and financial actions.', tone: 'info' },
            ],
          },
        ],
      };
    case 'addresses':
      return {
        summary: 'Saved addresses should show which locations are reliable, how hard they are to deliver to, and which one gets used by default.',
        stats: [
          { label: 'Saved stops', value: String(customer?.addresses.length || 0) },
          { label: 'Default area', value: customer?.addresses[0]?.area || 'n/a' },
          { label: 'Special notes', value: '2' },
        ],
        actions: [
          { label: 'Profile', href: '/customer/profile' },
          { label: 'Checkout', href: '/customer/checkout' },
        ],
        panels: [
          {
            title: 'Address Book',
            items: (customer?.addresses || []).map((address) => ({
              title: `${address.label || 'Address'} · ${address.area}`,
              meta: `${address.building || ''}${address.flatNo ? `, ${address.flatNo}` : ''}`.replace(/^,\s*/, ''),
              body: `${address.street}, ${address.city} · Pin ${address.pincode}`,
              tone: address.label === 'Home' ? 'good' : 'default',
            })),
          },
        ],
      };
    case 'notifications':
      return {
        summary: 'Customers need notification control without losing the mission-critical events tied to orders, OTP, and refunds.',
        stats: [
          { label: 'Critical channels', value: 'OTP + order status' },
          { label: 'Promo frequency', value: '2 per week' },
          { label: 'Quiet hours', value: '22:00-08:00' },
        ],
        actions: [
          { label: 'Back To Profile', href: '/customer/profile' },
          { label: 'View Offers', href: '/customer/offers' },
        ],
        panels: [
          {
            title: 'Preference Matrix',
            items: [
              { title: 'Order lifecycle alerts', meta: 'Always on', body: 'Dispatch, out-for-delivery, OTP, and exceptions stay enabled.', tone: 'good' },
              { title: 'Campaign messages', meta: 'Digest mode', body: 'Batch promos into fewer sends to reduce fatigue.', tone: 'info' },
              { title: 'Support updates', meta: 'Email + push', body: 'Useful for refund notes and longer ticket threads.', tone: 'warn' },
            ],
          },
        ],
      };
    case 'delivery_feedback':
      return {
        summary: 'Collect delivery-specific feedback separately from food feedback so ops can improve rider quality without confusing the restaurant signal.',
        stats: [
          { label: 'Latest rider score', value: '4.8/5' },
          { label: 'Feedback bonus', value: formatCurrency(20) },
          { label: 'Reviewed today', value: '3 notes' },
        ],
        actions: [
          { label: 'Rate Experience', href: '/customer/rate_experience' },
          { label: 'Track Delivery', href: '/customer/delivery_track' },
        ],
        panels: [
          {
            title: 'Feedback Dimensions',
            items: [
              { title: 'Timeliness', meta: 'Compare ETA vs actual', body: 'Feeds trust scoring and dispatch tuning.', tone: 'info' },
              { title: 'Handover quality', meta: 'OTP, COD, packaging seal', body: 'Useful for agent coaching and dispute review.', tone: 'warn' },
              { title: 'Professional conduct', meta: 'Safety and communication', body: 'Routes into trust review when severe.', tone: 'danger' },
            ],
          },
        ],
      };
    case 'kitchen_story':
    case 'spice_garden':
      return {
        summary: 'Restaurant storytelling should build trust, not just appetite, by showing preparation quality, operating discipline, and signature dishes.',
        stats: [
          { label: 'Featured kitchen', value: getDemoRestaurant('seed_1')?.name || 'Spice Garden' },
          { label: 'Prep average', value: `${getDemoRestaurant('seed_1')?.avgPrepMinutes || 0} min` },
          { label: 'Completion rate', value: `${getDemoRestaurant('seed_1')?.completionRate || 0}%` },
        ],
        actions: [
          { label: 'Open Menu', href: '/customer/restaurant_detail?id=seed_1' },
          { label: 'Browse More', href: '/customer/home_guest' },
        ],
        panels: [
          {
            title: 'Why Customers Reorder',
            items: [
              { title: 'Chef-led hot section', meta: 'Fresh prep windows through dinner', body: 'The kitchen holds a strong completion rate while keeping top dishes in stock.', tone: 'good' },
              { title: 'Packaging discipline', meta: 'Tamper-aware sealing and labeling', body: 'Good packaging storytelling makes trust visible before checkout.', tone: 'info' },
            ],
          },
          {
            title: 'Signature Plates',
            items: menuItems(4),
          },
        ],
      };
    default:
      return {
        summary: 'This customer surface now has working content, real navigation, and demo-ready data instead of a scaffold placeholder.',
        stats: [
          { label: 'Customer routes', value: 'Live' },
          { label: 'Primary flows', value: 'Order + support' },
          { label: 'Data source', value: 'Mock API' },
        ],
        actions: [
          { label: 'Go To Home', href: '/customer/home_guest' },
          { label: 'Order History', href: '/customer/order_history' },
        ],
        panels: [
          { title: 'Recent Orders', items: orderItems(3) },
          { title: 'Support Signals', items: ticketItems(3) },
        ],
      };
  }
}

function buildPartnerContent(screenKey: string): ScreenContent {
  const restaurant = getDemoRestaurant('seed_1');
  const restaurantOrders = getDemoOrders({ restaurantId: 'seed_1' });
  const liveOrders = restaurantOrders.filter((order) => !['delivered', 'cancelled', 'refunded'].includes(order.status));

  switch (screenKey) {
    case 'partner_welcome':
      return {
        summary: 'Start the partner account with the setup checklist, trust requirements, and the operational metrics this kitchen will own every day.',
        stats: [
          { label: 'Restaurant', value: restaurant?.name || 'Partner Kitchen' },
          { label: 'Trust score', value: `${restaurant?.trustScore || 0}/100` },
          { label: 'Menu items', value: String(restaurant?.menu.length || 0) },
        ],
        actions: [
          { label: 'Open Dashboard', href: '/partner/partner_dashboard' },
          { label: 'Menu Hub', href: '/partner/menu_hub' },
        ],
        panels: [
          {
            title: 'Launch Checklist',
            items: [
              { title: 'Hours published', meta: 'Complete', body: 'The kitchen is visible for the full weekly schedule.', tone: 'good' },
              { title: 'Bank payout setup', meta: 'Pending review', body: 'Payout method exists but finance still needs final verification.', tone: 'warn' },
              { title: 'Menu photography and descriptions', meta: 'Ready for growth campaigns', body: 'Most hero items already have supporting copy.', tone: 'info' },
            ],
          },
        ],
      };
    case 'menu_hub':
    case 'menu_item_detail':
    case 'menu_edit_item':
    case 'menu_add_item':
    case 'menu_bulk':
    case 'inventory_flags':
      return {
        summary: 'The menu stack is now presented as an operational control panel: price, prep, availability, and merchandising all live in one place.',
        stats: [
          { label: 'Active items', value: String((restaurant?.menu || []).filter((item) => item.isAvailable).length) },
          { label: 'Bestsellers', value: String((restaurant?.menu || []).filter((item) => item.isBestseller).length) },
          { label: 'Average prep', value: `${restaurant?.avgPrepMinutes || 0} min` },
        ],
        actions: [
          { label: 'Add Item', href: '/partner/menu_add_item' },
          { label: 'Inventory Flags', href: '/partner/inventory_flags' },
        ],
        panels: [
          { title: 'Menu Performance', items: menuItems(5) },
          {
            title: 'Operational Notes',
            items: [
              { title: 'Bulk update safety', meta: 'Price and availability changes should be staged', body: 'Run big edits between peaks so catalog and prep teams stay aligned.', tone: 'warn' },
              { title: 'Top item attention', meta: 'Chicken Biryani and Paneer Tikka lead demand', body: 'Protect these SKUs from stockouts before dinner rush.', tone: 'good' },
            ],
          },
        ],
      };
    case 'partner_insights':
    case 'partner_analytics':
      return {
        summary: 'Turn partner data into action: revenue, conversion, prep efficiency, and issue rates should all lead to a concrete kitchen decision.',
        stats: [
          { label: 'Today revenue', value: formatCurrency(liveOrders.reduce((sum, order) => sum + order.total, 0)) },
          { label: 'Completion rate', value: `${restaurant?.completionRate || 0}%` },
          { label: 'Average rating', value: restaurant?.rating || '4.0' },
        ],
        actions: [
          { label: 'Open Dashboard', href: '/partner/partner_dashboard' },
          { label: 'Payouts', href: '/partner/partner_payouts' },
        ],
        panels: [
          { title: 'Revenue And Fulfilment', items: orderItems(4) },
          {
            title: 'Insight Calls',
            items: [
              { title: 'Dinner prep buffer', meta: '8% queue rise after 19:30', body: 'Staffing one more hot line keeps ETA stable during the evening spike.', tone: 'warn' },
              { title: 'Hero dish contribution', meta: 'Biryani drives repeat demand', body: 'Merchandising the top SKU on menu boosts conversion without wider discounting.', tone: 'good' },
            ],
          },
        ],
      };
    case 'partner_settings':
    case 'partner_payouts':
    case 'payout_methods':
    case 'operating_hours':
    case 'dispute_center':
      return {
        summary: 'Partner settings are now framed around the levers that matter in operations: hours, payouts, disputes, and rule visibility.',
        stats: [
          { label: 'Pending payout', value: formatCurrency(getDemoPayouts()[0]?.amount || 0) },
          { label: 'Hours coverage', value: '7 days' },
          { label: 'Open disputes', value: String(getDemoTickets().filter((ticket) => ticket.status !== 'resolved').length) },
        ],
        actions: [
          { label: 'Operating Hours', href: '/partner/operating_hours' },
          { label: 'Payout Methods', href: '/partner/payout_methods' },
        ],
        panels: [
          { title: 'Settlement Queue', items: payoutItems(3) },
          {
            title: 'Rules And Exceptions',
            items: [
              { title: 'Bank verification', meta: 'Needs finance approval', body: 'Final settlement enablement depends on validated beneficiary details.', tone: 'warn' },
              { title: 'Dispute handling', meta: 'Partner evidence expected within 24 hrs', body: 'Packing proof and prep timestamps are the strongest signals.', tone: 'info' },
            ],
          },
        ],
      };
    default:
      return {
        summary: 'This partner route now surfaces live kitchen context and no longer leaves the operator on a placeholder page.',
        stats: [
          { label: 'Live orders', value: String(liveOrders.length) },
          { label: 'Menu coverage', value: String(restaurant?.menu.length || 0) },
          { label: 'Trust score', value: `${restaurant?.trustScore || 0}/100` },
        ],
        actions: [
          { label: 'Dashboard', href: '/partner/partner_dashboard' },
          { label: 'Settings', href: '/partner/partner_settings' },
        ],
        panels: [
          { title: 'Order Queue', items: liveOrders.length > 0 ? orderItems(4) : [{ title: 'No live orders', body: 'The queue is clear right now.' }] },
          { title: 'Partner Controls', items: menuItems(4) },
        ],
      };
  }
}

function buildAgentContent(screenKey: string): ScreenContent {
  const primaryAgent = getDemoAgents()[0];
  const activeOrder = getDemoOrders({ agentId: primaryAgent?.id || null }).find((order) => order.status !== 'delivered');

  switch (screenKey) {
    case 'new_order_offer':
    case 'pickup_map':
    case 'pickup_confirm':
    case 'delivery_nav':
    case 'delivery_otp':
    case 'delivery_cod':
    case 'secure_handover':
      return {
        summary: 'The active-delivery flow now shows the rider what matters most: pickup readiness, route risk, payout, and secure handoff steps.',
        stats: [
          { label: 'Assigned order', value: activeOrder?.id || 'No live order' },
          { label: 'ETA', value: activeOrder ? `${activeOrder.etaMinutes} min` : 'n/a' },
          { label: 'Trip payout', value: formatCurrency(92) },
        ],
        actions: [
          { label: 'Availability', href: '/agent/availability' },
          { label: 'Earnings', href: '/agent/earnings' },
        ],
        panels: [
          {
            title: 'Trip Summary',
            items: activeOrder ? [{
              title: `${activeOrder.restaurantName} -> ${activeOrder.deliveryAddress.area}`,
              meta: `${activeOrder.id} · ${formatOrderStatus(activeOrder.status)}`,
              body: `${activeOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items · ${activeOrder.paymentMethod.toUpperCase()} · customer ${activeOrder.customerName}`,
              tone: toneForStatus(activeOrder.status),
            }] : [{ title: 'No live trip', body: 'Go online to receive the next order offer.' }],
          },
          {
            title: 'Agent Checklist',
            items: [
              { title: 'Pickup proof', meta: 'Check items and seal', body: 'Use the pickup-confirm step to record missing item risk before departure.', tone: 'warn' },
              { title: 'Secure handover', meta: 'OTP or COD flow', body: 'The right handoff flow depends on payment method and trust signals.', tone: 'info' },
            ],
          },
        ],
      };
    case 'availability':
      return {
        summary: 'Availability is more than a toggle. It should show the rider what they earned, how they performed, and whether they are safe to keep taking orders.',
        stats: [
          { label: 'Status', value: primaryAgent?.availabilityStatus || 'offline' },
          { label: 'Acceptance', value: `${primaryAgent?.earnings.acceptanceRate || 0}%` },
          { label: 'On-time rate', value: `${primaryAgent?.earnings.onTimeRate || 0}%` },
        ],
        actions: [
          { label: 'Open New Offer', href: '/agent/new_order_offer' },
          { label: 'Profile', href: '/agent/agent_profile' },
        ],
        panels: [
          { title: 'Fleet Snapshot', items: agentItems(3) },
          {
            title: 'Session Coaching',
            items: [
              { title: 'Stay online through peak windows', meta: 'Lunch and dinner win most income', body: 'The next spike is expected around 19:15 in Koregaon Park.', tone: 'good' },
            ],
          },
        ],
      };
    case 'earnings':
      return {
        summary: 'Riders should see daily momentum, pending payouts, and which performance metrics push their earnings up or down.',
        stats: [
          { label: 'This week', value: formatCurrency(primaryAgent?.earnings.thisWeek || 0) },
          { label: 'Pending payout', value: formatCurrency(primaryAgent?.earnings.pendingPayout || 0) },
          { label: 'Trips', value: String(primaryAgent?.earnings.deliveryCount || 0) },
        ],
        actions: [
          { label: 'Availability', href: '/agent/availability' },
          { label: 'KYC Status', href: '/agent/agent_kyc_status' },
        ],
        panels: [
          { title: 'Payout Queue', items: payoutItems(3) },
          { title: 'Top Agents', items: agentItems(3) },
        ],
      };
    case 'agent_profile':
    case 'agent_kyc_status':
      return {
        summary: 'Profile and KYC now function as a real operator record instead of a stub, with trust, document, and payout readiness visible together.',
        stats: [
          { label: 'Agent', value: primaryAgent?.name || 'Rider' },
          { label: 'KYC', value: primaryAgent?.kycStatus || 'pending' },
          { label: 'Trust score', value: `${primaryAgent?.trustScore || 0}/100` },
        ],
        actions: [
          { label: 'View Earnings', href: '/agent/earnings' },
          { label: 'Go Online', href: '/agent/availability' },
        ],
        panels: [
          { title: 'Agent Snapshot', items: agentItems(3) },
          {
            title: 'Verification Items',
            items: [
              { title: 'Aadhaar, PAN, license', meta: 'Document chain must stay current', body: 'Verification affects both availability and payout release.', tone: 'warn' },
              { title: 'Bank account', meta: 'Required for settlement', body: 'Pending beneficiary verification can hold back weekly payout runs.', tone: 'info' },
            ],
          },
        ],
      };
    default:
      return {
        summary: 'This agent route now shows active-delivery context and rider operations data instead of a placeholder.',
        stats: [
          { label: 'Fleet online', value: String(getDemoAgents().filter((agent) => agent.availabilityStatus === 'online').length) },
          { label: 'Current trip', value: activeOrder?.id || 'none' },
          { label: 'Rating', value: primaryAgent?.rating || 'n/a' },
        ],
        actions: [
          { label: 'Open Offer', href: '/agent/new_order_offer' },
          { label: 'Earnings', href: '/agent/earnings' },
        ],
        panels: [
          { title: 'Rider Snapshot', items: agentItems(3) },
          { title: 'Current Order', items: activeOrder ? orderItems(1) : [{ title: 'No current order', body: 'The rider is between trips.' }] },
        ],
      };
  }
}

function buildAdminContent(screenKey: string): ScreenContent {
  const snapshot = getDemoSnapshot();
  const activeOrders = snapshot.orders.filter((order) => !['delivered', 'cancelled', 'refunded'].includes(order.status));

  switch (screenKey) {
    case 'admin_dashboard':
    case 'admin_desktop':
    case 'live_heatmap':
      return {
        summary: 'Admin overview now behaves like an ops cockpit with demand, queue health, and trust exceptions visible together.',
        stats: [
          { label: 'Active orders', value: String(activeOrders.length) },
          { label: 'Online agents', value: String(snapshot.agents.filter((agent) => agent.availabilityStatus === 'online').length) },
          { label: 'Open alerts', value: String(snapshot.fraudAlerts.filter((alert) => alert.status !== 'dismissed').length) },
        ],
        actions: [
          { label: 'Fraud Alerts', href: '/admin/fraud_alerts' },
          { label: 'Financial Master', href: '/admin/financial_master' },
        ],
        panels: [
          { title: 'Active Order Queue', items: orderItems(4) },
          { title: 'Trust Watchlist', items: alertItems(3) },
        ],
      };
    case 'global_entities':
    case 'entity_mgmt_desk':
    case 'customer_dir':
    case 'partner_detail':
    case 'agent_workforce':
    case 'agent_kyc_queue':
    case 'onboarding_review':
    case 'team_members':
    case 'security_login':
      return {
        summary: 'Entity management now shows the platform relationships that matter for review: customers, partners, riders, access control, and KYC risk.',
        stats: [
          { label: 'Customers', value: String(snapshot.customers.length) },
          { label: 'Partners', value: String(snapshot.restaurants.length) },
          { label: 'Agents', value: String(snapshot.agents.length) },
        ],
        actions: [
          { label: 'Customer Directory', href: '/admin/customer_dir' },
          { label: 'KYC Queue', href: '/admin/agent_kyc_queue' },
        ],
        panels: [
          { title: 'Agents And Access', items: agentItems(4) },
          {
            title: 'Partner Records',
            items: snapshot.restaurants.slice(0, 4).map((restaurant) => ({
              title: `${restaurant.name} · ${restaurant.status}`,
              meta: `${restaurant.cuisine_types.join(', ')} · ${restaurant.rating} stars`,
              body: `Trust ${restaurant.trustScore}/100 · payout balance ${formatCurrency(restaurant.walletBalance)}`,
              tone: toneForStatus(restaurant.status),
            })),
          },
        ],
      };
    case 'escalation':
    case 'reassignment':
    case 'agent_handoff':
    case 'trust_score':
    case 'fraud_alerts':
    case 'promotions':
    case 'pricing_queue':
      return {
        summary: 'Operational control pages now surface the exceptions that require human judgment: reassignments, trust issues, pricing, and active promotions.',
        stats: [
          { label: 'Escalations', value: String(snapshot.tickets.filter((ticket) => ticket.status !== 'resolved').length) },
          { label: 'Fraud alerts', value: String(snapshot.fraudAlerts.length) },
          { label: 'Queue actions', value: '9 today' },
        ],
        actions: [
          { label: 'Escalation Center', href: '/admin/escalation' },
          { label: 'Trust Score', href: '/admin/trust_score' },
        ],
        panels: [
          { title: 'Support Queue', items: ticketItems(4) },
          { title: 'Fraud And Trust', items: alertItems(4) },
        ],
      };
    case 'financial_master':
    case 'payouts_settle':
    case 'commission':
      return {
        summary: 'Finance pages now show wallet exposure, settlement flow, and commission pressure in one place for faster operator decisions.',
        stats: [
          { label: 'Pending settlements', value: formatCurrency(snapshot.payouts.reduce((sum, payout) => sum + payout.amount, 0)) },
          { label: 'Customer credits', value: formatCurrency(snapshot.walletTransactions.filter((tx) => tx.userType === 'customer' && tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0)) },
          { label: 'At-risk payouts', value: '2' },
        ],
        actions: [
          { label: 'Payouts', href: '/admin/payouts_settle' },
          { label: 'Refund API', href: '/api/admin/refund' },
        ],
        panels: [
          { title: 'Settlement Runs', items: payoutItems(4) },
          {
            title: 'Wallet Exposure',
            items: [
              { title: 'Customer wallet credits', meta: 'Refund and compensation path', body: `Current customer wallet balance pool: ${formatCurrency(snapshot.customers.reduce((sum, customer) => sum + customer.walletBalance, 0))}`, tone: 'info' },
              { title: 'Agent payout readiness', meta: 'KYC and bank verification matter', body: 'One rider is still pending verification before the next release file.', tone: 'warn' },
            ],
          },
        ],
      };
    default:
      return {
        summary: 'This admin route now renders meaningful operational data instead of a scaffold message.',
        stats: [
          { label: 'Orders', value: String(snapshot.orders.length) },
          { label: 'Tickets', value: String(snapshot.tickets.length) },
          { label: 'Alerts', value: String(snapshot.fraudAlerts.length) },
        ],
        actions: [
          { label: 'Admin Dashboard', href: '/admin/admin_dashboard' },
          { label: 'Operations', href: '/admin/escalation' },
        ],
        panels: [
          { title: 'Queue Snapshot', items: orderItems(4) },
          { title: 'Tickets And Alerts', items: [...ticketItems(2), ...alertItems(2)] },
        ],
      };
  }
}

function getScreenContent(role: Role, screenKey: string): ScreenContent {
  switch (role) {
    case 'customer':
      return buildCustomerContent(screenKey);
    case 'partner':
      return buildPartnerContent(screenKey);
    case 'agent':
      return buildAgentContent(screenKey);
    case 'admin':
      return buildAdminContent(screenKey);
    default:
      return {
        summary: 'This route now has demo content.',
        stats: [],
        actions: [{ label: 'Home', href: '/' }],
        panels: [],
      };
  }
}

function renderPanelItem(item: PanelItem) {
  const tone = toneStyles[item.tone || 'default'];

  return (
    <div
      key={`${item.title}-${item.meta || item.body || ''}`}
      style={{
        padding: 'var(--sp-4)',
        border: `1px solid ${tone.border}`,
        background: 'var(--bg-overlay)',
        borderRadius: 'var(--r-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)', marginBottom: item.meta || item.body ? 'var(--sp-2)' : 0 }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{item.title}</h3>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '999px',
            border: `1px solid ${tone.border}`,
            background: tone.background,
            color: tone.color,
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
          }}
        >
          {item.tone ? item.tone.toUpperCase() : 'LIVE'}
        </span>
      </div>
      {item.meta && (
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', marginBottom: item.body ? 'var(--sp-2)' : 0 }}>
          {item.meta}
        </p>
      )}
      {item.body && (
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)' }}>
          {item.body}
        </p>
      )}
      {item.href && (
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <Link href={item.href} style={{ fontSize: 'var(--text-sm)', color: 'var(--blue)' }}>
            Open →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ScaffoldScreen({
  role,
  screenKey,
}: {
  role: Role;
  screenKey: string;
}) {
  const screens = ALL_SCREENS[role];
  const screen = screens[screenKey];

  if (!screen) {
    notFound();
  }

  const tab = screen.tab
    ? ALL_TABS[role].find((entry) => entry.key === screen.tab)
    : null;
  const content = getScreenContent(role, screenKey);
  const relatedScreens = getScreensForTab(screen.tab, screens)
    .filter(([key]) => key !== screenKey)
    .slice(0, 4);
  const roleMeta = ROLE_META[role];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      <section
        style={{
          background: `linear-gradient(135deg, ${roleMeta.color}18 0%, rgba(13,17,23,0.94) 72%)`,
          border: `1px solid ${roleMeta.color}33`,
          borderRadius: 'var(--r-xl)',
          padding: 'var(--sp-6)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: roleMeta.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {role} {tab ? `/ ${tab.label}` : ''}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
            {screenKey}
          </span>
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
          {screen.label}
        </h1>
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', maxWidth: 700 }}>
          {content.summary}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)', marginTop: 'var(--sp-5)' }}>
          {content.actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--r-md)',
                border: `1px solid ${roleMeta.color}44`,
                background: 'var(--bg-overlay)',
                color: 'var(--text)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
              }}
            >
              {action.label}
            </Link>
          ))}
          <Link
            href={getRoleHomePath(role)}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-subtle)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            Role Hub
          </Link>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--sp-3)',
        }}
      >
        {content.stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: 'var(--sp-4)',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </section>

      {content.panels.map((panel) => (
        <section
          key={panel.title}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-5)',
          }}
        >
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: panel.description ? '6px' : 0 }}>
              {panel.title}
            </h2>
            {panel.description && (
              <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)' }}>
                {panel.description}
              </p>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--sp-3)',
            }}
          >
            {panel.items.map((item) => renderPanelItem(item))}
          </div>
        </section>
      ))}

      {relatedScreens.length > 0 && (
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-5)',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>
            Related Screens
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--sp-3)' }}>
            {relatedScreens.map(([key, related]) => (
              <Link
                key={key}
                href={getScreenPath(role, key)}
                style={{
                  display: 'block',
                  padding: 'var(--sp-4)',
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-overlay)',
                  color: 'var(--text)',
                }}
              >
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '4px' }}>
                  {related.label}
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
