import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useOrderFlow } from '../hooks/useOrderFlow';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';

function titleForMethod(method) {
  if (method === 'upi') return 'Approve the UPI payment';
  if (method === 'card') return 'Confirm your card payment';
  return 'Complete payment';
}

export default function Payment() {
  const navigate = useNavigate();
  const { intentId } = useParams();
  const { getPaymentIntent, completePaymentIntent } = useOrderFlow();
  const { refreshCart } = useCart();
  const { pushToast } = useToast();
  const [intent, setIntent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    upi: 'ketan@okaxis',
    cardNumber: '4111 1111 1111 1111',
    expiry: '12/28',
    cvv: '123',
    name: 'Ketan Mehta',
  });

  useEffect(() => {
    let ignore = false;

    async function loadIntent() {
      try {
        const response = await getPaymentIntent(intentId);
        if (ignore) return;
        setIntent(response);
      } catch (error) {
        if (ignore) return;
        pushToast({
          type: 'error',
          title: 'Payment unavailable',
          description: error.message || 'We could not load this payment session.',
        });
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadIntent();
    return () => {
      ignore = true;
    };
  }, [getPaymentIntent, intentId, pushToast]);

  const method = intent?.method || 'upi';
  const paymentSummary = useMemo(() => intent?.checkout_payload?.summary || null, [intent]);

  const finalize = async (outcome) => {
    try {
      setProcessing(true);
      const result = await completePaymentIntent({
        intentId,
        outcome,
        failureReason: outcome === 'failed' ? 'The demo bank rejected this transaction.' : null,
      });

      if (outcome === 'failed') {
        setIntent((current) => ({ ...current, status: 'failed' }));
        return;
      }

      await refreshCart();
      navigate(`/order-confirmation/${result.order.id}`, { replace: true });
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Payment could not finish',
        description: error.message || 'Please try again.',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <h1 className="font-display text-4xl italic text-white">Loading payment</h1>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  if (!intent) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <h1 className="font-display text-4xl italic text-white">Payment session not found</h1>
            <div className="mt-8">
              <Link to="/checkout"><Button>Back to checkout</Button></Link>
            </div>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="mx-auto max-w-[1080px]">
      <motion.section variants={childVariants} className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
        <GlassCard interactive={false} className="p-8 md:p-10">
          <div className="flex flex-wrap gap-2">
            <Badge>{method.toUpperCase()}</Badge>
            <Badge>Demo secure pay</Badge>
          </div>
          <h1 className="mt-6 font-display text-5xl italic text-white">{titleForMethod(method)}</h1>
          <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
            This is a demo payment handoff with real app states behind it. Success creates the order. Failure returns a retry path.
          </p>

          {method === 'upi' ? (
            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-6">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">UPI ID</div>
              <input
                value={paymentForm.upi}
                onChange={(event) => setPaymentForm((current) => ({ ...current, upi: event.target.value }))}
                className="mt-2 w-full bg-transparent text-2xl font-semibold text-white outline-none"
              />
              <div className="mt-6 text-sm text-[color:var(--text-secondary)]">Open your bank app, approve the collect request, then finish the demo below.</div>
            </div>
          ) : (
            <div className="mt-8 grid gap-4">
              <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Card number</div>
                <input
                  value={paymentForm.cardNumber}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, cardNumber: event.target.value }))}
                  className="mt-2 w-full bg-transparent text-white outline-none"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="rounded-[22px] border border-white/10 bg-white/6 p-4 md:col-span-2">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Cardholder</div>
                  <input
                    value={paymentForm.name}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, name: event.target.value }))}
                    className="mt-2 w-full bg-transparent text-white outline-none"
                  />
                </label>
                <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">CVV</div>
                  <input
                    value={paymentForm.cvv}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, cvv: event.target.value }))}
                    className="mt-2 w-full bg-transparent text-white outline-none"
                  />
                </label>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="h-14 text-base disabled:cursor-not-allowed disabled:opacity-60" onClick={() => finalize('success')} disabled={processing}>
              {processing ? 'Processing...' : `Pay ₹${Number(intent.amount || 0).toFixed(2)}`}
            </Button>
            <Button variant="secondary" className="h-14 text-base" onClick={() => finalize('failed')} disabled={processing}>
              Simulate failure
            </Button>
            <Link to="/checkout"><Button variant="ghost" className="h-14 text-base">Back to checkout</Button></Link>
          </div>

          {intent.status === 'failed' ? (
            <div className="mt-6 rounded-[22px] border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100">
              Payment failed in demo mode. You can retry the payment or go back and switch methods.
            </div>
          ) : null}
        </GlassCard>

        <motion.div variants={childVariants} className="space-y-6">
          <GlassCard interactive={false} className="p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Payment summary</p>
            <div className="space-y-3 text-sm text-[color:var(--text-secondary)]">
              <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums text-white">₹{Number(paymentSummary?.subtotal || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="tabular-nums text-white">₹{Number(paymentSummary?.delivery || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Platform fee</span><span className="tabular-nums text-white">₹{Number(paymentSummary?.service || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="tabular-nums text-emerald-300">-₹{Number(paymentSummary?.discount || 0).toFixed(2)}</span></div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Amount</span>
                <span className="text-3xl font-bold tabular-nums text-white">₹{Number(intent.amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </GlassCard>
          <GlassCard interactive={false} className="p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Reference</p>
            <div className="break-all text-lg font-semibold text-white">{intent.reference}</div>
          </GlassCard>
        </motion.div>
      </motion.section>
    </PageWrapper>
  );
}
