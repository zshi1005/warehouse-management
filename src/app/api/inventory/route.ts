import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Inventory, InventoryInsert } from '@/types';

// GET - 获取库存列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('product_id');
    const status = searchParams.get('status');
    const serialNumber = searchParams.get('serial_number');
    const locationId = searchParams.get('location_id');
    
    let query = client
      .from('inventory')
      .select(`
        *,
        products (
          id,
          name,
          specification,
          model,
          unit
        ),
        warehouse_locations (
          id,
          name,
          code
        )
      `)
      .order('created_at', { ascending: false });
    
    if (productId) {
      query = query.eq('product_id', parseInt(productId));
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (serialNumber) {
      query = query.ilike('serial_number', `%${serialNumber}%`);
    }

    if (locationId) {
      query = query.eq('location_id', parseInt(locationId));
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as Inventory[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取库存列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建库存记录
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: InventoryInsert = await request.json();
    
    const { data, error } = await client
      .from('inventory')
      .insert(body)
      .select(`
        *,
        products (
          id,
          name,
          specification,
          model,
          unit
        ),
        warehouse_locations (
          id,
          name,
          code
        )
      `)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as Inventory });
  } catch (error) {
    return NextResponse.json(
      { error: '创建库存记录失败' },
      { status: 500 }
    );
  }
}
