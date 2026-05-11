/**
 * C2 — Customer Login (Phone + OTP)
 * Route: /customer/auth_login
 * FRD: UC-101 Customer OTP Login
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { sendOtp } from '@/lib/auth';

export default function AuthLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = sendOtp(phone);
    if (!result.success) {
      setError(result.error || 'Failed to send OTP');
      setLoading(false);
      return;
    }

    router.push('/customer/auth_otp');
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: 'var(--sp-8)' }}>
      {/* Logo */}
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
          Sign in to BiteBlast
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
          Enter your mobile number to continue
        </p>
      </div>

      <Card style={{ padding: 'var(--sp-6)' }}>
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {/* Phone */}
          <div>
            <label style={{
              display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600,
              color: 'var(--text-subtle)', letterSpacing: '0.05em',
              textTransform: 'uppercase', marginBottom: 'var(--sp-2)',
            }}>
              Mobile Number
            </label>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'stretch' }}>
              <div style={{
                padding: '10px 14px', background: 'var(--bg-overlay)',
                border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                fontSize: 'var(--text-base)', color: 'var(--text-subtle)',
                fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center',
              }}>
                🇮🇳 +91
              </div>
              <input
                type="tel" maxLength={10} placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                style={{
                  flex: 1, background: 'var(--bg-surface)',
                  border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-md)', padding: '10px 14px',
                  fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)',
                  color: 'var(--text)', outline: 'none',
                }}
                autoFocus
              />
            </div>
            {error && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', marginTop: 'var(--sp-2)' }}>{error}</p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" loading={loading} style={{ width: '100%' }}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            Demo: enter any 10 digits → any 6-digit OTP
          </p>
        </form>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 'var(--sp-5)' }}>
        <Link href="/customer/home_guest" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
          Continue as guest →
        </Link>
      </div>
    </div>
  );
}
