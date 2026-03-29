'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { Product, Inventory, StockTransfer } from '@/types';

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableInventory, setAvailableInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    inventory_id: '',
    serial_number: '',
    to_location: '',
    notes: '',
  });

  useEffect(() => {
    fetchTransfers();
    fetchProducts();
  }, [search]);

  useEffect(() => {
    if (formData.product_id) {
      fetchAvailableInventory();
    }
  }, [formData.product_id]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/stock-transfers?transfer_no=${encodeURIComponent(search)}` : '/api/stock-transfers';
      const res = await fetch(url);
      const data = await res.json();
      setTransfers(data.data || []);
    } catch (error) {
      console.error('获取转移单列表失败:', error);
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

  const fetchAvailableInventory = async () => {
    try {
      const res = await fetch(`/api/inventory?product_id=${formData.product_id}&status=in_stock`);
      const data = await res.json();
      setAvailableInventory(data.data || []);
    } catch (error) {
      console.error('获取可用库存失败:', error);
    }
  };

  const handleSelectInventory = (item: Inventory) => {
    setFormData({
      ...formData,
      inventory_id: item.id.toString(),
      serial_number: item.serial_number,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(formData.product_id),
          inventory_id: parseInt(formData.inventory_id),
          serial_number: formData.serial_number,
          to_location: formData.to_location,
          notes: formData.notes || null,
        }),
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ product_id: '', inventory_id: '', serial_number: '', to_location: '', notes: '' });
        fetchTransfers();
        alert('转移成功！');
      } else {
        const error = await res.json();
        alert(`转移失败: ${error.error}`);
      }
    } catch (error) {
      console.error('创建转移单失败:', error);
      alert('创建转移单失败');
    }
  };

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">库存转移</h2>
          <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus className="h-5 w-5 mr-2" />新增转移
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="搜索单号..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {loading ? <div className="text-center py-12">加载中...</div> : transfers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border"><p className="text-gray-500">暂无转移单数据</p></div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">转移单号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">序列号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">原位置</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">目标位置</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">转移时间</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transfer.transfer_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.products?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transfer.serial_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transfer.from_location || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.to_location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(transfer.created_at).toLocaleString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">新增转移</h3>
                <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品 *</label>
                  <select required value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value, inventory_id: '', serial_number: '' })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">请选择产品</option>
                    {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                {formData.product_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择库存 *</label>
                    <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">
                      {availableInventory.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-2">暂无在库产品</div>
                      ) : (
                        availableInventory.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectInventory(item)}
                            className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${formData.inventory_id === item.id.toString() ? 'bg-blue-100' : ''}`}
                          >
                            <div className="text-sm font-medium">{item.serial_number}</div>
                            <div className="text-xs text-gray-500">位置: {item.location || '未设置'}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">目标位置 *</label>
                  <input type="text" required value={formData.to_location} onChange={(e) => setFormData({ ...formData, to_location: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">确认转移</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
