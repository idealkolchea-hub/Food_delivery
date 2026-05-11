/**
 * C3 — OTP Verification
 * Route: /customer/auth_otp
 * FRD: UC-101 Customer OTP Login
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { verifyOtp, resendOtp, isLoggedIn } from '@/lib/auth';

export default function AuthOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [phone, setPhone] = useState('------');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Load phone from localStorage (browser-only)
  useEffect(() => {
    setPhone(localStorage.getItem('biteblast_otp_phone') || '------');
    if (isLoggedIn()) router.replace('/customer/home_logged');
  }, [router]);

  const handleRef = useCallback((i: number) => (el: HTMLInputElement | null) => {
    inputs.current[i] = el;
  }, []);

  // Countdown timer
  useEffect(() => {
    const raw = localStorage.getItem('biteblast_otp_timer');
    if (!raw) return;
    const end = parseInt(raw);
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) clearInterval(t);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digits;
    setOtp(newOtp);

    if (digits && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length !== 6) return;
    const newOtp = pasted.split('');
    setOtp(newOtp);
    inputs.current[5]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Enter all 6 digits');
      return;
    }

    setLoading(true);
    // Small delay to feel real
    await new Promise(r => setTimeout(r, 800));

    const result = verifyOtp(code);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      return;
    }

    router.push('/customer/home_logged');
  };

  const handleResend = () => {
    setResendStatus('');
    const result = resendOtp();
    if (!result.success) {
      setResendStatus(result.error || 'Failed to resend');
      return;
    }
    setResendStatus('OTP resent successfully');
    const end = parseInt(localStorage.getItem('biteblast_otp_timer') || '0');
    setCountdown(Math.ceil((end - Date.now()) / 1000));
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: 'var(--sp-8)' }}>
      {/* Back */}
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <a href="/customer/auth_login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)',
          fontSize: 'var(--text-sm)', color: 'var(--text-subtle)',
          textDecoration: 'none',
        }}>
          ← Change number
        </a>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
        <div style={{
          width: 56, height: 56, margin: '0 auto var(--sp-4)',
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
        }}>
          🔥
        </div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
          Enter the code
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
          Sent to <strong style={{ color: 'var(--text)' }}>
            +91 {phone}
          </strong>
        </p>
      </div>

      <form onSubmit={handleVerify}>
        {/* OTP inputs */}
        <div style={{
          display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center',
          marginBottom: 'var(--sp-4)',
        }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={handleRef(i)}
              type="text" inputMode="numeric" maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              autoFocus={i === 0}
              style={{
                width: 48, height: 56,
                background: 'var(--bg-surface)',
                border: `1px solid ${error ? 'var(--red)' : digit ? 'var(--amber)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                fontSize: 'var(--text-xl)', fontFamily: 'var(--font-mono)',
                fontWeight: 700, color: 'var(--text)',
                textAlign: 'center', outline: 'none',
                transition: 'border-color var(--t-fast)',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', textAlign: 'center', marginBottom: 'var(--sp-3)' }}>
            {error}
          </p>
        )}

        {/* Verify button */}
        <button
          type="submit"
          disabled={loading || otp.join('').length < 6}
          style={{
            width: '100%', padding: '12px',
            background: otp.join('').length === 6 ? 'var(--amber)' : 'var(--bg-overlay)',
            color: otp.join('').length === 6 ? '#0D1117' : 'var(--text-subtle)',
            border: 'none', borderRadius: 'var(--r-md)',
            fontSize: 'var(--text-sm)', fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            cursor: otp.join('').length === 6 ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)',
            transition: 'background var(--t-fast), color var(--t-fast)',
          }}
        >
          {loading ? (
            <>
              <span style={{
                display: 'inline-block', width: 14, height: 14,
                border: '2px solid currentColor', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.6s linear infinite',
              }} />
              Verifying...
            </>
          ) : 'Verify & Continue'}
        </button>
      </form>

      {/* Resend */}
      <div style={{ textAlign: 'center', marginTop: 'var(--sp-5)' }}>
        {countdown > 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-faint)' }}>
            Resend in <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
              {countdown}s
            </span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            style={{
              background: 'none', border: 'none',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: 'var(--amber)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Resend OTP
          </button>
        )}
        {resendStatus && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--amber)', marginTop: 'var(--sp-2)' }}>
            {resendStatus}
          </p>
        )}
      </div>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', textAlign: 'center', marginTop: 'var(--sp-6)', fontFamily: 'var(--font-mono)' }}>
        Demo: enter any 6 digits → login succeeds
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}