import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { StockInOrder, StockInOrderInsert, InventoryInsert } from '@/types';

// 生成入库单号
function generateOrderNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RK${timestamp}${random}`;
}

// GET - 获取入库单列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const orderNo = searchParams.get('order_no');
    
    let query = client
      .from('stock_in_orders')
      .select(`
        *,
        products (
          id,
          name,
          specification,
          model,
          unit
        ),
        suppliers (
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
    
    return NextResponse.json({ data: data as StockInOrder[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取入库单列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建入库单（批量入库）
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: Omit<StockInOrderInsert, 'order_no'> & { location_id?: number } = await request.json();
    
    const orderNo = generateOrderNo();
    
    // 创建入库单
    const { data: order, error: orderError } = await client
      .from('stock_in_orders')
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
        suppliers (
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
    
    // 批量创建库存记录
    const inventoryRecords: InventoryInsert[] = [];
    for (let i = 0; i < body.quantity; i++) {
      const serialNumber = `SN${Date.now()}${i.toString().padStart(4, '0')}`;
      inventoryRecords.push({
        product_id: body.product_id,
        serial_number: serialNumber,
        status: 'in_stock',
        location_id: body.location_id || undefined,
        location: body.location,
      });
    }
    
    const { error: inventoryError } = await client
      .from('inventory')
      .insert(inventoryRecords);
    
    if (inventoryError) {
      // 如果库存创建失败，删除入库单
      await client.from('stock_in_orders').delete().eq('id', order.id);
      return NextResponse.json({ error: inventoryError.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: order as StockInOrder });
  } catch (error) {
    return NextResponse.json(
      { error: '创建入库单失败' },
      { status: 500 }
    );
  }
}
