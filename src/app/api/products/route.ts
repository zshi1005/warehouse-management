import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Product, ProductInsert } from '@/types';

// 获取产品的库存统计
async function getProductStats(client: any, productId: number) {
  const { data: inventory } = await client
    .from('inventory')
    .select('status')
    .eq('product_id', productId);

  const stats = {
    total: inventory?.length || 0,
    in_stock: inventory?.filter((i: any) => i.status === 'in_stock').length || 0,
    out_of_stock: inventory?.filter((i: any) => i.status === 'out_of_stock').length || 0,
    transferred: inventory?.filter((i: any) => i.status === 'transferred').length || 0,
  };

  return stats;
}

// 获取图片公开 URL
function getImagePublicUrl(supabase: any, imageKey: string): string {
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';
  const { data } = supabase.storage.from(bucketName).getPublicUrl(imageKey);
  return data.publicUrl;
}

// GET - 获取所有产品
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const categoryId = searchParams.get('category_id');
    const brandId = searchParams.get('brand_id');
    const withStats = searchParams.get('with_stats');
    
    let query = client
      .from('products')
      .select(`
        *,
        product_categories (
          id,
          name,
          description
        ),
        brands (
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false });
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,specification.ilike.%${search}%,model.ilike.%${search}%`);
    }
    
    if (categoryId) {
      query = query.eq('category_id', parseInt(categoryId));
    }

    if (brandId) {
      query = query.eq('brand_id', parseInt(brandId));
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 为有图片的产品生成访问URL
    const productsWithUrls = (data || []).map((product: any) => {
      let image_url = null;
      if (product.image_key) {
        image_url = getImagePublicUrl(client, product.image_key);
      }

      return {
        ...product,
        image_url,
      };
    });

    // 如果需要库存统计
    let finalData = productsWithUrls;
    if (withStats === 'true') {
      finalData = await Promise.all(
        productsWithUrls.map(async (product: any) => {
          const stats = await getProductStats(client, product.id);
          return { ...product, stats };
        })
      );
    }
    
    return NextResponse.json({ data: finalData as Product[] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get products' },
      { status: 500 }
    );
  }
}

// POST - 创建新产品
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: ProductInsert = await request.json();
    
    const { data, error } = await client
      .from('products')
      .insert(body)
      .select(`
        *,
        product_categories (
          id,
          name,
          description
        ),
        brands (
          id,
          name,
          description
        )
      `)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 如果有图片，生成访问URL
    let image_url = null;
    if (data.image_key) {
      image_url = getImagePublicUrl(client, data.image_key);
    }
    
    return NextResponse.json({ data: { ...data, image_url } as Product });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
