import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Supplier, SupplierInsert } from '@/types';

// GET - 获取单个供应商
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('suppliers')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: '供应商不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ data: data as Supplier });
  } catch (error) {
    return NextResponse.json(
      { error: '获取供应商信息失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新供应商
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const body: Partial<SupplierInsert> = await request.json();
    
    const { data, error } = await client
      .from('suppliers')
      .update(body)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as Supplier });
  } catch (error) {
    return NextResponse.json(
      { error: '更新供应商失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除供应商
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { error } = await client
      .from('suppliers')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '删除供应商失败' },
      { status: 500 }
    );
  }
}
