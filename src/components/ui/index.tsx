/**
 * UI Primitives — Agent A (Claude Code)
 * Shared design system components for the BiteBlast app.
 */
'use client';

// ── Button ───────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary', size = 'md', loading = false,
  children, disabled, style: extraStyle, ...props
}: ButtonProps) {
  const variants = {
    primary: {
      background: 'var(--amber)',
      color: '#0D1117',
      border: '1px solid var(--amber)',
    },
    secondary: {
      background: 'var(--bg-overlay)',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-subtle)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'var(--red-bg)',
      color: 'var(--red)',
      border: '1px solid rgba(248,81,73,0.3)',
    },
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: 'var(--text-xs)', borderRadius: 'var(--r-sm)' },
    md: { padding: '10px 20px', fontSize: 'var(--text-sm)', borderRadius: 'var(--r-md)' },
    lg: { padding: '14px 28px', fontSize: 'var(--text-base)', borderRadius: 'var(--r-md)' },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        ...variants[variant],
        ...sizes[size],
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'var(--t-base)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--sp-2)',
        letterSpacing: '0.01em',
        ...extraStyle,
      }}
    >
      {loading && (
        <span style={{
          display: 'inline-block', width: 12, height: 12,
          border: '2px solid currentColor', borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
      )}
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

// ── Input ───────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, style: extraStyle, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      {label && (
        <label style={{
          fontSize: 'var(--text-xs)', fontWeight: 600,
          color: 'var(--text-subtle)', letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--r-md)',
          padding: '10px 14px',
          fontSize: 'var(--text-base)',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text)',
          outline: 'none',
          transition: 'border-color var(--t-fast)',
          width: '100%',
          ...extraStyle,
        }}
      />
      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--red)' }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{hint}</span>
      )}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }

export function Card({ children, style: extraStyle }: CardProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      ...extraStyle,
    }}>
      {children}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; color?: string; style?: React.CSSProperties; }

export function Badge({ children, color = 'var(--amber)', style: extraStyle }: BadgeProps) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color,
      background: color + '18',
      padding: '2px 8px',
      borderRadius: 'var(--r-sm)',
      border: `1px solid ${color}30`,
      fontWeight: 500,
      ...extraStyle,
    }}>
      {children}
    </span>
  );
}

// ── Rating Stars ──────────────────────────────────────────────────
interface RatingProps { value: number; max?: number; size?: number; }

export function RatingStars({ value, max = 5, size = 16 }: RatingProps) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <span key={i} style={{
            fontSize: size,
            color: filled ? 'var(--amber)' : 'var(--border)',
            lineHeight: 1,
          }}>
            ★
          </span>
        );
      })}
    </span>
  );
}

// ── Divider ─────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) {
    return <div style={{ height: '1px', background: 'var(--border)', margin: 'var(--sp-4) 0' }} />;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', margin: 'var(--sp-4) 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

// ── Price ────────────────────────────────────────────────────────
export function Price({ amount, size = 'md' }: { amount: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'var(--text-sm)', md: 'var(--text-base)', lg: 'var(--text-lg)' };
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: sizes[size],
      fontWeight: 600,
      color: 'var(--text)',
    }}>
      ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
    </span>
  );
}

// ── Section Header ────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-4)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: subtitle ? '2px' : 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
