'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, MapPin, GripVertical, Package } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { WarehouseLocation } from '@/types';

interface WarehouseLocationWithCount extends WarehouseLocation {
  product_count?: number;
}

export default function WarehouseLocationsPage() {
  const [locations, setLocations] = useState<WarehouseLocationWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WarehouseLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    sort_order: 0,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/warehouse-locations');
      const data = await res.json();
      setLocations(data.data || []);
    } catch (error) {
      console.error('Failed to fetch warehouse locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLocation
        ? `/api/warehouse-locations/${editingLocation.id}`
        : '/api/warehouse-locations';
      const method = editingLocation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        setShowModal(false);
        setEditingLocation(null);
        setFormData({ name: '', code: '', description: '', sort_order: 0 });
        fetchLocations();
        
        // 显示自动生成的编码（如果是新建）
        if (!editingLocation && result.data?.code) {
          alert(`Warehouse location created successfully!\nAuto-generated Code: ${result.data.code}`);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Operation failed:', error);
      alert('Operation failed');
    }
  };

  const handleEdit = (location: WarehouseLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      code: location.code || '',
      description: location.description || '',
      sort_order: location.sort_order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this warehouse location?')) return;

    try {
      const res = await fetch(`/api/warehouse-locations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchLocations();
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
    setEditingLocation(null);
    setFormData({
      name: '',
      code: '', // 留空，让后端自动生成
      description: '',
      sort_order: locations.length,
    });
    setShowModal(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Warehouse Locations</h1>
            <p className="text-sm text-gray-500 mt-1">Manage warehouse storage locations</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Location
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Locations</p>
                <p className="text-2xl font-semibold">{locations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Package className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Locations</p>
                <p className="text-2xl font-semibold">
                  {locations.filter(l => l.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Package className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Products Stored</p>
                <p className="text-2xl font-semibold">
                  {locations.reduce((sum, l) => sum + (l.product_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Locations List */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No warehouse locations yet</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Add your first location
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sort</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="font-medium text-gray-900">{location.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-mono rounded">
                        {location.code || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {location.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                        <Package className="h-3 w-3 mr-1" />
                        {location.product_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {location.sort_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        location.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {location.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEdit(location)}
                        className="text-blue-600 hover:text-blue-700 mr-3"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="text-red-600 hover:text-red-700"
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

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingLocation ? 'Edit Warehouse Location' : 'Add Warehouse Location'}
              </h2>
              {!editingLocation && (
                <p className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded mb-4">
                  💡 The location code will be auto-generated (e.g., WH0001)
                </p>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., Zone A - Shelf 1 - Level 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="Auto-generated if empty"
                    disabled={!editingLocation}
                  />
                  {!editingLocation && (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to auto-generate (WH0001, WH0002, ...)
                    </p>
                  )}
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
                    placeholder="Location details"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingLocation(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingLocation ? 'Save' : 'Add'}
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
