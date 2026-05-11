/**
 * customer Layout — Agent A (Claude Code)
 * Auto-generated from BUILD_CONSENSUS.md
 */
import { RoleLayout } from '@/components/layout';
import { ROLE_META, ALL_TABS, ALL_SCREENS } from '@/lib/vault';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout
      role="customer"
      meta={ROLE_META.customer}
      tabs={ALL_TABS.customer}
      screens={ALL_SCREENS.customer}
    >
      {children}
    </RoleLayout>
  );
}
