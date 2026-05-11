/**
 * Auth Helpers — Agent A (Claude Code)
 * Dummy OTP auth: any 6-digit code is accepted.
 * Stores session in localStorage.
 */
'use client';

export interface AuthSession {
  phone: string;
  customerId: string;
  name?: string;
}

// ── Store ────────────────────────────────────────────────────────
const SESSION_KEY = 'biteblast_session';

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthSession; }
  catch { return null; }
}

export function setSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

// ── OTP Flow (Dummy) ─────────────────────────────────────────────
// Any 6-digit code is accepted. Stores phone in localStorage.

const OTP_PHONE_KEY = 'biteblast_otp_phone';
const OTP_TIMER_KEY = 'biteblast_otp_timer';

export function sendOtp(phone: string): { success: boolean; error?: string } {
  // Validate Indian phone number
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return { success: false, error: 'Enter a valid 10-digit mobile number' };
  }

  // Store phone for verify step
  if (typeof window !== 'undefined') {
    localStorage.setItem(OTP_PHONE_KEY, cleaned);
    // 60 second cooldown
    localStorage.setItem(OTP_TIMER_KEY, String(Date.now() + 60000));
  }

  // Dummy: always succeeds — "OTP sent to 9876543210"
  return { success: true };
}

export function verifyOtp(otp: string): { success: boolean; error?: string; session?: AuthSession } {
  if (otp.replace(/\D/g, '').length !== 6) {
    return { success: false, error: 'Enter a valid 6-digit OTP' };
  }

  const phone = typeof window !== 'undefined'
    ? localStorage.getItem(OTP_PHONE_KEY)
    : null;

  if (!phone) {
    return { success: false, error: 'Session expired. Please request a new OTP.' };
  }

  // Dummy: always succeeds
  const session: AuthSession = {
    phone,
    customerId: `demo_${phone}`,
    name: undefined,
  };

  setSession(session);

  if (typeof window !== 'undefined') {
    localStorage.removeItem(OTP_PHONE_KEY);
    localStorage.removeItem(OTP_TIMER_KEY);
  }

  return { success: true, session };
}

export function resendOtp(): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Not in browser' };

  const timer = localStorage.getItem(OTP_TIMER_KEY);
  if (timer && Date.now() < parseInt(timer)) {
    const remaining = Math.ceil((parseInt(timer) - Date.now()) / 1000);
    return { success: false, error: `Wait ${remaining}s before resending` };
  }

  const phone = localStorage.getItem(OTP_PHONE_KEY);
  if (!phone) return { success: false, error: 'Session expired. Please start over.' };

  localStorage.setItem(OTP_TIMER_KEY, String(Date.now() + 60000));
  return { success: true };
}
