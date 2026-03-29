'use client';

import { useEffect, useState } from 'react';
import { Package, Users, UserCheck, PackageSearch, TrendingUp, AlertCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

interface Stats {
  totalProducts: number;
  totalSuppliers: number;
  totalCustomers: number;
  inStockCount: number;
  outOfStockCount: number;
  transferredCount: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalSuppliers: 0,
    totalCustomers: 0,
    inStockCount: 0,
    outOfStockCount: 0,
    transferredCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, suppliersRes, customersRes, inventoryRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/suppliers'),
        fetch('/api/customers'),
        fetch('/api/inventory'),
      ]);

      const [products, suppliers, customers, inventory] = await Promise.all([
        productsRes.json(),
        suppliersRes.json(),
        customersRes.json(),
        inventoryRes.json(),
      ]);

      const inventoryData = inventory.data || [];
      
      setStats({
        totalProducts: products.data?.length || 0,
        totalSuppliers: suppliers.data?.length || 0,
        totalCustomers: customers.data?.length || 0,
        inStockCount: inventoryData.filter((item: any) => item.status === 'in_stock').length,
        outOfStockCount: inventoryData.filter((item: any) => item.status === 'out_of_stock').length,
        transferredCount: inventoryData.filter((item: any) => item.status === 'transferred').length,
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '产品总数', value: stats.totalProducts, icon: Package, color: 'blue' },
    { label: '供应商总数', value: stats.totalSuppliers, icon: Users, color: 'green' },
    { label: '客户总数', value: stats.totalCustomers, icon: UserCheck, color: 'purple' },
    { label: '在库数量', value: stats.inStockCount, icon: PackageSearch, color: 'indigo' },
    { label: '已出库数量', value: stats.outOfStockCount, icon: TrendingUp, color: 'orange' },
    { label: '已转移数量', value: stats.transferredCount, icon: AlertCircle, color: 'red' },
  ];

  return (
    <MainLayout>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">系统概览</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                      <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 快速操作 */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/stock-in"
              className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Package className="mr-2 h-5 w-5" />
              新增入库
            </a>
            <a
              href="/stock-out"
              className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              新增出库
            </a>
            <a
              href="/stock-transfers"
              className="flex items-center justify-center px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              库存转移
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
