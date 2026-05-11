/**
 * API: /api/wallet — Agent A (Claude Code)
 * Generated from payout-engine.md and financial-reconciliation.md
 * Wallet balance and transaction endpoints
 */
import { NextResponse } from 'next/server';
import { createWalletTransaction, getWalletSummary } from '@/lib/demo-store';
import type { WalletTransaction } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  return NextResponse.json({
    success: true,
    data: getWalletSummary(userId),
  });
}

export async function POST(request: Request) {
  const body = await request.json() as Partial<WalletTransaction>;

  if (!body.userId || !body.userType || !body.type || !body.amount || !body.reason) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_WALLET_REQUEST',
        message: 'userId, userType, type, amount, and reason are required.',
      },
    }, { status: 400 });
  }

  const transaction = createWalletTransaction({
    userId: body.userId,
    userType: body.userType,
    type: body.type,
    amount: body.amount,
    reason: body.reason,
    orderId: body.orderId,
  });

  return NextResponse.json({
    success: true,
    data: {
      transaction,
      wallet: getWalletSummary(body.userId),
    },
  });
}
