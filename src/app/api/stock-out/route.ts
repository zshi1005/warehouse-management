import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { StockOutOrder, StockOutOrderInsert } from '@/types';

// 生成出库单号
function generateOrderNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CK${timestamp}${random}`;
}

// GET - 获取出库单列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const orderNo = searchParams.get('order_no');
    
    let query = client
      .from('stock_out_orders')
      .select(`
        *,
        products (
          id,
          name,
          specification,
          model,
          unit
        ),
        customers (
          id,
          name,
          contact,
          phone
        )
      `)
      .order('created_at', { ascending: false });
    
    if (orderNo) {
      query = query.ilike('order_no', `%${orderNo}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as StockOutOrder[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取出库单列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建出库单（需要序列号）
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: Omit<StockOutOrderInsert, 'order_no'> = await request.json();
    
    // 验证序列号是否存在且在库
    const { data: inventoryItems, error: checkError } = await client
      .from('inventory')
      .select('id, serial_number, status')
      .in('serial_number', body.serial_numbers);
    
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    // 检查序列号是否都存在
    if (inventoryItems.length !== body.serial_numbers.length) {
      return NextResponse.json(
        { error: '部分序列号不存在' },
        { status: 400 }
      );
    }
    
    // 检查是否都在库
    const notInStock = inventoryItems.filter(item => item.status !== 'in_stock');
    if (notInStock.length > 0) {
      return NextResponse.json(
        { error: `以下序列号不在库: ${notInStock.map(i => i.serial_number).join(', ')}` },
        { status: 400 }
      );
    }
    
    const orderNo = generateOrderNo();
    
    // 创建出库单
    const { data: order, error: orderError } = await client
      .from('stock_out_orders')
      .insert({ ...body, order_no: orderNo })
      .select(`
        *,
        products (
          id,
          name,
          specification,
          model,
          unit
        ),
        customers (
          id,
          name,
          contact,
          phone
        )
      `)
      .single();
    
    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }
    
    // 更新库存状态为已出库
    const inventoryIds = inventoryItems.map(item => item.id);
    if (inventoryIds.length > 0) {
      const { error: updateError } = await client
        .from('inventory')
        .update({ status: 'out_of_stock' })
        .in('id', inventoryIds);
      
      if (updateError) {
        // 如果更新失败，删除出库单
        await client.from('stock_out_orders').delete().eq('id', order.id);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }
    
    return NextResponse.json({ data: order as StockOutOrder });
  } catch (error) {
    return NextResponse.json(
      { error: '创建出库单失败' },
      { status: 500 }
    );
  }
}
