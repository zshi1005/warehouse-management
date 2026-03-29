'use client';

import { useEffect, useState } from 'react';
import { Search, Package, MapPin, AlertTriangle, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { Inventory, WarehouseLocation, Product } from '@/types';

interface InventoryStats {
  total: number;
  in_stock: number;
  out_of_stock: number;
  transferred: number;
}

interface ProductWithStats extends Product {
  stats?: InventoryStats;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'detail' | 'summary'>('summary');
  const [searchSerial, setSearchSerial] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchLocations();
  }, []);

  useEffect(() => {
    if (viewMode === 'detail') {
      fetchInventory();
    }
  }, [viewMode, searchSerial, filterStatus, filterProduct, filterLocation]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?with_stats=true');
      const data = await res.json();
      setProducts(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('获取产品列表失败:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchSerial) params.append('serial_number', searchSerial);
      if (filterStatus) params.append('status', filterStatus);
      if (filterProduct) params.append('product_id', filterProduct);
      if (filterLocation) params.append('location_id', filterLocation);
      
      const res = await fetch(`/api/inventory?${params.toString()}`);
      const data = await res.json();
      setInventory(data.data || []);
    } catch (error) {
      console.error('获取库存列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/warehouse-locations');
      const data = await res.json();
      setLocations(data.data || []);
    } catch (error) {
      console.error('获取仓库位置列表失败:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      in_stock: { label: '在库', className: 'bg-green-100 text-green-700' },
      out_of_stock: { label: '已出库', className: 'bg-orange-100 text-orange-700' },
      transferred: { label: '已转移', className: 'bg-purple-100 text-purple-700' },
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>{config.label}</span>;
  };

  // 计算总体统计
  const overallStats = products.reduce((acc, product) => {
    if (product.stats) {
      acc.total += product.stats.total;
      acc.in_stock += product.stats.in_stock;
      acc.out_of_stock += product.stats.out_of_stock;
      acc.transferred += product.stats.transferred;
    }
    return acc;
  }, { total: 0, in_stock: 0, out_of_stock: 0, transferred: 0 });

  // 低库存产品
  const lowStockProducts = products.filter(p => {
    if (!p.stats) return false;
    return p.stats.in_stock <= p.warning_threshold && p.stats.in_stock > 0;
  });

  // 缺货产品
  const outOfStockProducts = products.filter(p => {
    if (!p.stats) return false;
    return p.stats.in_stock === 0;
  });

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">库存查询</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              库存汇总
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'detail' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              明细查询
            </button>
          </div>
        </div>

        {/* 总体统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总库存数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.total}</p>
              </div>
              <Package className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">在库数量</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{overallStats.in_stock}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已出库</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{overallStats.out_of_stock}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已转移</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{overallStats.transferred}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* 库存预警 */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="mb-6 space-y-4">
            {outOfStockProducts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-semibold text-red-700">缺货预警 ({outOfStockProducts.length} 个产品)</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {outOfStockProducts.map(p => (
                    <span key={p.id} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {lowStockProducts.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-semibold text-yellow-700">库存不足预警 ({lowStockProducts.length} 个产品)</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lowStockProducts.map(p => (
                    <span key={p.id} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      {p.name} (剩余: {p.stats?.in_stock || 0})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'summary' ? (
          /* 库存汇总视图 */
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类别</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">在库数量</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">已出库数量</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">已转移</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const stats = product.stats || { in_stock: 0, out_of_stock: 0, transferred: 0 };
                  const isLow = stats.in_stock <= product.warning_threshold && stats.in_stock > 0;
                  const isOut = stats.in_stock === 0;
                  
                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 ${isOut ? 'bg-red-50' : isLow ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3 rounded-lg overflow-hidden bg-gray-100 border">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="h-10 w-10 object-cover" />
                            ) : (
                              <div className="h-10 w-10 flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.specification} {product.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.product_categories ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                            {product.product_categories.name}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-lg font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-green-600'}`}>
                          {stats.in_stock}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">{product.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-semibold text-orange-600">{stats.out_of_stock}</span>
                        <span className="text-xs text-gray-500 ml-1">{product.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-semibold text-purple-600">{stats.transferred}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isOut ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />缺货
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />库存不足
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            正常
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* 明细查询视图 */
          <>
            {/* 筛选栏 */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索序列号..."
                  value={searchSerial}
                  onChange={(e) => setSearchSerial(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部产品</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                <option value="in_stock">在库</option>
                <option value="out_of_stock">已出库</option>
                <option value="transferred">已转移</option>
              </select>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部位置</option>
                {locations.filter(l => l.is_active).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* 库存列表 */}
            {loading ? (
              <div className="text-center py-12">加载中...</div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">暂无库存数据</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">序列号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">规格型号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">存放位置</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">入库时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">{item.serial_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.products?.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.products?.specification || '-'} {item.products?.model || ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.warehouse_locations || item.location ? (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {item.warehouse_locations?.name || item.location}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
