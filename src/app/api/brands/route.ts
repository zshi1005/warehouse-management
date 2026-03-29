import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Brand, BrandInsert } from '@/types';

// GET - 获取品牌列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let query = client
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 获取每个品牌的产品数量
    const brandsWithCount = await Promise.all(
      (data || []).map(async (brand) => {
        const { count } = await client
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brand.id);
        
        return {
          ...brand,
          product_count: count || 0,
        };
      })
    );
    
    return NextResponse.json({ data: brandsWithCount as Brand[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取品牌列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建品牌
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: BrandInsert = await request.json();
    
    const { data, error } = await client
      .from('brands')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as Brand });
  } catch (error) {
    return NextResponse.json(
      { error: '创建品牌失败' },
      { status: 500 }
    );
  }
}
