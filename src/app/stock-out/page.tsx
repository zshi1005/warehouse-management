'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, X, Calendar, Tag, User, Trash2, Package } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { Product, Customer, StockOutOrder, StockOutCategory, StockOutOrderItemInsert } from '@/types';

interface OrderItem {
  product_id: number;
  quantity: number;
  serial_numbers: string[];
  serial_input: string;
}

export default function StockOutPage() {
  const [orders, setOrders] = useState<StockOutOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<StockOutCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    category_id: '',
    out_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchCustomers();
    fetchCategories();
  }, [search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/stock-out?order_no=${encodeURIComponent(search)}` : '/api/stock-out';
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.data || []);
    } catch (error) {
      console.error('获取出库单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?with_stats=true');
      const data = await res.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('获取产品列表失败:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.data || []);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/stock-out-categories');
      const data = await res.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error('获取出库类别列表失败:', error);
    }
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, {
      product_id: 0,
      quantity: 1,
      serial_numbers: [],
      serial_input: '',
    }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // 如果选择产品，自动设置数量为1
    if (field === 'product_id' && value) {
      updated[index].quantity = 1;
      updated[index].serial_numbers = [];
      updated[index].serial_input = '';
    }
    
    setOrderItems(updated);
  };

  const addSerialToItem = (index: number) => {
    const item = orderItems[index];
    if (item.serial_input && !item.serial_numbers.includes(item.serial_input)) {
      const updated = [...orderItems];
      updated[index].serial_numbers = [...item.serial_numbers, item.serial_input];
      updated[index].serial_input = '';
      updated[index].quantity = updated[index].serial_numbers.length || 1;
      setOrderItems(updated);
    }
  };

  const removeSerialFromItem = (index: number, serial: string) => {
    const updated = [...orderItems];
    updated[index].serial_numbers = updated[index].serial_numbers.filter(s => s !== serial);
    updated[index].quantity = updated[index].serial_numbers.length || 1;
    setOrderItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证
    if (orderItems.length === 0) {
      alert('请添加至少一个出库产品');
      return;
    }

    for (const item of orderItems) {
      if (!item.product_id) {
        alert('请选择所有产品');
        return;
      }
    }
    
    try {
      const items: StockOutOrderItemInsert[] = orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        serial_numbers: item.serial_numbers,
      }));

      const res = await fetch('/api/stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          out_date: formData.out_date || null,
          notes: formData.notes || null,
          items,
        }),
      });
      
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchOrders();
        alert('出库成功！');
      } else {
        const error = await res.json();
        alert(`出库失败: ${error.error}`);
      }
    } catch (error) {
      console.error('创建出库单失败:', error);
      alert('创建出库单失败');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      category_id: '',
      out_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setOrderItems([]);
  };

  const getCategoryBadge = (categoryId: number | null) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return <span className="text-gray-400">-</span>;
    
    const colorMap: Record<string, string> = {
      '销售': 'bg-green-100 text-green-700',
      '内部': 'bg-blue-100 text-blue-700',
      '赠送': 'bg-purple-100 text-purple-700',
    };
    
    const className = colorMap[category.name] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
        {category.name}
      </span>
    );
  };

  const getProductById = (productId: number) => {
    return products.find(p => p.id === productId);
  };

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">出库管理</h2>
          <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Plus className="h-5 w-5 mr-2" />新增出库
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="搜索单号..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {loading ? <div className="text-center py-12">加载中...</div> : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border"><p className="text-gray-500">暂无出库单数据</p></div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">出库单号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">出库类别</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品明细</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">总数量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">出货日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customers ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          {order.customers.name}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getCategoryBadge(order.category_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center">
                            <Package className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{item.products?.name || '-'}</span>
                            <span className="ml-2 font-semibold text-blue-600">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="text-lg font-bold text-gray-900">{order.total_quantity}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.out_date ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {order.out_date}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 新增出库弹窗 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">新增出库</h3>
                <button onClick={() => { setShowModal(false); resetForm(); }}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="h-4 w-4 inline mr-1" />客户
                    </label>
                    <select 
                      value={formData.customer_id} 
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择客户</option>
                      {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Tag className="h-4 w-4 inline mr-1" />出库类别
                    </label>
                    <select 
                      value={formData.category_id} 
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择类别</option>
                      {categories.filter(c => c.is_active).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />出货日期
                    </label>
                    <input 
                      type="date" 
                      value={formData.out_date} 
                      onChange={(e) => setFormData({ ...formData, out_date: e.target.value })} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>

                {/* 出库产品列表 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">出库产品</label>
                    <button
                      type="button"
                      onClick={addOrderItem}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />添加产品
                    </button>
                  </div>

                  {orderItems.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                      请点击"添加产品"按钮添加出库产品
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderItems.map((item, index) => {
                        const selectedProduct = getProductById(item.product_id);
                        const stats = (selectedProduct as any)?.stats;
                        
                        return (
                          <div key={index} className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">产品</label>
                                  <select
                                    value={item.product_id}
                                    onChange={(e) => updateOrderItem(index, 'product_id', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">选择产品</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} {p.specification || ''} {p.model || ''} (库存: {(p as any).stats?.in_stock || 0})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">出库数量</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeOrderItem(index)}
                                className="ml-2 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>

                            {/* 序列号输入 */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                序列号（可选，手动填写，每行一个或用逗号分隔）
                              </label>
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="text"
                                  value={item.serial_input}
                                  onChange={(e) => updateOrderItem(index, 'serial_input', e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addSerialToItem(index);
                                    }
                                  }}
                                  placeholder="输入序列号后按回车添加"
                                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => addSerialToItem(index)}
                                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
                                >
                                  添加
                                </button>
                              </div>
                              
                              {/* 已添加的序列号 */}
                              {item.serial_numbers.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
                                  {item.serial_numbers.map((serial, sIdx) => (
                                    <span key={sIdx} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                      {serial}
                                      <button
                                        type="button"
                                        onClick={() => removeSerialFromItem(index, serial)}
                                        className="ml-1 text-blue-700 hover:text-blue-900"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                  <span className="text-xs text-gray-500 self-center ml-2">
                                    共 {item.serial_numbers.length} 个序列号
                                  </span>
                                </div>
                              )}

                              {selectedProduct && stats && (
                                <p className="text-xs text-gray-500 mt-1">
                                  当前库存: {stats.in_stock} {selectedProduct.unit}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 备注 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea 
                    value={formData.notes} 
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                    rows={2} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                {/* 汇总信息 */}
                {orderItems.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">出库产品数:</span>
                      <span className="font-semibold">{orderItems.length} 种</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">总出库数量:</span>
                      <span className="font-bold text-blue-600 text-lg">
                        {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => { setShowModal(false); resetForm(); }} 
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    确认出库
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
