'use client';

import { useEffect, useState } from 'react';
import { Package, TrendingUp, TrendingDown, ArrowRightLeft, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

interface Product {
  id: number;
  name: string;
  category_id: number | null;
  category_name: string | null;
  specification: string | null;
  model: string | null;
  unit: string;
}

interface InventoryItem {
  id: number;
  serial_number: string;
  status: string;
  location: string | null;
  created_at: string;
}

interface ProductStat {
  product: Product;
  stats: {
    total: number;
    in_stock: number;
    out_of_stock: number;
    transferred: number;
    total_in_quantity: number;
    total_out_quantity: number;
  };
  inventory?: InventoryItem[];
}

interface OverallStats {
  total_products: number;
  total_inventory: number;
  in_stock_count: number;
  out_of_stock_count: number;
  transferred_count: number;
}

interface Category {
  id: number;
  name: string;
}

export default function DashboardPage() {
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [categoryFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) {
        params.append('category_id', categoryFilter);
      }
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      const data = await res.json();
      
      if (data.data) {
        setProductStats(data.data.products || []);
        setOverallStats(data.data.overall || null);
        if (data.data.categories) {
          setCategories(data.data.categories);
        }
      }
    } catch (error) {
      console.error('获取驾驶舱数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductInventory = async (productId: number) => {
    try {
      const params = new URLSearchParams();
      params.append('product_id', productId.toString());
      if (categoryFilter) {
        params.append('category_id', categoryFilter);
      }
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      const data = await res.json();
      
      if (data.data) {
        setProductStats(prev => 
          prev.map(ps => 
            ps.product.id === productId 
              ? { ...ps, inventory: data.data.products[0]?.inventory }
              : ps
          )
        );
      }
    } catch (error) {
      console.error('获取产品库存详情失败:', error);
    }
  };

  const toggleProductExpand = (productId: number) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(productId);
      fetchProductInventory(productId);
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

  const filteredProducts = productStats.filter(ps => {
    const matchesSearch = ps.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ps.product.specification?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ps.product.model?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || ps.stats[statusFilter as keyof typeof ps.stats] > 0;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">驾驶舱 - 产品库存明细</h2>

        {/* 总体统计卡片 */}
        {overallStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">产品总数</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.total_products}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总库存数</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.total_inventory}</p>
                </div>
                <Package className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">在库数量</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{overallStats.in_stock_count}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已出库</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{overallStats.out_of_stock_count}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已转移</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{overallStats.transferred_count}</p>
                </div>
                <ArrowRightLeft className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* 筛选栏 */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索产品名称、规格或型号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部类别</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option value="in_stock">有在库</option>
            <option value="out_of_stock">有已出库</option>
            <option value="transferred">有已转移</option>
          </select>
        </div>

        {/* 产品库存明细表格 */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">暂无产品数据</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((ps) => (
              <div key={ps.product.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* 产品统计行 */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleProductExpand(ps.product.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{ps.product.name}</h3>
                        {ps.product.category_name && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {ps.product.category_name}
                          </span>
                        )}
                        <span className="ml-2 text-sm text-gray-500">
                          {ps.product.specification} {ps.product.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-600">
                          累计入库: <span className="font-semibold text-blue-600">{ps.stats.total_in_quantity}</span> {ps.product.unit}
                        </span>
                        <span className="text-sm text-gray-600">
                          累计出库: <span className="font-semibold text-orange-600">{ps.stats.total_out_quantity}</span> {ps.product.unit}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">在库</p>
                          <p className="text-xl font-bold text-green-600">{ps.stats.in_stock}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">已出库</p>
                          <p className="text-xl font-bold text-orange-600">{ps.stats.out_of_stock}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">已转移</p>
                          <p className="text-xl font-bold text-purple-600">{ps.stats.transferred}</p>
                        </div>
                      </div>
                      {expandedProduct === ps.product.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 展开的库存明细 */}
                {expandedProduct === ps.product.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">库存明细</h4>
                    {ps.inventory && ps.inventory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600 border-b border-gray-200">
                              <th className="pb-2 font-medium">序列号</th>
                              <th className="pb-2 font-medium">状态</th>
                              <th className="pb-2 font-medium">位置</th>
                              <th className="pb-2 font-medium">入库时间</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ps.inventory.map((item) => (
                              <tr key={item.id} className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-mono text-gray-900">{item.serial_number}</td>
                                <td className="py-2">{getStatusBadge(item.status)}</td>
                                <td className="py-2 text-gray-600">{item.location || '-'}</td>
                                <td className="py-2 text-gray-600">
                                  {new Date(item.created_at).toLocaleString('zh-CN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">暂无库存明细</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 产品库存汇总表 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">库存汇总表</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类别</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">规格型号</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">累计入库</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">累计出库</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">在库</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">已出库</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">已转移</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((ps) => (
                  <tr key={ps.product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ps.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ps.product.category_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ps.product.specification || '-'} {ps.product.model || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 font-semibold">
                      {ps.stats.total_in_quantity} {ps.product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-orange-600 font-semibold">
                      {ps.stats.total_out_quantity} {ps.product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-bold">
                      {ps.stats.in_stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-orange-600 font-semibold">
                      {ps.stats.out_of_stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-purple-600 font-semibold">
                      {ps.stats.transferred}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
