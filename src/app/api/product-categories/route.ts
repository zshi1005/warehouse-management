import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { ProductCategory, ProductCategoryInsert } from '@/types';

// GET - 获取所有产品类别
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let query = client
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as ProductCategory[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取产品类别列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新产品类别
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: ProductCategoryInsert = await request.json();
    
    const { data, error } = await client
      .from('product_categories')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as ProductCategory });
  } catch (error) {
    return NextResponse.json(
      { error: '创建产品类别失败' },
      { status: 500 }
    );
  }
}
