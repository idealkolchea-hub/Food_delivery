/**
 * admin Layout — Agent A (Claude Code)
 * Auto-generated from BUILD_CONSENSUS.md
 */
import { RoleLayout } from '@/components/layout';
import { ROLE_META, ALL_TABS, ALL_SCREENS } from '@/lib/vault';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout
      role="admin"
      meta={ROLE_META.admin}
      tabs={ALL_TABS.admin}
      screens={ALL_SCREENS.admin}
    >
      {children}
    </RoleLayout>
  );
}
