import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取单个入库单详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data, error } = await client
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
      .eq('id', parseInt(id))
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get stock in order' },
      { status: 500 }
    );
  }
}

// DELETE - 删除入库单（同时删除相关库存记录）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const orderId = parseInt(id);
    
    // 1. 获取入库单明细，提取序列号
    const { data: items, error: itemsError } = await client
      .from('stock_in_order_items')
      .select('serial_numbers, product_id')
      .eq('order_id', orderId);
    
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
    
    // 2. 收集所有序列号
    const serialNumbers: string[] = [];
    if (items) {
      for (const item of items) {
        if (item.serial_numbers && Array.isArray(item.serial_numbers)) {
          serialNumbers.push(...item.serial_numbers);
        }
      }
    }
    
    // 3. 删除相关库存记录（只删除未出库的）
    if (serialNumbers.length > 0) {
      const { error: inventoryError } = await client
        .from('inventory')
        .delete()
        .in('serial_number', serialNumbers)
        .eq('status', 'in_stock'); // 只删除在库状态的
      
      if (inventoryError) {
        console.error('Failed to delete inventory records:', inventoryError);
      }
    }
    
    // 4. 删除入库单明细（级联删除会自动处理，但为了保险手动删除）
    const { error: deleteItemsError } = await client
      .from('stock_in_order_items')
      .delete()
      .eq('order_id', orderId);
    
    if (deleteItemsError) {
      return NextResponse.json({ error: deleteItemsError.message }, { status: 500 });
    }
    
    // 5. 删除入库单主表
    const { error: deleteOrderError } = await client
      .from('stock_in_orders')
      .delete()
      .eq('id', orderId);
    
    if (deleteOrderError) {
      return NextResponse.json({ error: deleteOrderError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Stock in order deleted successfully' });
  } catch (error) {
    console.error('Failed to delete stock in order:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock in order' },
      { status: 500 }
    );
  }
}
