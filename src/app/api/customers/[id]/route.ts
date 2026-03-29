import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Customer, CustomerInsert } from '@/types';

// GET - 获取单个客户
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ data: data as Customer });
  } catch (error) {
    return NextResponse.json(
      { error: '获取客户信息失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新客户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const body: Partial<CustomerInsert> = await request.json();
    
    const { data, error } = await client
      .from('customers')
      .update(body)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as Customer });
  } catch (error) {
    return NextResponse.json(
      { error: '更新客户失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除客户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { error } = await client
      .from('customers')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '删除客户失败' },
      { status: 500 }
    );
  }
}
