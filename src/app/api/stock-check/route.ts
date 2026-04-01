import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { StockCheckOrder, StockCheckOrderInsert, StockCheckItemInsert } from '@/types';

// 生成盘点单号
function generateCheckNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PD${timestamp}${random}`;
}

// GET - 获取盘点单列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const checkNo = searchParams.get('check_no');
    const status = searchParams.get('status');
    
    let query = client
      .from('stock_check_orders')
      .select(`
        *,
        items:stock_check_items (
          id,
          check_id,
          product_id,
          system_quantity,
          actual_quantity,
          difference,
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
    
    if (checkNo) {
      query = query.ilike('check_no', `%${checkNo}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as StockCheckOrder[] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get stock check orders' },
      { status: 500 }
    );
  }
}

// POST - 创建盘点单
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: StockCheckOrderInsert = await request.json();
    const { items, ...orderData } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Please add at least one product' }, { status: 400 });
    }

    const checkNo = generateCheckNo();
    const totalItems = items.length;

    // 创建盘点单主表
    const { data: order, error: orderError } = await client
      .from('stock_check_orders')
      .insert({
        check_no: checkNo,
        check_date: orderData.check_date || null,
        total_items: totalItems,
        status: orderData.status || 'pending',
        notes: orderData.notes || null,
      })
      .select()
      .single();
    
    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || 'Failed to create order' }, { status: 500 });
    }

    // 创建盘点明细
    const checkItemsData: StockCheckItemInsert[] = items.map(item => ({
      check_id: order.id,
      product_id: item.product_id,
      system_quantity: item.system_quantity,
      actual_quantity: item.actual_quantity,
      difference: item.actual_quantity - item.system_quantity,
      notes: item.notes || undefined,
    }));

    const { data: createdItems, error: itemsError } = await client
      .from('stock_check_items')
      .insert(checkItemsData)
      .select(`
        id,
        check_id,
        product_id,
        system_quantity,
        actual_quantity,
        difference,
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
      // 如果明细创建失败，删除盘点单
      await client.from('stock_check_orders').delete().eq('id', order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 返回完整的盘点单信息
    const result = {
      ...order,
      items: createdItems,
    };
    
    return NextResponse.json({ data: result as StockCheckOrder });
  } catch (error) {
    console.error('Failed to create stock check order:', error);
    return NextResponse.json(
      { error: 'Failed to create stock check order' },
      { status: 500 }
    );
  }
}
