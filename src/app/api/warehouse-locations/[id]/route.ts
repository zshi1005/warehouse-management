import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { WarehouseLocation, WarehouseLocationInsert } from '@/types';

// GET - 获取单个仓库位置
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    const { data, error } = await client
      .from('warehouse_locations')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as WarehouseLocation });
  } catch (error) {
    return NextResponse.json(
      { error: '获取仓库位置失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新仓库位置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body: Partial<WarehouseLocationInsert> = await request.json();
    
    const { data, error } = await client
      .from('warehouse_locations')
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
    
    return NextResponse.json({ data: data as WarehouseLocation });
  } catch (error) {
    return NextResponse.json(
      { error: '更新仓库位置失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除仓库位置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    const { error } = await client
      .from('warehouse_locations')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '删除仓库位置失败' },
      { status: 500 }
    );
  }
}
