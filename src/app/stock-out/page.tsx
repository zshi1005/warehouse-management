'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, X, Calendar, Tag, User } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { Product, Customer, StockOutOrder, Inventory, StockOutCategory } from '@/types';

export default function StockOutPage() {
  const [orders, setOrders] = useState<StockOutOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<StockOutCategory[]>([]);
  const [availableInventory, setAvailableInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    customer_id: '',
    category_id: '',
    out_date: new Date().toISOString().split('T')[0],
    serial_numbers: [] as string[],
    location: '',
    notes: '',
  });
  const [serialInput, setSerialInput] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchCustomers();
    fetchCategories();
  }, [search]);

  useEffect(() => {
    if (formData.product_id) {
      fetchAvailableInventory();
    }
  }, [formData.product_id]);

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
      const res = await fetch('/api/products');
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

  const fetchAvailableInventory = async () => {
    try {
      const res = await fetch(`/api/inventory?product_id=${formData.product_id}&status=in_stock`);
      const data = await res.json();
      setAvailableInventory(data.data || []);
    } catch (error) {
      console.error('获取可用库存失败:', error);
    }
  };

  const handleAddSerial = () => {
    if (serialInput && !formData.serial_numbers.includes(serialInput)) {
      const exists = availableInventory.find(item => item.serial_number === serialInput);
      if (exists) {
        setFormData({ ...formData, serial_numbers: [...formData.serial_numbers, serialInput] });
        setSerialInput('');
      } else {
        alert('该序列号不存在或不在库');
      }
    }
  };

  const handleRemoveSerial = (serial: string) => {
    setFormData({ ...formData, serial_numbers: formData.serial_numbers.filter(s => s !== serial) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.serial_numbers.length === 0) {
      alert('请至少添加一个序列号');
      return;
    }
    
    try {
      const res = await fetch('/api/stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(formData.product_id),
          customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          out_date: formData.out_date || null,
          quantity: formData.serial_numbers.length,
          serial_numbers: formData.serial_numbers,
          location: formData.location || null,
          notes: formData.notes || null,
        }),
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ 
          product_id: '', 
          customer_id: '', 
          category_id: '', 
          out_date: new Date().toISOString().split('T')[0],
          serial_numbers: [], 
          location: '', 
          notes: '' 
        });
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">出库类别</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">出货日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">序列号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.products?.name || '-'}</td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.out_date ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {order.out_date}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{order.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{order.serial_numbers?.join(', ') || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">新增出库</h3>
                <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品 *</label>
                  <select required value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value, serial_numbers: [] })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">请选择产品</option>
                    {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="h-4 w-4 inline mr-1" />
                    客户
                  </label>
                  <select value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">请选择客户</option>
                    {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="h-4 w-4 inline mr-1" />
                    出库类别
                  </label>
                  <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">请选择类别</option>
                    {categories.filter(c => c.is_active).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-orange-500 mt-1">暂无出库类别，请先在「出库类别管理」中添加</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    出货日期
                  </label>
                  <input 
                    type="date" 
                    value={formData.out_date} 
                    onChange={(e) => setFormData({ ...formData, out_date: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                {formData.product_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">序列号 *</label>
                    <div className="flex space-x-2 mb-2">
                      <input type="text" value={serialInput} onChange={(e) => setSerialInput(e.target.value)} placeholder="输入序列号" className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={handleAddSerial} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">添加</button>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">在库序列号: {availableInventory.map(i => i.serial_number).join(', ') || '无'}</div>
                    <div className="flex flex-wrap gap-2">
                      {formData.serial_numbers.map((serial) => (
                        <span key={serial} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {serial}
                          <button type="button" onClick={() => handleRemoveSerial(serial)} className="ml-1 text-blue-700 hover:text-blue-900">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">确认出库</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
