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
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json({ data: data as ProductCategory });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get category' },
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
    const categoryId = parseInt(id);
    
    // 如果修改了 parent_id，需要重新计算 level
    if (body.parent_id !== undefined) {
      if (body.parent_id === null) {
        body.level = 1;
      } else {
        // 检查是否形成循环
        if (body.parent_id === categoryId) {
          return NextResponse.json(
            { error: 'Cannot set self as parent' },
            { status: 400 }
          );
        }
        
        // 获取父类别的 level
        const { data: parent } = await client
          .from('product_categories')
          .select('level')
          .eq('id', body.parent_id)
          .single();
        
        if (parent) {
          const newLevel = (parent.level || 1) + 1;
          body.level = newLevel;
          
          // 验证不能超过3级
          if (newLevel > 3) {
            return NextResponse.json(
              { error: 'Maximum 3 levels of categories allowed' },
              { status: 400 }
            );
          }
        }
      }
    }
    
    const { data, error } = await client
      .from('product_categories')
      .update(body)
      .eq('id', categoryId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as ProductCategory });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update category' },
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
    const categoryId = parseInt(id);
    
    // 检查是否有子类别
    const { data: children } = await client
      .from('product_categories')
      .select('id')
      .eq('parent_id', categoryId)
      .limit(1);
    
    if (children && children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with sub-categories' },
        { status: 400 }
      );
    }
    
    // 检查是否有产品使用该类别
    const { data: products } = await client
      .from('products')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);
    
    if (products && products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products' },
        { status: 400 }
      );
    }
    
    const { error } = await client
      .from('product_categories')
      .delete()
      .eq('id', categoryId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
