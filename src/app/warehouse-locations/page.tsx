'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, MapPin, GripVertical } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { WarehouseLocation } from '@/types';

export default function WarehouseLocationsPage() {
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
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
      console.error('获取仓库位置失败:', error);
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
        setShowModal(false);
        setEditingLocation(null);
        setFormData({ name: '', code: '', description: '', sort_order: 0 });
        fetchLocations();
      } else {
        const data = await res.json();
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败');
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
    if (!confirm('确定要删除这个仓库位置吗？')) return;

    try {
      const res = await fetch(`/api/warehouse-locations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchLocations();
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const openAddModal = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      code: '',
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
            <h1 className="text-2xl font-bold text-gray-900">仓库位置管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理存放位置，可自定义添加</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            添加位置
          </button>
        </div>

        {/* 位置列表 */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">暂无仓库位置</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              添加第一个位置
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">位置名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">位置编码</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">排序</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {location.code || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {location.description || '-'}
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
                        {location.is_active ? '启用' : '禁用'}
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

        {/* 添加/编辑弹窗 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingLocation ? '编辑仓库位置' : '添加仓库位置'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    位置名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="如：A区货架1层"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    位置编码
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="如：A-01-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="位置详细描述"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序
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
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingLocation ? '保存' : '添加'}
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
