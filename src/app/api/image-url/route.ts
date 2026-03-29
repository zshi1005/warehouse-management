import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - 获取图片访问 URL
export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: 'Image key is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';

    // 获取公开 URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(key);

    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    console.error('Get image URL failed:', error);
    return NextResponse.json({ error: 'Failed to get image URL' }, { status: 500 });
  }
}
