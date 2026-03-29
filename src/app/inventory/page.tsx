'use client';

import { useEffect, useState } from 'react';
import { Search, Package, MapPin } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { Inventory, WarehouseLocation, Product } from '@/types';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSerial, setSearchSerial] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchLocations();
  }, [searchSerial, filterStatus, filterProduct, filterLocation]);

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

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('获取产品列表失败:', error);
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

  return (
    <MainLayout>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">库存查询</h2>

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
      </div>
    </MainLayout>
  );
}
