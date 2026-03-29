import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { ConstructionSite, ConstructionSiteInsert } from '@/types';

// GET - 获取所有工地
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let query = client
      .from('construction_sites')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as ConstructionSite[] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get construction sites' },
      { status: 500 }
    );
  }
}

// POST - 创建新工地
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: ConstructionSiteInsert = await request.json();
    
    const { data, error } = await client
      .from('construction_sites')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as ConstructionSite });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create construction site' },
      { status: 500 }
    );
  }
}
