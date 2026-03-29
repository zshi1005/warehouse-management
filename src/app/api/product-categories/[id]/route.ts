import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { ProductCategory, ProductCategoryInsert } from '@/types';

// GET - 获取单个产品类别
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('product_categories')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: '产品类别不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ data: data as ProductCategory });
  } catch (error) {
    return NextResponse.json(
      { error: '获取产品类别信息失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新产品类别
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const body: Partial<ProductCategoryInsert> = await request.json();
    
    const { data, error } = await client
      .from('product_categories')
      .update(body)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as ProductCategory });
  } catch (error) {
    return NextResponse.json(
      { error: '更新产品类别失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除产品类别
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    // 检查是否有产品使用该类别
    const { data: products, error: checkError } = await client
      .from('products')
      .select('id')
      .eq('category_id', parseInt(id))
      .limit(1);
    
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (products && products.length > 0) {
      return NextResponse.json(
        { error: '该类别下有产品，无法删除' },
        { status: 400 }
      );
    }
    
    const { error } = await client
      .from('product_categories')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '删除产品类别失败' },
      { status: 500 }
    );
  }
}
