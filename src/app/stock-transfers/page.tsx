'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, X, ArrowRight, Building2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { Product, Inventory, StockTransfer, ConstructionSite } from '@/types';

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [outOfStockInventory, setOutOfStockInventory] = useState<Inventory[]>([]);
  const [constructionSites, setConstructionSites] = useState<ConstructionSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    inventory_id: '',
    serial_number: '',
    from_site_id: '',
    to_site_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchTransfers();
    fetchProducts();
    fetchConstructionSites();
  }, []);

  useEffect(() => {
    if (formData.product_id) {
      fetchOutOfStockInventory();
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
      console.error('Failed to fetch transfers:', error);
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

  const fetchConstructionSites = async () => {
    try {
      const res = await fetch('/api/construction-sites');
      const data = await res.json();
      setConstructionSites(data.data || []);
    } catch (error) {
      console.error('Failed to fetch construction sites:', error);
    }
  };

  const fetchOutOfStockInventory = async () => {
    try {
      // 获取已出库的设备（状态为 out_of_stock）
      const res = await fetch(`/api/inventory?product_id=${formData.product_id}&status=out_of_stock`);
      const data = await res.json();
      setOutOfStockInventory(data.data || []);
    } catch (error) {
      console.error('Failed to fetch out-of-stock inventory:', error);
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
    
    if (!formData.to_site_id) {
      alert('Please select target construction site');
      return;
    }
    
    try {
      const res = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(formData.product_id),
          inventory_id: parseInt(formData.inventory_id),
          serial_number: formData.serial_number,
          from_site_id: formData.from_site_id ? parseInt(formData.from_site_id) : null,
          to_site_id: parseInt(formData.to_site_id),
          notes: formData.notes || null,
        }),
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({
          product_id: '',
          inventory_id: '',
          serial_number: '',
          from_site_id: '',
          to_site_id: '',
          notes: '',
        });
        fetchTransfers();
        alert('Transfer successful!');
      } else {
        const error = await res.json();
        alert(`Transfer failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create transfer:', error);
      alert('Failed to create transfer');
    }
  };

  const getSiteName = (siteId: number | null, sites: ConstructionSite[]) => {
    if (!siteId) return '-';
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : '-';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipment Transfer</h1>
            <p className="text-sm text-gray-500 mt-1">Transfer equipment from one construction site to another</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Transfer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <ArrowRight className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Transfers</p>
                <p className="text-2xl font-semibold">{transfers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Sites</p>
                <p className="text-2xl font-semibold">
                  {constructionSites.filter(s => s.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by transfer number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTransfers()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Transfers List */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <ArrowRight className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No transfer records yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-purple-600 hover:text-purple-700"
            >
              Create your first transfer
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transfer.transfer_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transfer.products?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {transfer.serial_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transfer.from_site?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {transfer.to_site?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transfer.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Transfer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">New Equipment Transfer</h3>
                <button onClick={() => setShowModal(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  💡 Select equipment that has been checked out (Internal Use) for transfer between construction sites.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    required
                    value={formData.product_id}
                    onChange={(e) => setFormData({
                      ...formData,
                      product_id: e.target.value,
                      inventory_id: '',
                      serial_number: '',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {formData.product_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Equipment (Out of Stock) *
                    </label>
                    <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto">
                      {outOfStockInventory.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">
                          No checked-out equipment available for this product.
                          <br />
                          <span className="text-xs">Equipment must be checked out first before transfer.</span>
                        </div>
                      ) : (
                        outOfStockInventory.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectInventory(item)}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                              formData.inventory_id === item.id.toString()
                                ? 'bg-purple-100 border border-purple-300'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{item.serial_number}</div>
                              {formData.inventory_id === item.id.toString() && (
                                <span className="text-xs text-purple-600">Selected</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Status: {item.status === 'out_of_stock' ? 'Checked Out' : item.status}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Site (Optional)
                    </label>
                    <select
                      value={formData.from_site_id}
                      onChange={(e) => setFormData({ ...formData, from_site_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select source site</option>
                      {constructionSites.filter(s => s.is_active).map((site) => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Site *
                    </label>
                    <select
                      required
                      value={formData.to_site_id}
                      onChange={(e) => setFormData({ ...formData, to_site_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select target site</option>
                      {constructionSites.filter(s => s.is_active).map((site) => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {constructionSites.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-700">
                      ⚠️ No construction sites configured. Please add sites first.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Optional notes"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.inventory_id || !formData.to_site_id}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Transfer
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
