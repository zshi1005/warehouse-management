import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 产品库存统计接口
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('product_id');
    const categoryId = searchParams.get('category_id');

    // 获取所有产品（包含类别信息）
    let productsQuery = client
      .from('products')
      .select(`
        *,
        product_categories (
          id,
          name,
          description
        )
      `)
      .eq('is_active', true)
      .order('name');
    
    if (categoryId) {
      productsQuery = productsQuery.eq('category_id', parseInt(categoryId));
    }
    
    const { data: products, error: productsError } = await productsQuery;

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    // 获取库存统计
    const { data: inventory, error: inventoryError } = await client
      .from('inventory')
      .select(`
        id,
        product_id,
        serial_number,
        status,
        location,
        created_at,
        updated_at
      `);

    if (inventoryError) {
      return NextResponse.json({ error: inventoryError.message }, { status: 500 });
    }

    // 获取入库统计
    const { data: stockInOrders, error: stockInError } = await client
      .from('stock_in_orders')
      .select('product_id, quantity');

    if (stockInError) {
      return NextResponse.json({ error: stockInError.message }, { status: 500 });
    }

    // 获取出库统计
    const { data: stockOutOrders, error: stockOutError } = await client
      .from('stock_out_orders')
      .select('product_id, quantity');

    if (stockOutError) {
      return NextResponse.json({ error: stockOutError.message }, { status: 500 });
    }

    // 获取所有类别（用于筛选）
    const { data: categories, error: categoriesError } = await client
      .from('product_categories')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order');

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 });
    }

    // 组装统计数据
    const productStats = products.map(product => {
      const productInventory = inventory.filter(i => i.product_id === product.id);
      const inStock = productInventory.filter(i => i.status === 'in_stock');
      const outOfStock = productInventory.filter(i => i.status === 'out_of_stock');
      const transferred = productInventory.filter(i => i.status === 'transferred');
      
      const totalIn = stockInOrders
        .filter(o => o.product_id === product.id)
        .reduce((sum, o) => sum + o.quantity, 0);
      
      const totalOut = stockOutOrders
        .filter(o => o.product_id === product.id)
        .reduce((sum, o) => sum + o.quantity, 0);

      return {
        product: {
          id: product.id,
          name: product.name,
          category_id: product.category_id,
          category_name: product.product_categories?.name || null,
          specification: product.specification,
          model: product.model,
          unit: product.unit,
        },
        stats: {
          total: productInventory.length,
          in_stock: inStock.length,
          out_of_stock: outOfStock.length,
          transferred: transferred.length,
          total_in_quantity: totalIn,
          total_out_quantity: totalOut,
        },
        inventory: productId === product.id.toString() ? productInventory : undefined,
      };
    });

    // 计算总体统计
    const overallStats = {
      total_products: products.length,
      total_inventory: inventory.length,
      in_stock_count: inventory.filter(i => i.status === 'in_stock').length,
      out_of_stock_count: inventory.filter(i => i.status === 'out_of_stock').length,
      transferred_count: inventory.filter(i => i.status === 'transferred').length,
    };

    return NextResponse.json({
      data: {
        products: productStats,
        overall: overallStats,
        categories: categories || [],
      }
    });
  } catch (error) {
    console.error('获取驾驶舱数据失败:', error);
    return NextResponse.json(
      { error: '获取驾驶舱数据失败' },
      { status: 500 }
    );
  }
}
