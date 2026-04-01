import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取单个盘点单
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    const { data, error } = await client
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
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get stock check order' },
      { status: 500 }
    );
  }
}

// PUT - 更新盘点单（完成盘点，调整库存）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { status, items } = body;

    // 获取盘点单
    const { data: order, error: orderError } = await client
      .from('stock_check_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Stock check order not found' }, { status: 404 });
    }

    // 如果是完成盘点，需要调整库存
    if (status === 'completed' && items) {
      for (const item of items) {
        const difference = item.actual_quantity - item.system_quantity;
        
        if (difference > 0) {
          // 盘盈：需要增加库存记录
          for (let i = 0; i < difference; i++) {
            const serialNumber = `CK${Date.now()}${i.toString().padStart(4, '0')}`;
            await client.from('inventory').insert({
              product_id: item.product_id,
              serial_number: serialNumber,
              status: 'in_stock',
              notes: `盘点盘盈 - 盘点单号: ${order.check_no}`,
            });
          }
        } else if (difference < 0) {
          // 盘亏：需要删除库存记录
          const { data: inventoryToDelete } = await client
            .from('inventory')
            .select('id')
            .eq('product_id', item.product_id)
            .eq('status', 'in_stock')
            .limit(Math.abs(difference));
          
          if (inventoryToDelete && inventoryToDelete.length > 0) {
            const idsToDelete = inventoryToDelete.map(inv => inv.id);
            await client.from('inventory').delete().in('id', idsToDelete);
          }
        }

        // 更新盘点明细
        await client
          .from('stock_check_items')
          .update({
            actual_quantity: item.actual_quantity,
            difference: difference,
          })
          .eq('id', item.id);
      }
    }

    // 更新盘点单状态
    const { data, error } = await client
      .from('stock_check_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to update stock check order:', error);
    return NextResponse.json(
      { error: 'Failed to update stock check order' },
      { status: 500 }
    );
  }
}

// DELETE - 删除盘点单
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    // 先删除明细
    await client.from('stock_check_items').delete().eq('check_id', id);
    
    // 再删除主表
    const { error } = await client.from('stock_check_orders').delete().eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete stock check order' },
      { status: 500 }
    );
  }
}
