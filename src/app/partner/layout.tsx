/**
 * partner Layout — Agent A (Claude Code)
 * Auto-generated from BUILD_CONSENSUS.md
 */
import { RoleLayout } from '@/components/layout';
import { ROLE_META, ALL_TABS, ALL_SCREENS } from '@/lib/vault';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout
      role="partner"
      meta={ROLE_META.partner}
      tabs={ALL_TABS.partner}
      screens={ALL_SCREENS.partner}
    >
      {children}
    </RoleLayout>
  );
}
