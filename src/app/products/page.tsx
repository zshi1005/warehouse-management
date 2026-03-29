'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Upload, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Product, ProductInsert, ProductCategory, Brand } from '@/types';

export default function ProductsPage() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProductInsert>({
    name: '',
    category_id: undefined,
    brand_id: undefined,
    specification: '',
    model: '',
    unit: language === 'zh' ? '个' : 'pcs',
    description: '',
    image_key: '',
    warning_threshold: 10,
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, [search, categoryFilter, brandFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category_id', categoryFilter);
      if (brandFilter) params.append('brand_id', brandFilter);
      params.append('with_stats', 'true');
      
      const url = params.toString() ? `/api/products?${params.toString()}` : '/api/products?with_stats=true';
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/product-categories');
      const data = await res.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      setBrands(data.data || []);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(language === 'zh' ? '只支持 JPG、PNG、GIF、WEBP 格式的图片' : 'Only JPG, PNG, GIF, WEBP formats are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'zh' ? '图片大小不能超过 5MB' : 'Image size cannot exceed 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploadingImage(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.data) {
        setFormData({ ...formData, image_key: data.data.key });
      } else {
        alert(`${language === 'zh' ? '上传图片失败' : 'Failed to upload image'}: ${data.error || ''}`);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert(language === 'zh' ? '上传图片失败' : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        image_key: formData.image_key || null,
        warning_threshold: formData.warning_threshold || 10,
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      
      if (res.ok) {
        setShowModal(false);
        setEditingProduct(null);
        setImagePreview(null);
        setFormData({
          name: '',
          category_id: undefined,
          brand_id: undefined,
          specification: '',
          model: '',
          unit: language === 'zh' ? '个' : 'pcs',
          description: '',
          image_key: '',
          warning_threshold: 10,
          is_active: true,
        });
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id || undefined,
      brand_id: product.brand_id || undefined,
      specification: product.specification || '',
      model: product.model || '',
      unit: product.unit,
      description: product.description || '',
      image_key: product.image_key || '',
      warning_threshold: product.warning_threshold || 10,
      is_active: product.is_active,
    });
    setImagePreview(product.image_url || null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.products.deleteConfirm)) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setImagePreview(null);
    setFormData({
      name: '',
      category_id: undefined,
      brand_id: undefined,
      specification: '',
      model: '',
      unit: language === 'zh' ? '个' : 'pcs',
      description: '',
      image_key: '',
      warning_threshold: 10,
      is_active: true,
    });
    setShowModal(true);
  };

  const isLowStock = (product: Product) => {
    const stats = (product as any).stats;
    if (!stats) return false;
    return stats.in_stock <= product.warning_threshold && stats.in_stock > 0;
  };

  const isOutOfStock = (product: Product) => {
    const stats = (product as any).stats;
    if (!stats) return false;
    return stats.in_stock === 0;
  };

  const getBrandName = (brandId: number | null) => {
    if (!brandId) return '-';
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || '-';
  };

  return (
    <MainLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t.products.title}</h2>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t.products.addProduct}
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`${t.common.search}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t.common.all}{t.nav.categories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t.common.all}{t.products.brand}</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">{t.common.loading}</div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">{t.common.noData}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.products.productName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.products.brand}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.nav.categories}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.products.specification}/{t.products.model}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'zh' ? '库存状态' : 'Stock Status'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.common.status}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.common.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const stats = (product as any).stats;
                  const lowStock = isLowStock(product);
                  const outOfStock = isOutOfStock(product);
                  
                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 ${outOfStock ? 'bg-red-50' : lowStock ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0 mr-3 rounded-lg overflow-hidden bg-gray-100 border">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="h-12 w-12 object-cover" />
                            ) : (
                              <div className="h-12 w-12 flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.brands ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700">
                            {product.brands.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.product_categories ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                            {product.product_categories.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{product.specification || '-'}</div>
                        <div className="text-xs text-gray-400">{product.model || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {stats ? (
                          <div className="text-sm">
                            <div className="flex items-center justify-center gap-3">
                              <span className="text-green-600 font-semibold">
                                {t.dashboard.inStock}: {stats.in_stock}
                              </span>
                              <span className="text-orange-600">
                                {t.dashboard.outOfStock}: {stats.out_of_stock}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {t.products.unit}: {product.unit}
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {product.is_active ? t.common.active : t.common.inactive}
                          </span>
                          {(outOfStock || lowStock) && (
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              outOfStock ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {outOfStock ? (language === 'zh' ? '缺货' : 'Out') : (language === 'zh' ? '低' : 'Low')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900 mr-4">
                          <Edit2 className="h-4 w-4 inline" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingProduct ? t.products.editProduct : t.products.addProduct}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.products.image}
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingImage ? (language === 'zh' ? '上传中...' : 'Uploading...') : t.products.uploadImage}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.productName} *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.brand}</label>
                      <select value={formData.brand_id || ''} onChange={(e) => setFormData({ ...formData, brand_id: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">{t.common.pleaseSelect}</option>
                        {brands.filter(b => b.is_active).map((brand) => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.nav.categories}</label>
                      <select value={formData.category_id || ''} onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">{t.common.pleaseSelect}</option>
                        {categories.filter(c => c.is_active).map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.specification}</label>
                      <input type="text" value={formData.specification || ''} onChange={(e) => setFormData({ ...formData, specification: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.model}</label>
                      <input type="text" value={formData.model || ''} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.unit}</label>
                      <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.products.minStock}</label>
                      <input type="number" min="0" value={formData.warning_threshold} onChange={(e) => setFormData({ ...formData, warning_threshold: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.common.description}</label>
                    <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="flex items-center">
                    <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">{t.categories.isActive}</label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t.common.cancel}</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingProduct ? t.common.save : t.common.add}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
