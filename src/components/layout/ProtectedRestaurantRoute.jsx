import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { PageWrapper } from './PageWrapper';
import { useCustomerSession } from '../../hooks/useCustomerSession';
import { useRestaurantSession } from '../../hooks/useRestaurantSession';
import { isRestaurantRole } from '../../lib/restaurant';

export function ProtectedRestaurantRoute({ children = null }) {
  const location = useLocation();
  const { loading: customerLoading, isAuthenticated, role } = useCustomerSession();
  const { loading: restaurantLoading } = useRestaurantSession();

  if (customerLoading) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <div className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <h1 className="font-display text-4xl italic text-white">Checking partner access</h1>
          </GlassCard>
        </div>
      </PageWrapper>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/partner/auth?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (!isRestaurantRole(role)) {
    return <Navigate to={`/unauthorized?required=vendor&next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (restaurantLoading) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <div className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <h1 className="font-display text-4xl italic text-white">Checking partner access</h1>
          </GlassCard>
        </div>
      </PageWrapper>
    );
  }

  return children || <Outlet />;
}
