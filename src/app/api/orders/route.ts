/**
 * API: /api/orders — Agent A (Claude Code)
 * Generated from 3_BiteBlast_FRD.md use cases
 * Order management endpoints from order-management-pipeline.md
 */
import { NextResponse } from 'next/server';
import type { Address, OrderItem, PaymentMethod } from '@/types';
import { assignDemoDelivery, createDemoOrder, getDemoOrders } from '@/lib/demo-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = getDemoOrders({
    id: searchParams.get('id'),
    customerId: searchParams.get('customerId'),
    restaurantId: searchParams.get('restaurantId'),
    agentId: searchParams.get('agentId'),
    status: searchParams.get('status'),
  });

  return NextResponse.json({
    success: true,
    data,
    meta: { total: data.length },
  });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    customerId?: string;
    restaurantId?: string;
    items?: Array<Partial<OrderItem>>;
    deliveryAddress?: Address;
    paymentMethod?: PaymentMethod;
  };

  if (!body.customerId || !body.restaurantId || !body.items?.length || !body.deliveryAddress) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_ORDER',
        message: 'customerId, restaurantId, at least one item, and deliveryAddress are required.',
      },
    }, { status: 400 });
  }

  const order = createDemoOrder({
    customerId: body.customerId,
    restaurantId: body.restaurantId,
    items: body.items,
    deliveryAddress: body.deliveryAddress,
    paymentMethod: body.paymentMethod,
  });
  const assignment = assignDemoDelivery(order.id);

  return NextResponse.json({
    success: true,
    data: {
      order,
      delivery: assignment,
    },
  }, { status: 201 });
}
