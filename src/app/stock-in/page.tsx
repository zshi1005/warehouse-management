'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, X, MapPin, Trash2, FileText, Calendar, User } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Product, Supplier, StockInOrder, WarehouseLocation, StockInOrderItemInsert } from '@/types';

interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: string;
  location_id: number | null;
  location: string;
  serial_numbers: string[];
  serial_input: string;
  notes: string;
}

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
    invoice_no: '',
    supplier_id: '',
    in_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

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

  const addOrderItem = () => {
    setOrderItems([...orderItems, {
      product_id: 0,
      quantity: 1,
      unit_price: '',
      location_id: null,
      location: '',
      serial_numbers: [],
      serial_input: '',
      notes: '',
    }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
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
    
    if (orderItems.length === 0) {
      alert(t.stockIn.pleaseAddProduct);
      return;
    }

    for (const item of orderItems) {
      if (!item.product_id) {
        alert(t.stockIn.pleaseSelectProduct);
        return;
      }
    }
    
    try {
      const items: StockInOrderItemInsert[] = orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price || undefined,
        amount: item.unit_price ? (parseFloat(item.unit_price) * item.quantity).toString() : undefined,
        location_id: item.location_id || undefined,
        location: item.location || undefined,
        serial_numbers: item.serial_numbers,
        notes: item.notes || undefined,
      }));

      const res = await fetch('/api/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_no: formData.invoice_no || null,
          supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
          in_date: formData.in_date || null,
          notes: formData.notes || null,
          items,
        }),
      });
      
      if (res.ok) {
        setShowModal(false);
        resetForm();
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

  const resetForm = () => {
    setFormData({
      invoice_no: '',
      supplier_id: '',
      in_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setOrderItems([]);
  };

  const handleDeleteOrder = async (orderId: number, orderNo: string) => {
    if (!confirm(`${language === 'zh' ? '确定要删除入库单' : 'Are you sure you want to delete stock in order'} "${orderNo}"?\n${language === 'zh' ? '相关的库存记录也会被删除（仅限未出库的产品）' : 'Related inventory records will also be deleted (only in-stock items)'}`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/stock-in/${orderId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchOrders();
        alert(language === 'zh' ? '删除成功' : 'Deleted successfully');
      } else {
        const error = await res.json();
        alert(`${language === 'zh' ? '删除失败' : 'Delete failed'}: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert(language === 'zh' ? '删除失败' : 'Delete failed');
    }
  };

  const getProductById = (productId: number) => {
    return products.find(p => p.id === productId);
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stockIn.invoiceNo}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stockIn.supplier}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stockIn.productDetails}</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t.stockIn.totalQuantity}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.stockIn.inDate}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.common.createdAt}</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.invoice_no ? (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1 text-gray-400" />
                          {order.invoice_no}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.suppliers ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          {order.suppliers.name}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center">
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
                      {order.in_date ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {order.in_date}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDeleteOrder(order.id, order.order_no)}
                        className="text-red-600 hover:text-red-700"
                        title={t.common.delete}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t.stockIn.addStockIn}</h3>
                <button onClick={() => { setShowModal(false); resetForm(); }}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FileText className="h-4 w-4 inline mr-1" />{t.stockIn.invoiceNo}
                    </label>
                    <input type="text" value={formData.invoice_no} onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })} placeholder={language === 'zh' ? '同一发票产品将一起入库' : 'Products with same invoice will be stocked in together'} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="h-4 w-4 inline mr-1" />{t.stockIn.supplier}
                    </label>
                    <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">{t.stockIn.selectSupplier}</option>
                      {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />{t.stockIn.inDate}
                    </label>
                    <input type="date" value={formData.in_date} onChange={(e) => setFormData({ ...formData, in_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.common.notes}</label>
                    <input type="text" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {/* 产品列表 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">{t.stockIn.product}</label>
                    <button type="button" onClick={addOrderItem} className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" />{t.stockIn.addProduct}
                    </button>
                  </div>

                  {orderItems.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                      {t.stockIn.pleaseAddProduct}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderItems.map((item, index) => {
                        const selectedProduct = getProductById(item.product_id);
                        
                        return (
                          <div key={index} className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">{t.stockIn.product}</label>
                                  <select value={item.product_id} onChange={(e) => updateOrderItem(index, 'product_id', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">{t.stockIn.selectProduct}</option>
                                    {products.map((p) => (<option key={p.id} value={p.id}>{p.name} {p.specification || ''}</option>))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">{t.stockIn.quantity}</label>
                                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">{t.stockIn.unitPrice}</label>
                                  <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateOrderItem(index, 'unit_price', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">{t.stockIn.amount}</label>
                                  <input type="text" value={item.unit_price ? (parseFloat(item.unit_price) * item.quantity).toFixed(2) : ''} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
                                </div>
                              </div>
                              <button type="button" onClick={() => removeOrderItem(index)} className="ml-2 text-red-600 hover:text-red-700">
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>

                            {/* 位置选择 */}
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  <MapPin className="h-3 w-3 inline mr-1" />{language === 'zh' ? '存放位置' : 'Location'}
                                </label>
                                <select value={item.location_id || ''} onChange={(e) => {
                                  const selectedLocation = locations.find(l => l.id === parseInt(e.target.value));
                                  updateOrderItem(index, 'location_id', selectedLocation?.id || null);
                                  updateOrderItem(index, 'location', selectedLocation?.name || '');
                                }} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                                  <option value="">{t.common.pleaseSelect}</option>
                                  {locations.filter(l => l.is_active).map((l) => (<option key={l.id} value={l.id}>{l.name} {l.code ? `(${l.code})` : ''}</option>))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">{t.common.notes}</label>
                                <input type="text" value={item.notes} onChange={(e) => updateOrderItem(index, 'notes', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                              </div>
                            </div>

                            {/* 序列号 */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">{t.stockIn.serialOptional || t.stockIn.serialNumbers}</label>
                              <div className="flex gap-2 mb-2">
                                <input type="text" value={item.serial_input} onChange={(e) => updateOrderItem(index, 'serial_input', e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSerialToItem(index); } }} placeholder={language === 'zh' ? '输入序列号后按回车添加' : 'Press Enter to add'} className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                <button type="button" onClick={() => addSerialToItem(index)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm">{t.common.add}</button>
                              </div>
                              {item.serial_numbers.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
                                  {item.serial_numbers.map((serial, sIdx) => (
                                    <span key={sIdx} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                      {serial}
                                      <button type="button" onClick={() => removeSerialFromItem(index, serial)} className="ml-1 text-blue-700 hover:text-blue-900">×</button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 汇总 */}
                {orderItems.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t.stockIn.totalQuantity}:</span>
                      <span className="font-bold text-blue-600 text-lg">{orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">{t.stockIn.totalAmount}:</span>
                      <span className="font-bold text-blue-600 text-lg">
                        {orderItems.reduce((sum, item) => sum + (parseFloat(item.unit_price) || 0) * item.quantity, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t.common.cancel}</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.stockIn.confirmStockIn}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
