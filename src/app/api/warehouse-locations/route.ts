import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { WarehouseLocation, WarehouseLocationInsert } from '@/types';

// 生成仓库位置编号
async function generateLocationCode(client: any): Promise<string> {
  const { data } = await client
    .from('warehouse_locations')
    .select('code')
    .order('code', { ascending: false })
    .limit(1);
  
  if (data && data.length > 0 && data[0].code) {
    // 提取数字部分并递增
    const lastCode = data[0].code;
    const match = lastCode.match(/\d+/);
    if (match) {
      const nextNum = parseInt(match[0]) + 1;
      return `WH${nextNum.toString().padStart(4, '0')}`;
    }
  }
  
  return 'WH0001';
}

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
    
    // 获取每个位置的产品数量
    const locationsWithCount = await Promise.all(
      (data || []).map(async (location) => {
        const { count } = await client
          .from('inventory')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', location.id)
          .eq('status', 'in_stock');
        
        return {
          ...location,
          product_count: count || 0,
        };
      })
    );
    
    return NextResponse.json({ data: locationsWithCount as WarehouseLocation[] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get warehouse locations' },
      { status: 500 }
    );
  }
}

// POST - 创建新仓库位置
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: WarehouseLocationInsert = await request.json();
    
    // 如果没有提供code，自动生成
    if (!body.code) {
      body.code = await generateLocationCode(client);
    }
    
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
      { error: 'Failed to create warehouse location' },
      { status: 500 }
    );
  }
}
