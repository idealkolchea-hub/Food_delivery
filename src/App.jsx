import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CustomerRouteLayout } from './components/layout/CustomerShell';
import { ProtectedCustomerRoute } from './components/layout/ProtectedCustomerRoute';
import { ProtectedRestaurantRoute } from './components/layout/ProtectedRestaurantRoute';
import { ProtectedAgentRoute } from './components/layout/ProtectedAgentRoute';
import { ProtectedAdminRoute } from './components/layout/ProtectedAdminRoute';
import { PartnerRouteLayout } from './components/layout/PartnerShell';
import { AgentRouteLayout } from './components/layout/AgentShell';
import { StudioRouteLayout } from './components/layout/StudioShell';
import { FloatingOrbs } from './components/layout/FloatingOrbs';
import { CustomCursor } from './components/layout/CustomCursor';
import { ToastStack } from './components/layout/Toast';
import { restaurants } from './data/mockData';
import { useOrderFlow } from './hooks/useOrderFlow';

const Home = lazy(() => import('./pages/Home'));
const Restaurant = lazy(() => import('./pages/Restaurant'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CustomerAuth = lazy(() => import('./pages/CustomerAuth'));
const Profile = lazy(() => import('./pages/Profile'));
const Payment = lazy(() => import('./pages/Payment'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Tracking = lazy(() => import('./pages/Tracking'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Support = lazy(() => import('./pages/Support'));
const PartnerAuth = lazy(() => import('./pages/PartnerAuth'));
const PartnerDashboard = lazy(() => import('./pages/PartnerDashboard'));
const PartnerQueue = lazy(() => import('./pages/PartnerQueue'));
const PartnerOrderDetail = lazy(() => import('./pages/PartnerOrderDetail'));
const AgentAuth = lazy(() => import('./pages/AgentAuth'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const AgentOrders = lazy(() => import('./pages/AgentOrders'));
const AgentProfile = lazy(() => import('./pages/AgentProfile'));
const AgentOrderDetail = lazy(() => import('./pages/AgentOrderDetail'));
const StudioDashboard = lazy(() => import('./pages/StudioDashboard'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

function LegacyRestaurantRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const restaurantId = params.get('id');
  const restaurant = restaurants.find((entry) => entry.id === restaurantId || entry.slug === restaurantId) || restaurants[0];

  return <Navigate to={`/restaurant/${restaurant.slug}`} replace />;
}

function ActiveTrackRedirect() {
  const { activeOrder } = useOrderFlow();

  if (!activeOrder) {
    return <Navigate to="/orders" replace />;
  }

  return <Navigate to={`/track/${activeOrder.id}`} replace />;
}

function PartnerQueueRedirect() {
  return <Navigate to="/partner/queue" replace />;
}

function PartnerOrdersRedirect() {
  return <Navigate to="/partner/orders" replace />;
}

function AgentActiveRedirect() {
  return <Navigate to="/agent/active" replace />;
}

function AgentOrdersRedirect() {
  return <Navigate to="/agent/orders" replace />;
}

function AgentProfileRedirect() {
  return <Navigate to="/agent/profile" replace />;
}

export default function App() {
  const location = useLocation();

  return (
    <div className="bb-app-shell">
      <div className="bb-bg" aria-hidden="true">
        <div className="bb-dotmatrix" />
        <div className="bb-grain" />
      </div>
      <FloatingOrbs />
      <CustomCursor />
      <AnimatePresence mode="wait">
        <Suspense
          fallback={(
            <main className="relative z-10 min-h-screen px-4 pb-12 pt-28 md:px-8 xl:px-12">
              <div className="mx-auto max-w-[1180px]">
                <div className="glass-card shimmer h-[280px] rounded-[28px]" />
              </div>
            </main>
          )}
        >
          <Routes location={location} key={location.pathname + location.search}>
            <Route element={<CustomerRouteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/restaurant/:restaurantSlug" element={<Restaurant />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<CustomerAuth />} />
              <Route path="/auth" element={<Navigate to="/login" replace />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/payment/:intentId" element={<ProtectedCustomerRoute><Payment /></ProtectedCustomerRoute>} />
              <Route path="/order-confirmation/:orderId" element={<ProtectedCustomerRoute><OrderConfirmation /></ProtectedCustomerRoute>} />
              <Route path="/track" element={<ActiveTrackRedirect />} />
              <Route path="/track/:orderId" element={<ProtectedCustomerRoute><Tracking /></ProtectedCustomerRoute>} />
              <Route path="/orders" element={<ProtectedCustomerRoute><OrderHistory /></ProtectedCustomerRoute>} />
              <Route path="/support" element={<ProtectedCustomerRoute><Support /></ProtectedCustomerRoute>} />
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Route>

            <Route path="/studio" element={<ProtectedAdminRoute><StudioRouteLayout /></ProtectedAdminRoute>}>
              <Route index element={<StudioDashboard />} />
              <Route path="auth" element={<Navigate to="/login?next=/studio" replace />} />
            </Route>

            <Route path="/partner/auth" element={<PartnerAuth />} />
            <Route path="/partner" element={<ProtectedRestaurantRoute><PartnerRouteLayout /></ProtectedRestaurantRoute>}>
              <Route index element={<PartnerQueueRedirect />} />
              <Route path="queue" element={<PartnerDashboard />} />
              <Route path="orders" element={<PartnerQueue bucket="all" title="All orders" description="Review the full restaurant order ledger, including live queue work and completed tickets." />} />
              <Route path="orders/:orderId" element={<PartnerOrderDetail />} />
              <Route path="incoming" element={<PartnerQueueRedirect />} />
              <Route path="active" element={<PartnerQueueRedirect />} />
              <Route path="ready" element={<PartnerQueueRedirect />} />
              <Route path="completed" element={<PartnerOrdersRedirect />} />
            </Route>

            <Route path="/agent/auth" element={<AgentAuth />} />
            <Route path="/delivery" element={<Navigate to="/agent" replace />} />
            <Route path="/agent" element={<ProtectedAgentRoute><AgentRouteLayout /></ProtectedAgentRoute>}>
              <Route index element={<AgentActiveRedirect />} />
              <Route path="active" element={<AgentDashboard />} />
              <Route path="orders" element={<AgentOrders />} />
              <Route path="orders/:orderId" element={<AgentOrderDetail />} />
              <Route path="profile" element={<AgentProfile />} />
              <Route path="availability" element={<AgentProfileRedirect />} />
              <Route path="earnings" element={<AgentProfileRedirect />} />
              <Route path="agent_profile" element={<AgentProfileRedirect />} />
              <Route path="agent_kyc_status" element={<AgentProfileRedirect />} />
              <Route path="new_order_offer" element={<AgentOrdersRedirect />} />
              <Route path="delivery_nav" element={<AgentActiveRedirect />} />
              <Route path="pickup_map" element={<AgentActiveRedirect />} />
              <Route path="pickup_confirm" element={<AgentActiveRedirect />} />
              <Route path="secure_handover" element={<AgentActiveRedirect />} />
              <Route path="delivery_otp" element={<AgentActiveRedirect />} />
              <Route path="delivery_cod" element={<AgentActiveRedirect />} />
            </Route>

            <Route path="/customer" element={<Navigate to="/" replace />} />
            <Route path="/customer/home_guest" element={<Navigate to="/" replace />} />
            <Route path="/customer/home_logged" element={<Navigate to="/" replace />} />
            <Route path="/customer/restaurant_detail" element={<LegacyRestaurantRedirect />} />
            <Route path="/customer/cart" element={<Navigate to="/cart" replace />} />
            <Route path="/customer/delivery_track" element={<ActiveTrackRedirect />} />
            <Route path="/customer/order_history" element={<Navigate to="/orders" replace />} />
            <Route path="/admin/admin_dashboard" element={<Navigate to="/studio" replace />} />
            <Route path="/admin" element={<Navigate to="/studio" replace />} />
            <Route path="/dashboard" element={<Navigate to="/studio" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
      <ToastStack />
    </div>
  );
}
