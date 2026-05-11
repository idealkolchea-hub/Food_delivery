import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { PageWrapper } from './PageWrapper';
import { useAgentSession } from '../../hooks/useAgentSession';

export function ProtectedAgentRoute({ children = null }) {
  const location = useLocation();
  const { loading, hasAgentAccess } = useAgentSession();

  if (loading) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <div className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <h1 className="font-display text-4xl italic text-white">Preparing agent access</h1>
          </GlassCard>
        </div>
      </PageWrapper>
    );
  }

  if (!hasAgentAccess) {
    return <Navigate to={`/agent/auth?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children || <Outlet />;
}
