import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取出库报表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('product_id');
    const customerId = searchParams.get('customer_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    let query = client
      .from('stock_out_orders')
      .select(`
        *,
        customer:customers(id, name),
        items:stock_out_order_items(
          id,
          product_id,
          quantity,
          unit_price,
          amount,
          serial_numbers,
          product:products(id, name)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (dateFrom) {
      query = query.gte('out_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('out_date', dateTo);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 如果有产品筛选，在内存中过滤
    let filteredData = data || [];
    if (productId) {
      filteredData = filteredData.filter((order: any) => 
        order.items?.some((item: any) => item.product_id === parseInt(productId))
      );
    }
    
    return NextResponse.json({ data: filteredData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate stock-out report' },
      { status: 500 }
    );
  }
}
