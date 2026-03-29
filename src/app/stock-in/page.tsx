'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, X, MapPin } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Product, Supplier, StockInOrder, WarehouseLocation } from '@/types';

export default function StockInPage() {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<StockInOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    supplier_id: '',
    quantity: '',
    unit_price: '',
    location_id: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchSuppliers();
    fetchLocations();
  }, [search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/stock-in?order_no=${encodeURIComponent(search)}` : '/api/stock-in';
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
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
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      setSuppliers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/warehouse-locations');
      const data = await res.json();
      setLocations(data.data || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(formData.product_id),
          supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
          quantity: parseInt(formData.quantity),
          unit_price: formData.unit_price || null,
          location_id: formData.location_id ? parseInt(formData.location_id) : null,
          location: formData.location || null,
          notes: formData.notes || null,
        }),
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ product_id: '', supplier_id: '', quantity: '', unit_price: '', location_id: '', location: '', notes: '' });
        fetchOrders();
        alert(t.stockIn.stockInSuccess);
      } else {
        const error = await res.json();
        alert(`${t.stockIn.stockInFailed}: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert(t.stockIn.stockInFailed);
    }
  };

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t.stockIn.title}</h2>
          <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-5 w-5 mr-2" />{t.stockIn.addStockIn}
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`${t.common.search}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? <div className="text-center py-12">{t.common.loading}</div> : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border"><p className="text-gray-500">{t.common.noData}</p></div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stockIn.orderNo}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stockIn.product}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stockIn.supplier}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stockIn.quantity}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{language === 'zh' ? '位置' : 'Location'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.common.createdAt}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.products?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.suppliers?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity} {order.products?.unit || ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.location ? (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {order.location}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t.stockIn.addStockIn}</h3>
                <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.stockIn.product} *</label>
                  <select required value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">{t.stockIn.selectProduct}</option>
                    {products.map((p) => (<option key={p.id} value={p.id}>{p.name} {p.specification || ''} {p.model || ''}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.stockIn.supplier}</label>
                  <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">{t.stockIn.selectSupplier}</option>
                    {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.stockIn.quantity} *</label>
                  <input type="number" required min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.stockIn.unitPrice}</label>
                  <input type="text" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {language === 'zh' ? '存放位置' : 'Storage Location'}
                  </label>
                  <select 
                    value={formData.location_id} 
                    onChange={(e) => {
                      const selectedLocation = locations.find(l => l.id === parseInt(e.target.value));
                      setFormData({ 
                        ...formData, 
                        location_id: e.target.value,
                        location: selectedLocation?.name || ''
                      });
                    }} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t.common.pleaseSelect}</option>
                    {locations.filter(l => l.is_active).map((l) => (
                      <option key={l.id} value={l.id}>{l.name} {l.code ? `(${l.code})` : ''}</option>
                    ))}
                  </select>
                  {locations.length === 0 && (
                    <p className="text-xs text-orange-500 mt-1">
                      {language === 'zh' ? '暂无仓库位置，请先在「仓库位置」中添加' : 'No warehouse locations, please add in Warehouse Locations first'}
                    </p>
                  )}
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value, location_id: '' })} 
                    placeholder={language === 'zh' ? '或手动输入位置' : 'Or enter location manually'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mt-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.common.notes}</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t.common.cancel}</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {language === 'zh' ? '确认入库' : 'Confirm Stock In'}
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
