import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useCustomerSession } from '../../hooks/useCustomerSession';
import { useOrderFlow } from '../../hooks/useOrderFlow';
import { Avatar } from '../ui/Avatar';

const productLinks = [
  {
    label: 'Browse',
    to: '/',
    match: (pathname) => pathname === '/' || pathname.startsWith('/restaurant') || pathname === '/cart' || pathname.startsWith('/checkout') || pathname.startsWith('/login') || pathname.startsWith('/payment') || pathname.startsWith('/profile'),
  },
  {
    label: 'Orders',
    to: '/orders',
    match: (pathname) => pathname.startsWith('/orders') || pathname.startsWith('/support'),
  },
  {
    label: 'Track',
    to: '/track',
    match: (pathname) => pathname.startsWith('/track') || pathname.startsWith('/order-confirmation'),
  },
];

export function Navbar() {
  const { itemCount } = useCart();
  const { activeOrder } = useOrderFlow();
  const { customer, isAuthenticated } = useCustomerSession();
  const location = useLocation();
  const { scrollY } = useScroll();
  const blurProgress = useSpring(scrollY, { stiffness: 120, damping: 24 });
  const backdropFilter = useTransform(blurProgress, (value) => `blur(${value > 50 ? 28 : 22}px) saturate(140%)`);
  const borderOpacity = useTransform(blurProgress, (value) => (value > 50 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)'));
  const activePath = location.pathname;
  return (
    <motion.nav
      className="fixed inset-x-0 top-5 z-50 px-4 md:px-6"
      style={{ backdropFilter }}
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 rounded-[26px] border px-4 py-3 md:px-5" style={{ borderColor: borderOpacity, background: 'rgba(9, 10, 14, 0.72)', boxShadow: 'var(--shadow-glass)' }}>
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <span className="font-display text-base font-extrabold tracking-[-0.04em] text-white">B</span>
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-[-0.04em] text-white">BiteBlast</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Food delivery with proof built in.</div>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-2 py-2 md:flex">
          {productLinks.map((link) => {
            const target = link.to === '/track' && activeOrder ? `/track/${activeOrder.id}` : link.to;
            const isActive = link.match(activePath);

            return (
              <NavLink
                key={link.label}
                to={target}
                className={`relative rounded-full px-4 py-2 text-sm transition-colors ${isActive ? 'text-white' : 'text-[color:var(--text-secondary)] hover:text-white'}`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="bb-navbar-pill"
                    className="absolute inset-0 rounded-full border border-white/12 bg-white/[0.08]"
                  />
                ) : null}
                <span className="relative z-10">{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition hover:border-white/16 hover:bg-white/10"
            aria-label="Open cart"
          >
            <span className="text-lg">🛍️</span>
            <motion.span
              key={itemCount}
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 360, damping: 18 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--accent-primary)] px-1 text-[11px] font-bold text-white"
            >
              {itemCount}
            </motion.span>
          </Link>

          <Link
            to="/profile"
            className={`inline-flex items-center gap-2 rounded-full border px-2 py-1.5 transition ${
              isAuthenticated
                ? 'border-[rgba(239,127,26,0.24)] bg-[rgba(239,127,26,0.12)]'
                : 'border-white/10 bg-white/6 hover:bg-white/8'
            }`}
          >
            <Avatar
              src={customer?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'}
              alt={customer?.name || 'Customer avatar'}
              size="sm"
            />
            <span className="hidden pr-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-secondary)] md:inline">
              {isAuthenticated ? (customer?.name || 'Verified') : 'Sign in'}
            </span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
