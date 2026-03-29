import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { S3Storage } from 'coze-coding-dev-sdk';
import type { Product, ProductInsert } from '@/types';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

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

// GET - 获取所有产品
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const categoryId = searchParams.get('category_id');
    const withStats = searchParams.get('with_stats');
    
    let query = client
      .from('products')
      .select(`
        *,
        product_categories (
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
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 为有图片的产品生成访问URL
    const productsWithUrls = await Promise.all(
      (data || []).map(async (product: any) => {
        let image_url = null;
        if (product.image_key) {
          try {
            image_url = await storage.generatePresignedUrl({
              key: product.image_key,
              expireTime: 86400 * 30,
            });
          } catch (e) {
            console.error('生成图片URL失败:', e);
          }
        }

        // 如果需要库存统计
        let stats = null;
        if (withStats === 'true') {
          stats = await getProductStats(client, product.id);
        }

        return {
          ...product,
          image_url,
          stats,
        };
      })
    );
    
    return NextResponse.json({ data: productsWithUrls as Product[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取产品列表失败' },
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
        )
      `)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 如果有图片，生成访问URL
    let image_url = null;
    if (data.image_key) {
      try {
        image_url = await storage.generatePresignedUrl({
          key: data.image_key,
          expireTime: 86400 * 30,
        });
      } catch (e) {
        console.error('生成图片URL失败:', e);
      }
    }
    
    return NextResponse.json({ data: { ...data, image_url } as Product });
  } catch (error) {
    return NextResponse.json(
      { error: '创建产品失败' },
      { status: 500 }
    );
  }
}
