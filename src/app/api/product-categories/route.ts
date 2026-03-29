import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { ProductCategory, ProductCategoryInsert } from '@/types';

// GET - 获取所有产品类别（支持层级结构）
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const parentId = searchParams.get('parent_id');
    const level = searchParams.get('level');
    
    let query = client
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (parentId !== null) {
      if (parentId === 'null') {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parseInt(parentId));
      }
    }
    
    if (level) {
      query = query.eq('level', parseInt(level));
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 获取每个类别的产品数量
    const categoriesWithCount = await Promise.all(
      (data || []).map(async (category) => {
        const { count } = await client
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);
        
        return {
          ...category,
          product_count: count || 0,
        };
      })
    );
    
    return NextResponse.json({ data: categoriesWithCount as ProductCategory[] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get product categories' },
      { status: 500 }
    );
  }
}

// POST - 创建新产品类别
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: ProductCategoryInsert = await request.json();
    
    // 自动计算 level
    if (body.parent_id) {
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
    } else {
      body.level = 1;
    }
    
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
      { error: 'Failed to create product category' },
      { status: 500 }
    );
  }
}
