import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { StockOutOrder, StockOutOrderInsert, StockOutOrderItemInsert } from '@/types';

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
        customers (
          id,
          name,
          contact,
          phone
        ),
        stock_out_categories (
          id,
          name,
          code
        ),
        items:stock_out_order_items (
          id,
          order_id,
          product_id,
          quantity,
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
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 计算总数量
    const ordersWithTotal = (data || []).map(order => ({
      ...order,
      total_quantity: order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
    }));
    
    return NextResponse.json({ data: ordersWithTotal as StockOutOrder[] });
  } catch (error) {
    return NextResponse.json(
      { error: '获取出库单列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建出库单（支持多产品）
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: StockOutOrderInsert = await request.json();
    const { items, ...orderData } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: '请添加至少一个出库产品' }, { status: 400 });
    }

    const orderNo = generateOrderNo();
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // 创建出库单主表
    const { data: order, error: orderError } = await client
      .from('stock_out_orders')
      .insert({
        ...orderData,
        order_no: orderNo,
        total_quantity: totalQuantity,
      })
      .select(`
        *,
        customers (
          id,
          name,
          contact,
          phone
        ),
        stock_out_categories (
          id,
          name,
          code
        )
      `)
      .single();
    
    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 创建出库单明细
    const orderItems: StockOutOrderItemInsert[] = items.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { data: createdItems, error: itemsError } = await client
      .from('stock_out_order_items')
      .insert(orderItems)
      .select(`
        id,
        order_id,
        product_id,
        quantity,
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
      // 如果明细创建失败，删除出库单
      await client.from('stock_out_orders').delete().eq('id', order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 处理库存：验证序列号并更新状态
    for (const item of items) {
      if (item.serial_numbers && item.serial_numbers.length > 0) {
        // 验证序列号是否存在且在库
        const { data: inventoryItems, error: checkError } = await client
          .from('inventory')
          .select('id, serial_number, status')
          .in('serial_number', item.serial_numbers);
        
        if (checkError) {
          console.error('查询库存失败:', checkError);
          continue;
        }
        
        // 检查序列号是否都存在
        if (inventoryItems.length !== item.serial_numbers.length) {
          console.warn('部分序列号不存在:', item.serial_numbers.filter(s => !inventoryItems.find(i => i.serial_number === s)));
        }
        
        // 更新库存状态为已出库
        const inventoryIds = inventoryItems.map(item => item.id);
        if (inventoryIds.length > 0) {
          const { error: updateError } = await client
            .from('inventory')
            .update({ status: 'out_of_stock' })
            .in('id', inventoryIds);
          
          if (updateError) {
            console.error('更新库存状态失败:', updateError);
          }
        }
      }
    }

    // 返回完整的出库单信息
    const result = {
      ...order,
      items: createdItems,
    };
    
    return NextResponse.json({ data: result as StockOutOrder });
  } catch (error) {
    console.error('创建出库单失败:', error);
    return NextResponse.json(
      { error: '创建出库单失败' },
      { status: 500 }
    );
  }
}
