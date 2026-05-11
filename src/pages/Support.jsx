import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrderFlow } from '../hooks/useOrderFlow';
import { useToast } from '../hooks/useToast';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';

const issueTypes = [
  { id: 'late_delivery', label: 'Late delivery' },
  { id: 'missing_items', label: 'Missing items' },
  { id: 'payment_issue', label: 'Payment issue' },
  { id: 'food_quality', label: 'Food quality' },
  { id: 'other', label: 'Other' },
];

export default function Support() {
  const { orderHistory } = useOrderFlow();
  const { pushToast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState(orderHistory[0]?.id || '');
  const [issueType, setIssueType] = useState(issueTypes[0].id);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const selectedOrder = useMemo(
    () => orderHistory.find((order) => order.id === selectedOrderId) || null,
    [orderHistory, selectedOrderId],
  );

  const submitTicket = async () => {
    if (!selectedOrderId) {
      pushToast({
        type: 'error',
        title: 'Pick an order first',
        description: 'Support tickets need to be attached to a real order.',
      });
      return;
    }

    if (!message.trim()) {
      pushToast({
        type: 'error',
        title: 'Add some detail',
        description: 'A short message helps us route the issue correctly.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.rpc('create_support_ticket', {
        p_order_id: selectedOrderId,
        p_issue_type: issueType,
        p_message: message.trim(),
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit ticket.');
      }

      pushToast({
        type: 'success',
        title: 'Support ticket created',
        description: 'We saved your issue and linked it to the order timeline.',
      });
      setSubmittedTicket({
        orderId: selectedOrderId,
        issueType,
        message: message.trim(),
      });
      setMessage('');
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Support is unavailable',
        description: error.message || 'Please try again in a moment.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (orderHistory.length === 0) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <div className="mx-auto mb-6 w-28 text-6xl">🍜</div>
            <h1 className="font-display text-4xl italic text-white">Support starts after your first order</h1>
            <p className="mt-4 text-[color:var(--text-secondary)]">Once you place an order, we can attach help, refunds, and issue reporting to a real delivery timeline.</p>
            <div className="mt-8">
              <Link to="/"><Button>Browse kitchens</Button></Link>
            </div>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  if (submittedTicket && selectedOrder) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <motion.section variants={childVariants} className="grid place-items-center py-20">
          <GlassCard interactive={false} className="w-full max-w-2xl p-8 md:p-10">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Support request saved</p>
            <h1 className="font-display text-5xl italic text-white">We’ve logged your issue</h1>
            <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
              Your request is attached to <span className="font-semibold text-white">{selectedOrder.restaurant}</span> and will stay tied to this order timeline.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Order ID</div>
                <div className="mt-2 break-all text-lg font-bold text-white">{submittedTicket.orderId}</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Issue type</div>
                <div className="mt-2 text-lg font-bold text-white">
                  {issueTypes.find((issue) => issue.id === submittedTicket.issueType)?.label || 'Support issue'}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/6 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Submitted note</div>
              <div className="mt-2 break-words text-sm text-[color:var(--text-secondary)]">{submittedTicket.message}</div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={`/track/${selectedOrder.id}`}><Button>Back to tracking</Button></Link>
              <Link to="/orders"><Button variant="secondary">Open order history</Button></Link>
              <Button
                variant="ghost"
                onClick={() => {
                  setSubmittedTicket(null);
                  setIssueType(issueTypes[0].id);
                }}
              >
                Report another issue
              </Button>
            </div>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="mx-auto max-w-[1180px]">
      <motion.section variants={childVariants} className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Support</p>
          <h1 className="font-display text-5xl italic text-white">Get help with a real order</h1>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--text-secondary)]">Use this for payment problems, missing items, quality issues, or late delivery. Every report is tied to an order ID.</p>
        </div>
        <Link to="/orders" className="text-sm text-[color:var(--text-secondary)]">Back to orders →</Link>
      </motion.section>

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.section variants={childVariants} className="space-y-6">
          <GlassCard interactive={false} className="p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Select order</p>
            <div className="space-y-3">
              {orderHistory.map((order) => {
                const selected = order.id === selectedOrderId;
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full rounded-[22px] border p-4 text-left transition-colors ${selected ? 'border-[color:var(--accent-primary)] bg-[rgba(255,107,53,0.14)]' : 'border-white/10 bg-white/6'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">{order.restaurant}</div>
                        <div className="mt-1 text-xs text-[color:var(--text-secondary)]">{order.date}</div>
                        <div className="mt-2 text-xs text-[color:var(--text-secondary)]">{order.items.map((item) => `${item.quantity} × ${item.name}`).join(' · ')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold tabular-nums text-white">${Number(order.total).toFixed(2)}</div>
                        <div className="mt-1 text-xs text-[color:var(--text-secondary)]">{order.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </motion.section>

        <motion.aside variants={childVariants} className="space-y-6">
          <GlassCard interactive={false} className="p-6">
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Issue details</p>
            <div className="grid gap-4">
              <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Issue type</div>
                <select value={issueType} onChange={(event) => setIssueType(event.target.value)} className="mt-2 w-full bg-transparent text-white outline-none">
                  {issueTypes.map((issue) => (
                    <option key={issue.id} className="bg-slate-950" value={issue.id}>{issue.label}</option>
                  ))}
                </select>
              </label>

              <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Tell us what happened</div>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="mt-2 min-h-32 w-full resize-none bg-transparent text-white outline-none"
                  placeholder="Example: the rider delivered one item short and the bag was unsealed."
                />
              </label>
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Selected order</p>
            {selectedOrder ? (
              <>
                <div className="text-xl font-semibold text-white">{selectedOrder.restaurant}</div>
                <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{selectedOrder.destinationLine}</div>
                <div className="mt-4 space-y-2 text-sm text-[color:var(--text-secondary)]">
                  {selectedOrder.items.map((item) => (
                    <div key={`${selectedOrder.id}-${item.id}`} className="flex items-center justify-between">
                      <span>{item.quantity} × {item.name}</span>
                      <span className="tabular-nums text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="h-14 text-base disabled:cursor-not-allowed disabled:opacity-60" onClick={submitTicket} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit support ticket'}
              </Button>
              {selectedOrder ? <Link to={`/track/${selectedOrder.id}`}><Button variant="secondary">Track this order</Button></Link> : null}
            </div>
          </GlassCard>
        </motion.aside>
      </div>
    </PageWrapper>
  );
}
