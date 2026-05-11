/**
 * API: /api/tickets — Agent A (Claude Code)
 * Generated from ops-playbook.md — support ticket management
 * SLA-driven escalation workflow (< 4 hrs)
 */
import { NextResponse } from 'next/server';
import { createDemoTicket, getDemoTickets } from '@/lib/demo-store';
import type { SupportTicket } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickets = getDemoTickets({
    customerId: searchParams.get('customerId'),
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
  });

  return NextResponse.json({
    success: true,
    data: tickets,
    meta: { total: tickets.length },
  });
}

export async function POST(request: Request) {
  const body = await request.json() as Partial<SupportTicket>;

  if (!body.customerId || !body.subject || !body.description || !body.category) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_TICKET',
        message: 'customerId, subject, description, and category are required.',
      },
    }, { status: 400 });
  }

  const ticket = createDemoTicket(body);

  return NextResponse.json({
    success: true,
    data: {
      ticket,
      slaHours: body.priority === 'p0' ? 1 : body.priority === 'p1' ? 4 : 24,
    },
  }, { status: 201 });
}
