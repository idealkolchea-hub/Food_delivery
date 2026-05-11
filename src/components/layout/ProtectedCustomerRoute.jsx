import { Navigate, useLocation } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { PageWrapper } from './PageWrapper';
import { useCustomerSession } from '../../hooks/useCustomerSession';

export function ProtectedCustomerRoute({ children }) {
  const location = useLocation();
  const { loading, isAuthenticated, hasCustomerAccess, role } = useCustomerSession();

  if (loading) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <div className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <h1 className="font-display text-4xl italic text-white">Checking your customer access</h1>
          </GlassCard>
        </div>
      </PageWrapper>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (!hasCustomerAccess || role !== 'customer') {
    return <Navigate to={`/unauthorized?required=customer&next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}
