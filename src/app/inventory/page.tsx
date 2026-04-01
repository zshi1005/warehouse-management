'use client';

import { useEffect, useState } from 'react';
import { Search, Package, MapPin, AlertTriangle, TrendingUp, TrendingDown, ArrowRightLeft, ShoppingCart, ClipboardCheck, X, Check, Trash2, FileText, Calendar } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { Inventory, WarehouseLocation, Product, StockCheckOrder, StockCheckItemInsert } from '@/types';

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

  // 盘点相关状态
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkItems, setCheckItems] = useState<Array<{
    product_id: number;
    product_name: string;
    system_quantity: number;
    actual_quantity: number;
    unit: string;
  }>>([]);
  const [checkNotes, setCheckNotes] = useState('');
  const [checkOrders, setCheckOrders] = useState<StockCheckOrder[]>([]);
  const [showCheckHistory, setShowCheckHistory] = useState(false);

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

  const fetchCheckOrders = async () => {
    try {
      const res = await fetch('/api/stock-check');
      const data = await res.json();
      setCheckOrders(data.data || []);
    } catch (error) {
      console.error('获取盘点记录失败:', error);
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

  const getCheckStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
      cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-700' },
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

  // 快速采购 - 跳转到入库页面
  const handleQuickPurchase = (productIds?: number[]) => {
    const ids = productIds || outOfStockProducts.map(p => p.id);
    if (ids.length > 0) {
      localStorage.setItem('quickPurchaseProducts', JSON.stringify(ids));
      window.location.href = '/stock-in';
    }
  };

  // 打开盘点模态框
  const openCheckModal = () => {
    const items = products
      .filter(p => p.stats && p.stats.in_stock > 0)
      .map(p => ({
        product_id: p.id,
        product_name: p.name,
        system_quantity: p.stats!.in_stock,
        actual_quantity: p.stats!.in_stock,
        unit: p.unit,
      }));
    setCheckItems(items);
    setCheckNotes('');
    setShowCheckModal(true);
  };

  // 更新盘点数量
  const updateCheckItem = (productId: number, actualQuantity: number) => {
    setCheckItems(items =>
      items.map(item =>
        item.product_id === productId
          ? { ...item, actual_quantity: actualQuantity }
          : item
      )
    );
  };

  // 提交盘点
  const submitCheck = async () => {
    try {
      const items: StockCheckItemInsert[] = checkItems.map(item => ({
        product_id: item.product_id,
        system_quantity: item.system_quantity,
        actual_quantity: item.actual_quantity,
        difference: item.actual_quantity - item.system_quantity,
      }));

      const res = await fetch('/api/stock-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_date: new Date().toISOString().split('T')[0],
          notes: checkNotes,
          items,
        }),
      });

      if (res.ok) {
        alert('盘点单创建成功！');
        setShowCheckModal(false);
        fetchProducts();
      } else {
        const error = await res.json();
        alert(`盘点失败: ${error.error}`);
      }
    } catch (error) {
      console.error('盘点失败:', error);
      alert('盘点失败');
    }
  };

  // 完成盘点（调整库存）
  const completeCheck = async (orderId: number, items: any[]) => {
    if (!confirm('确认完成盘点？将根据盘点结果调整库存。')) return;
    
    try {
      const res = await fetch(`/api/stock-check/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', items }),
      });

      if (res.ok) {
        alert('盘点完成，库存已调整！');
        fetchCheckOrders();
        fetchProducts();
      } else {
        const error = await res.json();
        alert(`操作失败: ${error.error}`);
      }
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败');
    }
  };

  // 删除盘点单
  const deleteCheck = async (orderId: number) => {
    if (!confirm('确定要删除此盘点单吗？')) return;
    
    try {
      const res = await fetch(`/api/stock-check/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCheckOrders();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">库存查询</h2>
          <div className="flex gap-2">
            <button
              onClick={openCheckModal}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ClipboardCheck className="h-5 w-5 mr-2" />库存盘点
            </button>
            <button
              onClick={() => { fetchCheckOrders(); setShowCheckHistory(true); }}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <FileText className="h-5 w-5 mr-2" />盘点记录
            </button>
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-semibold text-red-700">缺货预警 ({outOfStockProducts.length} 个产品)</span>
                  </div>
                  <button
                    onClick={() => handleQuickPurchase()}
                    className="flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />立即采购
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {outOfStockProducts.map(p => (
                    <span key={p.id} className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      {p.name}
                      <button
                        onClick={() => handleQuickPurchase([p.id])}
                        className="ml-2 text-red-600 hover:text-red-800"
                        title="采购此产品"
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {lowStockProducts.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-semibold text-yellow-700">库存不足预警 ({lowStockProducts.length} 个产品)</span>
                  </div>
                  <button
                    onClick={() => handleQuickPurchase(lowStockProducts.map(p => p.id))}
                    className="flex items-center px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />补充库存
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lowStockProducts.map(p => (
                    <span key={p.id} className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      {p.name} (剩余: {p.stats?.in_stock || 0})
                      <button
                        onClick={() => handleQuickPurchase([p.id])}
                        className="ml-2 text-yellow-600 hover:text-yellow-800"
                        title="采购此产品"
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </button>
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {(isOut || isLow) && (
                          <button
                            onClick={() => handleQuickPurchase([product.id])}
                            className="text-blue-600 hover:text-blue-700"
                            title="采购"
                          >
                            <ShoppingCart className="h-5 w-5" />
                          </button>
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

        {/* 盘点模态框 */}
        {showCheckModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <ClipboardCheck className="h-5 w-5 mr-2 text-green-600" />
                  库存盘点
                </h3>
                <button onClick={() => setShowCheckModal(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                请核对实际库存数量，系统将自动计算差异。
              </div>

              <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">系统库存</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">实际库存</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">差异</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {checkItems.map((item) => {
                    const diff = item.actual_quantity - item.system_quantity;
                    return (
                      <tr key={item.product_id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product_name}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{item.system_quantity} {item.unit}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.actual_quantity}
                            onChange={(e) => updateCheckItem(item.product_id, parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 border rounded text-center focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input
                  type="text"
                  value={checkNotes}
                  onChange={(e) => setCheckNotes(e.target.value)}
                  placeholder="盘点备注..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowCheckModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
                <button onClick={submitCheck} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />确认盘点
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 盘点记录模态框 */}
        {showCheckHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-600" />
                  盘点记录
                </h3>
                <button onClick={() => setShowCheckHistory(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {checkOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无盘点记录</div>
              ) : (
                <div className="space-y-4">
                  {checkOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{order.check_no}</span>
                            {getCheckStatusBadge(order.status)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                            <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" />{order.check_date || '未指定日期'}</span>
                            <span>共 {order.total_items} 项</span>
                          </div>
                          {order.notes && <div className="text-sm text-gray-600 mt-1">{order.notes}</div>}
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <button onClick={() => completeCheck(order.id, order.items || [])} className="text-green-600 hover:text-green-700">
                              <Check className="h-5 w-5" />
                            </button>
                          )}
                          <button onClick={() => deleteCheck(order.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {order.items && order.items.length > 0 && (
                        <div className="mt-3 border-t pt-3">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-gray-500">
                                <th className="text-left py-1">产品</th>
                                <th className="text-center py-1">系统</th>
                                <th className="text-center py-1">实际</th>
                                <th className="text-center py-1">差异</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item: any) => (
                                <tr key={item.id} className="border-t">
                                  <td className="py-2">{item.products?.name || '-'}</td>
                                  <td className="text-center py-2">{item.system_quantity}</td>
                                  <td className="text-center py-2">{item.actual_quantity}</td>
                                  <td className="text-center py-2">
                                    <span className={item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : ''}>
                                      {item.difference > 0 ? `+${item.difference}` : item.difference}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
