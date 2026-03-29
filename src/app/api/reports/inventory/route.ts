import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取库存报表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('product_id');
    const locationId = searchParams.get('location_id');
    const brandId = searchParams.get('brand_id');
    const categoryId = searchParams.get('category_id');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    let query = client
      .from('inventory')
      .select(`
        *,
        product:products(
          id,
          name,
          brand_id,
          category_id,
          product_categories(id, name)
        ),
        location:warehouse_locations(id, name, code)
      `)
      .order('created_at', { ascending: false });
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 获取品牌信息
    const brandIds = [...new Set((data || [])
      .map((item: any) => item.product?.brand_id)
      .filter(Boolean))];
    
    let brands: Record<number, { id: number; name: string }> = {};
    if (brandIds.length > 0) {
      const { data: brandsData } = await client
        .from('brands')
        .select('id, name')
        .in('id', brandIds);
      
      (brandsData || []).forEach((brand: any) => {
        brands[brand.id] = brand;
      });
    }
    
    // 组装数据
    let filteredData = (data || []).map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        brands: item.product?.brand_id ? brands[item.product.brand_id] : null,
      },
    }));
    
    // 如果有品牌筛选，在内存中过滤
    if (brandId) {
      filteredData = filteredData.filter((item: any) => 
        item.product?.brand_id === parseInt(brandId)
      );
    }
    if (categoryId) {
      filteredData = filteredData.filter((item: any) => 
        item.product?.category_id === parseInt(categoryId)
      );
    }
    
    return NextResponse.json({ data: filteredData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate inventory report' },
      { status: 500 }
    );
  }
}
