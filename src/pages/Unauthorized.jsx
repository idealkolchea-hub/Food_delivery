import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';

function roleLabel(requiredRole) {
  if (requiredRole === 'vendor') return 'vendor';
  if (requiredRole === 'delivery_partner') return 'delivery partner';
  if (requiredRole === 'admin') return 'admin';
  return 'customer';
}

export default function Unauthorized() {
  const [searchParams] = useSearchParams();
  const requiredRole = searchParams.get('required') || 'customer';
  const nextPath = searchParams.get('next') || '/';

  return (
    <PageWrapper className="mx-auto max-w-[980px]">
      <motion.section variants={childVariants} className="grid place-items-center py-24">
        <GlassCard interactive={false} className="max-w-2xl p-10 text-center">
          <div className="mb-5 flex flex-wrap justify-center gap-3">
            <Badge>Unauthorized</Badge>
            <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{roleLabel(requiredRole)} access required</Badge>
          </div>
          <h1 className="font-display text-5xl italic text-white">This route belongs to a different role</h1>
          <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
            Your current account does not have the role required for this part of BiteBlast. Sign in with the correct account or head back to a route that matches your access level.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={`/login?next=${encodeURIComponent(nextPath)}`}><Button>Open sign in</Button></Link>
            <Link to="/"><Button variant="secondary">Go home</Button></Link>
          </div>
        </GlassCard>
      </motion.section>
    </PageWrapper>
  );
}
