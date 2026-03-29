'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Customer, CustomerInsert } from '@/types';

export default function CustomersPage() {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerInsert>({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/customers?search=${encodeURIComponent(search)}` : '/api/customers';
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({ name: '', contact: '', phone: '', email: '', address: '', notes: '', is_active: true });
        fetchCustomers();
      }
    } catch (error) {
      console.error('Failed to save customer:', error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contact: customer.contact || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
      is_active: customer.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.customers.deleteConfirm)) return;
    
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t.customers.title}</h2>
          <button onClick={() => { setEditingCustomer(null); setFormData({ name: '', contact: '', phone: '', email: '', address: '', notes: '', is_active: true }); setShowModal(true); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-5 w-5 mr-2" />{t.customers.addCustomer}
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder={`${t.common.search}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {loading ? <div className="text-center py-12">{t.common.loading}</div> : customers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border"><p className="text-gray-500">{t.common.noData}</p></div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.customers.customerName}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.customers.contact}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.customers.phone}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.customers.email}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.customers.address}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.contact || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{customer.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit2 className="h-4 w-4 inline" /></button>
                      <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4 inline" /></button>
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
                <h3 className="text-lg font-semibold">{editingCustomer ? t.customers.editCustomer : t.customers.addCustomer}</h3>
                <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.customers.customerName} *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.customers.contact}</label>
                  <input type="text" value={formData.contact || ''} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.customers.phone}</label>
                  <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.customers.email}</label>
                  <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.customers.address}</label>
                  <textarea value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t.common.cancel}</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingCustomer ? t.common.save : t.common.add}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
