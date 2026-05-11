/**
 * agent Layout — Agent A (Claude Code)
 * Auto-generated from BUILD_CONSENSUS.md
 */
import { RoleLayout } from '@/components/layout';
import { ROLE_META, ALL_TABS, ALL_SCREENS } from '@/lib/vault';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout
      role="agent"
      meta={ROLE_META.agent}
      tabs={ALL_TABS.agent}
      screens={ALL_SCREENS.agent}
    >
      {children}
    </RoleLayout>
  );
}
