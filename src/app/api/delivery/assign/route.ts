/**
 * API: /api/delivery/assign — Agent A (Claude Code)
 * Generated from 3_BiteBlast_FRD.md use cases
 * Agent delivery assignment and status update endpoints
 */
import { NextResponse } from 'next/server';
import { assignDemoDelivery } from '@/lib/demo-store';

export async function POST(request: Request) {
  const body = await request.json() as { orderId?: string };

  if (!body.orderId) {
    return NextResponse.json({
      success: false,
      error: { code: 'MISSING_ORDER_ID', message: 'orderId is required.' },
    }, { status: 400 });
  }

  const assignment = assignDemoDelivery(body.orderId);

  if (!assignment) {
    return NextResponse.json({
      success: false,
      error: { code: 'ASSIGNMENT_FAILED', message: 'No eligible order or agent was found.' },
    }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: assignment });
}
