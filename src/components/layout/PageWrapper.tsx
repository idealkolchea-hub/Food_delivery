/**
 * PageWrapper — Agent A (Claude Code)
 * Consistent page chrome for all scaffold pages.
 */
export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 'var(--space-2)' }}>
      {children}
    </div>
  );
}
