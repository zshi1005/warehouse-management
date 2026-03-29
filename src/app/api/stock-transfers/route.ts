import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { StockTransfer, StockTransferInsert } from '@/types';

// 生成转移单号
function generateTransferNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ZY${timestamp}${random}`;
}

// GET - 获取转移单列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const transferNo = searchParams.get('transfer_no');
    
    let query = client
      .from('stock_transfers')
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
      .order('created_at', { ascending: false });
    
    if (transferNo) {
      query = query.ilike('transfer_no', `%${transferNo}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as StockTransfer[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取转移单列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建转移单
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: Omit<StockTransferInsert, 'transfer_no'> = await request.json();
    
    // 验证库存记录是否存在
    const { data: inventoryItem, error: checkError } = await client
      .from('inventory')
      .select('id, serial_number, status, location')
      .eq('id', body.inventory_id)
      .maybeSingle();
    
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (!inventoryItem) {
      return NextResponse.json(
        { error: '库存记录不存在' },
        { status: 404 }
      );
    }
    
    if (inventoryItem.status !== 'in_stock') {
      return NextResponse.json(
        { error: '该库存不在库，无法转移' },
        { status: 400 }
      );
    }
    
    const transferNo = generateTransferNo();
    
    // 创建转移单
    const { data: transfer, error: transferError } = await client
      .from('stock_transfers')
      .insert({
        ...body,
        transfer_no: transferNo,
        from_location: inventoryItem.location,
      })
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
    
    if (transferError) {
      return NextResponse.json({ error: transferError.message }, { status: 500 });
    }
    
    // 更新库存位置和状态
    const { error: updateError } = await client
      .from('inventory')
      .update({
        location: body.to_location,
        status: 'transferred',
      })
      .eq('id', body.inventory_id);
    
    if (updateError) {
      // 如果更新失败，删除转移单
      await client.from('stock_transfers').delete().eq('id', transfer.id);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: transfer as StockTransfer });
  } catch (error) {
    return NextResponse.json(
      { error: '创建转移单失败' },
      { status: 500 }
    );
  }
}
