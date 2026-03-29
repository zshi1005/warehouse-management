'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Supplier, SupplierInsert } from '@/types';

export default function SuppliersPage() {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierInsert>({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/suppliers?search=${encodeURIComponent(search)}` : '/api/suppliers';
      const res = await fetch(url);
      const data = await res.json();
      setSuppliers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setShowModal(false);
        setEditingSupplier(null);
        setFormData({
          name: '',
          contact: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
          is_active: true,
        });
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Failed to save supplier:', error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.suppliers.deleteConfirm)) return;
    
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Failed to delete supplier:', error);
    }
  };

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t.suppliers.title}</h2>
          <button
            onClick={() => { setEditingSupplier(null); setFormData({ name: '', contact: '', phone: '', email: '', address: '', notes: '', is_active: true }); setShowModal(true); }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t.suppliers.addSupplier}
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

        {loading ? (
          <div className="text-center py-12">{t.common.loading}</div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">{t.common.noData}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.suppliers.supplierName}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.suppliers.contact}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.suppliers.phone}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.suppliers.email}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.suppliers.address}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.contact || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{supplier.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => handleEdit(supplier)} className="text-blue-600 hover:text-blue-900 mr-4">
                        <Edit2 className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(supplier.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
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
                <h3 className="text-lg font-semibold">{editingSupplier ? t.suppliers.editSupplier : t.suppliers.addSupplier}</h3>
                <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.suppliers.supplierName} *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.suppliers.contact}</label>
                  <input type="text" value={formData.contact || ''} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.suppliers.phone}</label>
                  <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.suppliers.email}</label>
                  <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.suppliers.address}</label>
                  <textarea value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.common.notes}</label>
                  <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t.common.cancel}</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingSupplier ? t.common.save : t.common.add}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
