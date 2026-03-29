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
    const fromSiteId = searchParams.get('from_site_id');
    const toSiteId = searchParams.get('to_site_id');
    
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
        ),
        from_site:construction_sites!fk_stock_transfers_from_site (
          id,
          name,
          code
        ),
        to_site:construction_sites!fk_stock_transfers_to_site (
          id,
          name,
          code
        )
      `)
      .order('created_at', { ascending: false });
    
    if (transferNo) {
      query = query.ilike('transfer_no', `%${transferNo}%`);
    }
    if (fromSiteId) {
      query = query.eq('from_site_id', parseInt(fromSiteId));
    }
    if (toSiteId) {
      query = query.eq('to_site_id', parseInt(toSiteId));
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data as StockTransfer[] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get stock transfers' },
      { status: 500 }
    );
  }
}

// POST - 创建转移单（从已出库的内部使用设备转移）
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body: Omit<StockTransferInsert, 'transfer_no'> = await request.json();
    
    // 验证库存记录是否存在且已出库
    const { data: inventoryItem, error: checkError } = await client
      .from('inventory')
      .select(`
        id, 
        serial_number, 
        status, 
        product_id,
        products (id, name)
      `)
      .eq('id', body.inventory_id)
      .maybeSingle();
    
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'Inventory record not found' },
        { status: 404 }
      );
    }
    
    // 检查是否已出库（只有已出库的设备才能转移）
    if (inventoryItem.status !== 'out_of_stock') {
      return NextResponse.json(
        { error: 'Only out-of-stock equipment can be transferred' },
        { status: 400 }
      );
    }
    
    // 验证来源工地和目标工地
    if (body.from_site_id) {
      const { data: fromSite } = await client
        .from('construction_sites')
        .select('id, name')
        .eq('id', body.from_site_id)
        .maybeSingle();
      
      if (!fromSite) {
        return NextResponse.json(
          { error: 'Source construction site not found' },
          { status: 400 }
        );
      }
    }
    
    const { data: toSite } = await client
      .from('construction_sites')
      .select('id, name')
      .eq('id', body.to_site_id)
      .maybeSingle();
    
    if (!toSite) {
      return NextResponse.json(
        { error: 'Target construction site not found' },
        { status: 400 }
      );
    }
    
    const transferNo = generateTransferNo();
    
    // 创建转移单
    const { data: transfer, error: transferError } = await client
      .from('stock_transfers')
      .insert({
        transfer_no: transferNo,
        product_id: body.product_id,
        inventory_id: body.inventory_id,
        serial_number: body.serial_number,
        from_site_id: body.from_site_id || null,
        to_site_id: body.to_site_id,
        notes: body.notes,
      })
      .select(`
        *,
        products (
          id,
          name,
          specification,
          model,
          unit
        ),
        from_site:construction_sites!fk_stock_transfers_from_site (
          id,
          name,
          code
        ),
        to_site:construction_sites!fk_stock_transfers_to_site (
          id,
          name,
          code
        )
      `)
      .single();
    
    if (transferError) {
      return NextResponse.json({ error: transferError.message }, { status: 500 });
    }
    
    // 更新库存状态为已转移
    const { error: updateError } = await client
      .from('inventory')
      .update({
        status: 'transferred',
        updated_at: new Date().toISOString(),
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
      { error: 'Failed to create stock transfer' },
      { status: 500 }
    );
  }
}
