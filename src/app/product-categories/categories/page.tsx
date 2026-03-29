'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Folder, ChevronRight, ChevronDown, Package } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import type { ProductCategory } from '@/types';

interface CategoryWithCount extends ProductCategory {
  product_count?: number;
  children?: CategoryWithCount[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parent_id: '',
    sort_order: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/product-categories');
      const data = await res.json();
      
      // 构建树形结构
      const flatCategories: CategoryWithCount[] = data.data || [];
      const rootCategories = buildTree(flatCategories);
      setCategories(rootCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (flatList: CategoryWithCount[]): CategoryWithCount[] => {
    const map = new Map<number, CategoryWithCount>();
    const roots: CategoryWithCount[] = [];

    // 先创建映射
    flatList.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });

    // 构建树
    flatList.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parent_id && map.has(item.parent_id)) {
        const parent = map.get(item.parent_id)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `/api/product-categories/${editingCategory.id}`
        : '/api/product-categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();

      if (res.ok) {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: '', code: '', parent_id: '', sort_order: 0 });
        fetchCategories();
      } else {
        alert(result.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Operation failed:', error);
      alert('Operation failed');
    }
  };

  const handleEdit = (category: CategoryWithCount) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code || '',
      parent_id: category.parent_id?.toString() || '',
      sort_order: category.sort_order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const res = await fetch(`/api/product-categories/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed');
    }
  };

  const openAddModal = (parentId?: number) => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      parent_id: parentId?.toString() || '',
      sort_order: 0,
    });
    setShowModal(true);
  };

  const getLevelClass = (level: number) => {
    switch (level) {
      case 1: return 'font-semibold text-gray-900';
      case 2: return 'font-medium text-gray-700 pl-6';
      case 3: return 'text-gray-600 pl-12';
      default: return '';
    }
  };

  const getLevelBadge = (level: number) => {
    const colors = {
      1: 'bg-blue-100 text-blue-700',
      2: 'bg-green-100 text-green-700',
      3: 'bg-purple-100 text-purple-700',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const renderCategory = (category: CategoryWithCount, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id}>
        <div 
          className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 border-b border-gray-100 ${depth > 0 ? 'bg-gray-50/50' : ''}`}
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <div className="flex items-center space-x-3">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            <Folder className={`h-5 w-5 ${category.level === 1 ? 'text-blue-500' : category.level === 2 ? 'text-green-500' : 'text-purple-500'}`} />
            
            <div>
              <span className={getLevelClass(category.level)}>{category.name}</span>
              {category.code && (
                <span className="ml-2 text-xs text-gray-400 font-mono">({category.code})</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getLevelBadge(category.level)}`}>
              Level {category.level}
            </span>
            
            <span className="inline-flex items-center text-sm text-gray-500">
              <Package className="h-4 w-4 mr-1" />
              {category.product_count || 0}
            </span>
            
            <div className="flex items-center space-x-2">
              {category.level < 3 && (
                <button
                  onClick={() => openAddModal(category.id)}
                  className="text-green-600 hover:text-green-700 text-sm"
                  title="Add sub-category"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleEdit(category)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get all categories for parent selection (exclude current and its descendants if editing)
  const getParentOptions = () => {
    const options: { id: number | null; name: string; level: number }[] = [];
    
    const addOptions = (cats: CategoryWithCount[], prefix: string = '', excludeId?: number) => {
      cats.forEach(cat => {
        if (cat.id !== excludeId) {
          options.push({ id: cat.id, name: prefix + cat.name, level: cat.level });
          if (cat.children && cat.children.length > 0) {
            addOptions(cat.children, prefix + '  ', excludeId);
          }
        }
      });
    };
    
    addOptions(categories, '', editingCategory?.id);
    return options;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Categories</h1>
            <p className="text-sm text-gray-500 mt-1">Manage product categories (up to 3 levels)</p>
          </div>
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Category
          </button>
        </div>

        {/* Level Legend */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            <span className="text-gray-600">Level 1 (Main Category)</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            <span className="text-gray-600">Level 2 (Sub Category)</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
            <span className="text-gray-600">Level 3 (Leaf Category)</span>
          </div>
        </div>

        {/* Category Tree */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No categories yet</p>
            <button
              onClick={() => openAddModal()}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Add your first category
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Category Name</span>
              <span className="text-sm font-medium text-gray-700">Actions</span>
            </div>
            <div>
              {categories.map(category => renderCategory(category))}
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., Electronics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ELEC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">None (Top Level)</option>
                    {getParentOptions()
                      .filter(opt => opt.level < 3 || opt.id === parseInt(formData.parent_id))
                      .map(opt => (
                        <option key={opt.id!} value={opt.id!}>
                          {opt.name} (Level {opt.level})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a parent to create a sub-category (max 3 levels)
                  </p>
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
                      setEditingCategory(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCategory ? 'Save' : 'Add'}
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
