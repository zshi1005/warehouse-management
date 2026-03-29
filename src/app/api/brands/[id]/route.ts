import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { BrandInsert } from '@/types';

// GET - 获取单个品牌
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('brands')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: '获取品牌失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新品牌
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const body: BrandInsert = await request.json();
    
    const { data, error } = await client
      .from('brands')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: '更新品牌失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除品牌
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    // 检查是否有产品使用此品牌
    const { count } = await client
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', parseInt(id));
    
    if (count && count > 0) {
      return NextResponse.json(
        { error: '该品牌下有产品，无法删除' },
        { status: 400 }
      );
    }
    
    const { error } = await client
      .from('brands')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '删除品牌失败' },
      { status: 500 }
    );
  }
}
