/**
 * API: /api/admin/refund — Agent A (Claude Code)
 * Generated from ops-playbook.md — admin refund workflow
 * Provisional wallet credit → EventLog review → finalize/deduct
 */
import { NextResponse } from 'next/server';
import { createDemoRefund } from '@/lib/demo-store';

export async function POST(request: Request) {
  const body = await request.json() as {
    orderId?: string;
    amount?: number;
    adminRole?: string;
    adminId?: string;
  };

  if (!body.orderId || !body.adminRole) {
    return NextResponse.json({
      success: false,
      error: { code: 'INVALID_REFUND_REQUEST', message: 'orderId and adminRole are required.' },
    }, { status: 400 });
  }

  if (!['ops_admin', 'super_admin'].includes(body.adminRole)) {
    return NextResponse.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only ops_admin or super_admin can issue refunds.' },
    }, { status: 403 });
  }

  const refund = createDemoRefund({
    orderId: body.orderId,
    amount: body.amount,
    adminId: body.adminId,
  });

  if (!refund) {
    return NextResponse.json({
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: 'No matching order was found.' },
    }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: refund });
}
