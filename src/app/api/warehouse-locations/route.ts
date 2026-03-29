import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { WarehouseLocation, WarehouseLocationInsert } from '@/types';

// GET - 获取所有仓库位置
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let query = client
      .from('warehouse_locations')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as WarehouseLocation[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取仓库位置列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新仓库位置
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: WarehouseLocationInsert = await request.json();
    
    const { data, error } = await client
      .from('warehouse_locations')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as WarehouseLocation });
  } catch (error) {
    return NextResponse.json(
      { error: '创建仓库位置失败' },
      { status: 500 }
    );
  }
}
