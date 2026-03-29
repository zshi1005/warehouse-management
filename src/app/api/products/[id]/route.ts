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
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 生成图片URL
    let image_url = null;
    if (data.image_key) {
      image_url = getImagePublicUrl(client, data.image_key);
    }

    // 获取库存统计
    const stats = await getProductStats(client, parseInt(id));
    
    return NextResponse.json({ data: { ...data, image_url, stats } as Product });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get product' },
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
      image_url = getImagePublicUrl(client, data.image_key);
    }
    
    return NextResponse.json({ data: { ...data, image_url } as Product });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
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
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
