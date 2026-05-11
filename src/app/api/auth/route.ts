/**
 * API: /api/auth — Agent A (Claude Code)
 * Generated from 3_BiteBlast_FRD.md — UC-101 Customer OTP Login
 * Phone OTP authentication endpoints
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json() as { phone?: string; otp?: string; type?: 'send' | 'verify' };
  const phone = (body.phone || '').replace(/\D/g, '');

  if (phone.length !== 10) {
    return NextResponse.json({
      success: false,
      error: { code: 'INVALID_PHONE', message: 'Enter a valid 10-digit mobile number.' },
    }, { status: 400 });
  }

  if (body.type === 'verify') {
    if ((body.otp || '').replace(/\D/g, '').length !== 6) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'A 6-digit OTP is required for verification.' },
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        customerId: `demo_${phone}`,
        phone,
        sessionToken: `bb_session_${phone}`,
      },
      message: 'OTP verified.',
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      phone,
      maskedPhone: `+91 ${phone.slice(0, 2)}******${phone.slice(-2)}`,
      resendAfterSeconds: 60,
    },
    message: 'Demo OTP sent.',
  });
}
