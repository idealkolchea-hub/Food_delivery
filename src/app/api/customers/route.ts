/**
 * API: /api/customers — Agent A (Claude Code)
 * Generated from 3_BiteBlast_FRD.md use cases
 * CRUD endpoints for Customer entity
 */
import { NextResponse } from 'next/server';
import { createDemoCustomer, getDemoCustomers } from '@/lib/demo-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('id');
  const phone = searchParams.get('phone');

  const customers = getDemoCustomers().filter((customer) => {
    if (customerId && customer.id !== customerId) return false;
    if (phone && customer.phone !== phone.replace(/\D/g, '')) return false;
    return true;
  });

  return NextResponse.json({
    success: true,
    data: customerId || phone ? customers[0] || null : customers,
    meta: { total: customers.length },
  });
}

export async function POST(request: Request) {
  const body = await request.json() as { phone?: string; name?: string; email?: string };
  const phone = (body.phone || '').replace(/\D/g, '');

  if (phone.length !== 10) {
    return NextResponse.json({
      success: false,
      error: { code: 'INVALID_PHONE', message: 'A valid 10-digit mobile number is required.' },
    }, { status: 400 });
  }

  const customer = createDemoCustomer({
    phone,
    name: body.name,
    email: body.email,
  });

  return NextResponse.json({ success: true, data: customer }, { status: 201 });
}
