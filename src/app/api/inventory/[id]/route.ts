import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Inventory, InventoryInsert } from '@/types';

// GET - 获取单个库存记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('inventory')
      .select(`
        *,
        products (
          id,
          name,
          specification,
          model,
          unit
        )
      `)
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: '库存记录不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ data: data as Inventory });
  } catch (error) {
    return NextResponse.json(
      { error: '获取库存信息失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新库存记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const body: Partial<InventoryInsert> = await request.json();
    
    const { data, error } = await client
      .from('inventory')
      .update(body)
      .eq('id', parseInt(id))
      .select(`
        *,
        products (
          id,
          name,
          specification,
          model,
          unit
        )
      `)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as Inventory });
  } catch (error) {
    return NextResponse.json(
      { error: '更新库存记录失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除库存记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { error } = await client
      .from('inventory')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '删除库存记录失败' },
      { status: 500 }
    );
  }
}
