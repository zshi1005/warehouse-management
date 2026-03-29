'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Building2, Phone, User, MapPin } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { ConstructionSite } from '@/types';

export default function ConstructionSitesPage() {
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<ConstructionSite | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    contact_person: '',
    contact_phone: '',
    description: '',
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/construction-sites');
      const data = await res.json();
      setSites(data.data || []);
    } catch (error) {
      console.error('Failed to fetch construction sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSite
        ? `/api/construction-sites/${editingSite.id}`
        : '/api/construction-sites';
      const method = editingSite ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingSite(null);
        setFormData({
          name: '',
          code: '',
          address: '',
          contact_person: '',
          contact_phone: '',
          description: '',
        });
        fetchSites();
      } else {
        const data = await res.json();
        alert(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Operation failed:', error);
      alert('Operation failed');
    }
  };

  const handleEdit = (site: ConstructionSite) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      code: site.code || '',
      address: site.address || '',
      contact_person: site.contact_person || '',
      contact_phone: site.contact_phone || '',
      description: site.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this construction site?')) return;

    try {
      const res = await fetch(`/api/construction-sites/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchSites();
      } else {
        const data = await res.json();
        alert(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed');
    }
  };

  const openAddModal = () => {
    setEditingSite(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      contact_person: '',
      contact_phone: '',
      description: '',
    });
    setShowModal(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Construction Sites</h1>
            <p className="text-sm text-gray-500 mt-1">Manage construction sites for equipment transfers</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Site
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Sites</p>
                <p className="text-2xl font-semibold">{sites.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Sites</p>
                <p className="text-2xl font-semibold">
                  {sites.filter(s => s.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sites List */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No construction sites yet</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Add your first site
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((site) => (
              <div key={site.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <Building2 className="h-8 w-8 text-blue-500" />
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{site.name}</h3>
                        {site.code && (
                          <span className="text-xs text-gray-500 font-mono">{site.code}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      site.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {site.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    {site.address && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{site.address}</span>
                      </div>
                    )}
                    {site.contact_person && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{site.contact_person}</span>
                      </div>
                    )}
                    {site.contact_phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{site.contact_phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {site.description && (
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">{site.description}</p>
                  )}
                </div>
                
                <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(site)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingSite ? 'Edit Construction Site' : 'Add Construction Site'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., Downtown Office Building"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SITE-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Site address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phone"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSite(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingSite ? 'Save' : 'Add'}
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
