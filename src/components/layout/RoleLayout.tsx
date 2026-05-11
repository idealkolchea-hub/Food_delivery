/**
 * RoleLayout — Agent A (Claude Code)
 * Claude-inspired: dark, amber accent, IBM Plex fonts.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getActiveTabKey, getTabPath } from '@/lib/navigation';
import { Role, RoleMeta, RoleTab, RoleScreen } from '@/lib/vault';

interface RoleLayoutProps {
  role: Role;
  meta: RoleMeta;
  tabs: RoleTab[];
  screens?: Record<string, RoleScreen>;
  children: React.ReactNode;
}

const ROLE_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  customer:  { color: '#F85149', bg: 'rgba(248,81,73,0.1)',   label: 'Customer' },
  partner:   { color: '#F0883E', bg: 'rgba(240,136,62,0.1)',  label: 'Partner' },
  agent:     { color: '#3FB950', bg: 'rgba(63,185,80,0.1)',   label: 'Agent' },
  admin:     { color: '#A371F7', bg: 'rgba(163,113,247,0.1)', label: 'Admin' },
};

export default function RoleLayout({ role, meta, tabs, screens, children }: RoleLayoutProps) {
  const pathname = usePathname();
  const rc = ROLE_COLORS[role] || { color: '#58A6FF', bg: 'rgba(88,166,255,0.1)', label: role };
  const activeTabKey = getActiveTabKey(role, pathname, screens);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Top Bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(13,17,23,0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Main bar */}
        <div style={{
          maxWidth: 740, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--sp-5)',
          height: 52,
        }}>
          {/* Left: back + breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <Link href="/" style={{
              color: 'var(--text-faint)', fontSize: 'var(--text-sm)',
              textDecoration: 'none', fontFamily: 'var(--font-mono)',
              transition: 'color var(--t-fast)',
            }}>
              ← home
            </Link>
            <span style={{ color: 'var(--border)', fontSize: 'var(--text-sm)' }}>/</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
              color: 'var(--text-subtle)', letterSpacing: '0.05em',
            }}>
              {meta.label.toUpperCase()}
            </span>
          </div>

          {/* Right: brand */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
            padding: '3px var(--sp-3)',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
          }}>
            <span>🔥</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
              color: 'var(--text-subtle)',
            }}>
              {meta.subtitle}
            </span>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <nav style={{
          maxWidth: 740, margin: '0 auto',
          display: 'flex',
          borderTop: '1px solid var(--border-subtle)',
          overflowX: 'auto',
        }}>
          {tabs.map((tab) => {
            const isActive = activeTabKey === tab.key;
            return (
              <Link
                key={tab.key}
                href={getTabPath(role, tab, screens)}
                style={{
                  padding: 'var(--sp-2) var(--sp-4)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? rc.color : 'var(--text-faint)',
                  textDecoration: 'none',
                  borderBottom: isActive
                    ? `2px solid ${rc.color}`
                    : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'color var(--t-fast)',
                  letterSpacing: '0.02em',
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ── Content ── */}
      <main style={{ maxWidth: 740, margin: '0 auto', padding: 'var(--sp-6) var(--sp-5)' }}>
        {children}
      </main>
    </div>
  );
}
