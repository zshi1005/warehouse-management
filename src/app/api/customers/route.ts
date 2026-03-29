import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Customer, CustomerInsert } from '@/types';

// GET - 获取所有客户
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let query = client
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,contact.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as Customer[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取客户列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新客户
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: CustomerInsert = await request.json();
    
    const { data, error } = await client
      .from('customers')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as Customer });
  } catch (error) {
    return NextResponse.json(
      { error: '创建客户失败' },
      { status: 500 }
    );
  }
}
