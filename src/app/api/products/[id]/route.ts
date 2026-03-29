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

// GET - 获取单个产品
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('products')
      .select(`
        *,
        product_categories (
          id,
          name,
          description
        )
      `)
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 });
    }

    // 生成图片URL
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

    // 获取库存统计
    const stats = await getProductStats(client, parseInt(id));
    
    return NextResponse.json({ data: { ...data, image_url, stats } as Product });
  } catch (error) {
    return NextResponse.json(
      { error: '获取产品信息失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新产品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const body: Partial<ProductInsert> = await request.json();
    
    const { data, error } = await client
      .from('products')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id))
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

    // 生成图片URL
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
      { error: '更新产品失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除产品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '删除产品失败' },
      { status: 500 }
    );
  }
}
