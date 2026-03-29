import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { StockInOrder, StockInOrderInsert, StockInOrderItemInsert, InventoryInsert } from '@/types';

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
    const invoiceNo = searchParams.get('invoice_no');
    
    let query = client
      .from('stock_in_orders')
      .select(`
        *,
        suppliers (
          id,
          name,
          contact,
          phone
        ),
        items:stock_in_order_items (
          id,
          order_id,
          product_id,
          quantity,
          unit_price,
          amount,
          location,
          serial_numbers,
          notes,
          created_at,
          products (
            id,
            name,
            specification,
            model,
            unit
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (orderNo) {
      query = query.ilike('order_no', `%${orderNo}%`);
    }

    if (invoiceNo) {
      query = query.ilike('invoice_no', `%${invoiceNo}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as StockInOrder[] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get stock in orders' },
      { status: 500 }
    );
  }
}

// POST - 创建入库单（支持多产品）
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: StockInOrderInsert = await request.json();
    const { items, ...orderData } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Please add at least one product' }, { status: 400 });
    }

    const orderNo = generateOrderNo();
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount || '0') || 0), 0);

    // 创建入库单主表
    const { data: order, error: orderError } = await client
      .from('stock_in_orders')
      .insert({
        ...orderData,
        order_no: orderNo,
        total_quantity: totalQuantity,
        total_amount: totalAmount.toString(),
      })
      .select(`
        *,
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

    // 创建入库单明细
    const orderItems: StockInOrderItemInsert[] = items.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { data: createdItems, error: itemsError } = await client
      .from('stock_in_order_items')
      .insert(orderItems)
      .select(`
        id,
        order_id,
        product_id,
        quantity,
        unit_price,
        amount,
        location,
        serial_numbers,
        notes,
        created_at,
        products (
          id,
          name,
          specification,
          model,
          unit
        )
      `);
    
    if (itemsError) {
      // 如果明细创建失败，删除入库单
      await client.from('stock_in_orders').delete().eq('id', order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 批量创建库存记录
    for (const item of items) {
      const inventoryRecords: InventoryInsert[] = [];
      
      // 如果有序列号，使用序列号
      if (item.serial_numbers && item.serial_numbers.length > 0) {
        for (const serial of item.serial_numbers) {
          inventoryRecords.push({
            product_id: item.product_id,
            serial_number: serial,
            status: 'in_stock',
            location_id: item.location_id || undefined,
            location: item.location,
          });
        }
      } else {
        // 自动生成序列号
        for (let i = 0; i < item.quantity; i++) {
          const serialNumber = `SN${Date.now()}${i.toString().padStart(4, '0')}`;
          inventoryRecords.push({
            product_id: item.product_id,
            serial_number: serialNumber,
            status: 'in_stock',
            location_id: item.location_id || undefined,
            location: item.location,
          });
        }
      }

      if (inventoryRecords.length > 0) {
        const { error: inventoryError } = await client
          .from('inventory')
          .insert(inventoryRecords);
        
        if (inventoryError) {
          console.error('Failed to create inventory records:', inventoryError);
        }
      }
    }

    // 返回完整的入库单信息
    const result = {
      ...order,
      items: createdItems,
    };
    
    return NextResponse.json({ data: result as StockInOrder });
  } catch (error) {
    console.error('Failed to create stock in order:', error);
    return NextResponse.json(
      { error: 'Failed to create stock in order' },
      { status: 500 }
    );
  }
}
