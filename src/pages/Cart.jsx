import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { GlassCard } from '../components/ui/GlassCard';
import { Stepper } from '../components/ui/Stepper';
import { Button } from '../components/ui/Button';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';

export default function Cart() {
  const navigate = useNavigate();
  const [promo, setPromo] = useState('');
  const { loading, items, subtotal, delivery, service, discount, total, setQuantity, applyPromo, clearCart } = useCart();

  return (
    <PageWrapper className="mx-auto max-w-[1380px]">
      <motion.section variants={childVariants} className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Your evening edit</p>
          <h1 className="font-display text-5xl italic text-white">Cart composition</h1>
        </div>
        <Link to="/" className="text-sm text-[color:var(--text-secondary)]">Continue browsing →</Link>
      </motion.section>

      {loading ? (
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <h2 className="font-display text-4xl italic text-white">Loading your cart</h2>
            <p className="mt-4 text-[color:var(--text-secondary)]">Pulling your latest items from the kitchen ledger.</p>
          </GlassCard>
        </motion.section>
      ) : items.length === 0 ? (
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <div className="mx-auto mb-6 w-28 text-6xl">🍜</div>
            <h2 className="font-display text-4xl italic text-white">Your table is empty</h2>
            <p className="mt-4 text-[color:var(--text-secondary)]">Curate a few luminous dishes and come back when the craving gets louder.</p>
            <div className="mt-8"><Link to="/"><Button>Browse restaurants</Button></Link></div>
          </GlassCard>
        </motion.section>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.55fr_0.85fr]">
          <motion.section variants={childVariants} className="space-y-4">
            {items.map((item) => (
              <GlassCard key={item.id} className="grid gap-4 p-4 md:grid-cols-[140px_1fr_auto] md:items-center">
                <img src={item.image} alt={item.name} className="h-28 w-full rounded-[20px] object-cover" />
                <div>
                  <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{item.restaurantName}</p>
                  <p className="mt-3 text-lg font-bold tabular-nums text-white">${item.price}</p>
                </div>
                <Stepper value={item.quantity} onChange={(next) => setQuantity(item.id, Math.max(0, next))} />
              </GlassCard>
            ))}
          </motion.section>

          <motion.aside variants={childVariants} className="xl:sticky xl:top-28 xl:self-start">
            <GlassCard interactive={false} className="space-y-6 p-6">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Order summary</p>
                <h2 className="font-display text-3xl italic text-white">Your glowing tab</h2>
              </div>
              <div className="space-y-3 text-sm text-[color:var(--text-secondary)]">
                <div className="flex justify-between"><span>Subtotal</span><motion.span layout className="tabular-nums text-white">${subtotal.toFixed(2)}</motion.span></div>
                <div className="flex justify-between"><span>Delivery</span><motion.span layout className="tabular-nums text-white">${delivery.toFixed(2)}</motion.span></div>
                <div className="flex justify-between"><span>Service fee</span><motion.span layout className="tabular-nums text-white">${service.toFixed(2)}</motion.span></div>
                <div className="flex justify-between"><span>Discount</span><motion.span layout className="tabular-nums text-emerald-300">-${discount.toFixed(2)}</motion.span></div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-3">
                <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Promo code</div>
                <div className="flex gap-2">
                  <input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Try GLOW10" className="flex-1 bg-transparent px-3 text-white outline-none placeholder:text-[color:var(--text-muted)]" />
                  <Button variant="secondary" className="px-4 py-2 text-xs" onClick={() => applyPromo(promo)}>Apply</Button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm uppercase tracking-[0.14em] text-[color:var(--text-muted)]">Total</span>
                <motion.span layout className="text-3xl font-extrabold tabular-nums text-white">${total.toFixed(2)}</motion.span>
              </div>
              <Button className="h-14 w-full text-base" onClick={() => navigate('/checkout')}>Continue to checkout</Button>
              <button onClick={clearCart} className="w-full text-center text-sm text-[color:var(--text-secondary)]">Clear cart</button>
            </GlassCard>
          </motion.aside>
        </div>
      )}
    </PageWrapper>
  );
}
