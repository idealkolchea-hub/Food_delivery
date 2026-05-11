/**
 * API: /api/restaurants — Agent A (Claude Code)
 * Generated from 3_BiteBlast_FRD.md use cases
 * CRUD endpoints for Restaurant entity
 */
import { NextResponse } from 'next/server';
import type { Address } from '@/types';
import { createDemoRestaurant, getDemoRestaurants } from '@/lib/demo-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('id');
  const area = searchParams.get('area');
  const active = searchParams.get('active');

  const restaurants = getDemoRestaurants().filter((restaurant) => {
    if (restaurantId && restaurant.id !== restaurantId) return false;
    if (area && restaurant.address.area.toLowerCase() !== area.toLowerCase()) return false;
    if (active === 'true' && !restaurant.is_active) return false;
    return true;
  });

  return NextResponse.json({
    success: true,
    data: restaurantId ? restaurants[0] || null : restaurants,
    meta: { total: restaurants.length },
  });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    name?: string;
    ownerName?: string;
    phone?: string;
    email?: string;
    fssaiLicense?: string;
    address?: Address;
  };

  if (!body.name || !body.ownerName || !body.phone || !body.fssaiLicense) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'name, ownerName, phone, and fssaiLicense are required.',
      },
    }, { status: 400 });
  }

  const restaurant = createDemoRestaurant({
    name: body.name,
    ownerName: body.ownerName,
    phone: body.phone.replace(/\D/g, ''),
    email: body.email,
    fssaiLicense: body.fssaiLicense,
    address: body.address,
  });

  return NextResponse.json({ success: true, data: restaurant }, { status: 201 });
}
