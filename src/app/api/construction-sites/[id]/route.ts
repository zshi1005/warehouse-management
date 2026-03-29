import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { ConstructionSite, ConstructionSiteInsert } from '@/types';

// GET - 获取单个工地
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('construction_sites')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Construction site not found' }, { status: 404 });
    }
    
    return NextResponse.json({ data: data as ConstructionSite });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get construction site' },
      { status: 500 }
    );
  }
}

// PUT - 更新工地
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const body: Partial<ConstructionSiteInsert> = await request.json();
    
    const { data, error } = await client
      .from('construction_sites')
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
    
    return NextResponse.json({ data: data as ConstructionSite });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update construction site' },
      { status: 500 }
    );
  }
}

// DELETE - 删除工地
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    // 检查是否有关联的转移记录
    const { data: transfers } = await client
      .from('stock_transfers')
      .select('id')
      .or(`from_site_id.eq.${id},to_site_id.eq.${id}`)
      .limit(1);
    
    if (transfers && transfers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete construction site with transfer records' },
        { status: 400 }
      );
    }
    
    const { error } = await client
      .from('construction_sites')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete construction site' },
      { status: 500 }
    );
  }
}
