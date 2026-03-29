import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取入库报表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const invoiceNo = searchParams.get('invoice_no');
    const productId = searchParams.get('product_id');
    const supplierId = searchParams.get('supplier_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    let query = client
      .from('stock_in_orders')
      .select(`
        *,
        supplier:suppliers(id, name),
        items:stock_in_order_items(
          id,
          product_id,
          quantity,
          unit_price,
          amount,
          location,
          serial_numbers,
          product:products(id, name)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (invoiceNo) {
      query = query.ilike('invoice_no', `%${invoiceNo}%`);
    }
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }
    if (dateFrom) {
      query = query.gte('in_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('in_date', dateTo);
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
      { error: 'Failed to generate stock-in report' },
      { status: 500 }
    );
  }
}
