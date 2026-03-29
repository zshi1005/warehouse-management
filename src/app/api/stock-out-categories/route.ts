import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { StockOutCategory, StockOutCategoryInsert } from '@/types';

// GET - 获取所有出库类别
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let query = client
      .from('stock_out_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as StockOutCategory[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取出库类别列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新出库类别
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: StockOutCategoryInsert = await request.json();
    
    const { data, error } = await client
      .from('stock_out_categories')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as StockOutCategory });
  } catch (error) {
    return NextResponse.json(
      { error: '创建出库类别失败' },
      { status: 500 }
    );
  }
}
