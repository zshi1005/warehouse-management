'use client';

import { useEffect, useState } from 'react';
import { Package, Users, UserCheck, PackageSearch, TrendingUp, AlertCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/LanguageContext';

interface Stats {
  totalProducts: number;
  totalSuppliers: number;
  totalCustomers: number;
  inStockCount: number;
  outOfStockCount: number;
  transferredCount: number;
}

export default function HomePage() {
  const { t, language } = useLanguage();
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
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: t.dashboard.totalProducts, value: stats.totalProducts, icon: Package, color: 'blue' },
    { label: t.dashboard.totalSuppliers, value: stats.totalSuppliers, icon: Users, color: 'green' },
    { label: t.dashboard.totalCustomers, value: stats.totalCustomers, icon: UserCheck, color: 'purple' },
    { label: language === 'zh' ? '在库数量' : 'In Stock', value: stats.inStockCount, icon: PackageSearch, color: 'indigo' },
    { label: language === 'zh' ? '已出库数量' : 'Out of Stock', value: stats.outOfStockCount, icon: TrendingUp, color: 'orange' },
    { label: language === 'zh' ? '已转移数量' : 'Transferred', value: stats.transferredCount, icon: AlertCircle, color: 'red' },
  ];

  const quickActions = [
    { href: '/stock-in', label: t.stockIn.addStockIn, icon: Package, color: 'bg-blue-600 hover:bg-blue-700' },
    { href: '/stock-out', label: t.stockOut.addStockOut, icon: TrendingUp, color: 'bg-green-600 hover:bg-green-700' },
    { href: '/stock-transfers', label: t.transfer.addTransfer, icon: AlertCircle, color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  return (
    <MainLayout>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {language === 'zh' ? '系统概览' : 'System Overview'}
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">{t.common.loading}</div>
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

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'zh' ? '快速操作' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <a
                  key={index}
                  href={action.href}
                  className={`flex items-center justify-center px-6 py-4 text-white rounded-lg transition-colors ${action.color}`}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {action.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
