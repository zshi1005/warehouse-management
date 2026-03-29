'use client';

import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Search
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import * as XLSX from 'xlsx';

type ReportTab = 'inventory' | 'stock-in' | 'stock-out';

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
}

interface WarehouseLocation {
  id: number;
  name: string;
  code: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('inventory');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  
  // Filters
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Inventory filters
  const [inventoryFilters, setInventoryFilters] = useState({
    product_id: '',
    location_id: '',
    brand_id: '',
    category_id: '',
    status: '',
    date_from: '',
    date_to: '',
  });
  
  // Stock-in filters
  const [stockInFilters, setStockInFilters] = useState({
    invoice_no: '',
    product_id: '',
    supplier_id: '',
    date_from: '',
    date_to: '',
  });
  
  // Stock-out filters
  const [stockOutFilters, setStockOutFilters] = useState({
    product_id: '',
    customer_id: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchFilterOptions = async () => {
    try {
      const [productsRes, suppliersRes, customersRes, locationsRes, brandsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/suppliers'),
        fetch('/api/customers'),
        fetch('/api/warehouse-locations'),
        fetch('/api/brands'),
        fetch('/api/categories'),
      ]);
      
      const [productsData, suppliersData, customersData, locationsData, brandsData, categoriesData] = await Promise.all([
        productsRes.json(),
        suppliersRes.json(),
        customersRes.json(),
        locationsRes.json(),
        brandsRes.json(),
        categoriesRes.json(),
      ]);
      
      setProducts(productsData.data || []);
      setSuppliers(suppliersData.data || []);
      setCustomers(customersData.data || []);
      setLocations(locationsData.data || []);
      setBrands(brandsData.data || []);
      setCategories(categoriesData.data || []);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let url = '';
      let params = new URLSearchParams();
      
      if (activeTab === 'inventory') {
        url = '/api/reports/inventory';
        Object.entries(inventoryFilters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      } else if (activeTab === 'stock-in') {
        url = '/api/reports/stock-in';
        Object.entries(stockInFilters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      } else {
        url = '/api/reports/stock-out';
        Object.entries(stockOutFilters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      
      const res = await fetch(`${url}?${params.toString()}`);
      const result = await res.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportData();
  };

  const resetFilters = () => {
    if (activeTab === 'inventory') {
      setInventoryFilters({
        product_id: '',
        location_id: '',
        brand_id: '',
        category_id: '',
        status: '',
        date_from: '',
        date_to: '',
      });
    } else if (activeTab === 'stock-in') {
      setStockInFilters({
        invoice_no: '',
        product_id: '',
        supplier_id: '',
        date_from: '',
        date_to: '',
      });
    } else {
      setStockOutFilters({
        product_id: '',
        customer_id: '',
        date_from: '',
        date_to: '',
      });
    }
    setTimeout(fetchReportData, 0);
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    
    let exportData: any[] = [];
    let filename = '';
    
    if (activeTab === 'inventory') {
      filename = 'inventory_report';
      exportData = data.map(item => ({
        'Product Name': item.product?.name || '-',
        'Brand': item.product?.brands?.name || '-',
        'Category': item.product?.product_categories?.name || '-',
        'Location': item.location?.name || '-',
        'Location Code': item.location?.code || '-',
        'Quantity': item.quantity,
        'Serial Number': item.serial_number || '-',
        'Status': item.status === 'in_stock' ? 'In Stock' : 'Out of Stock',
        'Created At': new Date(item.created_at).toLocaleDateString(),
      }));
    } else if (activeTab === 'stock-in') {
      filename = 'stock_in_report';
      exportData = [];
      data.forEach(order => {
        order.items?.forEach((item: any) => {
          exportData.push({
            'Order No': order.order_no,
            'Invoice No': order.invoice_no || '-',
            'Supplier': order.supplier?.name || '-',
            'Product': item.product?.name || '-',
            'Quantity': item.quantity,
            'Unit Price': item.unit_price,
            'Amount': item.amount,
            'Location': item.location || '-',
            'Serial Numbers': item.serial_numbers?.join(', ') || '-',
            'Date': new Date(order.in_date || order.created_at).toLocaleDateString(),
          });
        });
      });
    } else {
      filename = 'stock_out_report';
      exportData = [];
      data.forEach(order => {
        order.items?.forEach((item: any) => {
          exportData.push({
            'Order No': order.order_no,
            'Customer': order.customer?.name || '-',
            'Product': item.product?.name || '-',
            'Quantity': item.quantity,
            'Unit Price': item.unit_price,
            'Amount': item.amount,
            'Serial Numbers': item.serial_numbers?.join(', ') || '-',
            'Date': new Date(order.out_date || order.created_at).toLocaleDateString(),
          });
        });
      });
    }
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const tabs = [
    { id: 'inventory' as ReportTab, label: 'Inventory Report', icon: Package },
    { id: 'stock-in' as ReportTab, label: 'Stock-In Report', icon: ArrowDownCircle },
    { id: 'stock-out' as ReportTab, label: 'Stock-Out Report', icon: ArrowUpCircle },
  ];

  const renderInventoryFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <select
        value={inventoryFilters.product_id}
        onChange={(e) => setInventoryFilters({ ...inventoryFilters, product_id: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Products</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select
        value={inventoryFilters.location_id}
        onChange={(e) => setInventoryFilters({ ...inventoryFilters, location_id: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Locations</option>
        {locations.map(l => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      <select
        value={inventoryFilters.brand_id}
        onChange={(e) => setInventoryFilters({ ...inventoryFilters, brand_id: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Brands</option>
        {brands.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <select
        value={inventoryFilters.category_id}
        onChange={(e) => setInventoryFilters({ ...inventoryFilters, category_id: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Categories</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        value={inventoryFilters.status}
        onChange={(e) => setInventoryFilters({ ...inventoryFilters, status: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Status</option>
        <option value="in_stock">In Stock</option>
        <option value="out_of_stock">Out of Stock</option>
      </select>
      <input
        type="date"
        value={inventoryFilters.date_from}
        onChange={(e) => setInventoryFilters({ ...inventoryFilters, date_from: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Date From"
      />
      <input
        type="date"
        value={inventoryFilters.date_to}
        onChange={(e) => setInventoryFilters({ ...inventoryFilters, date_to: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Date To"
      />
    </div>
  );

  const renderStockInFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <input
        type="text"
        value={stockInFilters.invoice_no}
        onChange={(e) => setStockInFilters({ ...stockInFilters, invoice_no: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Invoice No"
      />
      <select
        value={stockInFilters.product_id}
        onChange={(e) => setStockInFilters({ ...stockInFilters, product_id: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Products</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select
        value={stockInFilters.supplier_id}
        onChange={(e) => setStockInFilters({ ...stockInFilters, supplier_id: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Suppliers</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input
        type="date"
        value={stockInFilters.date_from}
        onChange={(e) => setStockInFilters({ ...stockInFilters, date_from: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Date From"
      />
      <input
        type="date"
        value={stockInFilters.date_to}
        onChange={(e) => setStockInFilters({ ...stockInFilters, date_to: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Date To"
      />
    </div>
  );

  const renderStockOutFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <select
        value={stockOutFilters.product_id}
        onChange={(e) => setStockOutFilters({ ...stockOutFilters, product_id: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Products</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select
        value={stockOutFilters.customer_id}
        onChange={(e) => setStockOutFilters({ ...stockOutFilters, customer_id: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Customers</option>
        {customers.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input
        type="date"
        value={stockOutFilters.date_from}
        onChange={(e) => setStockOutFilters({ ...stockOutFilters, date_from: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Date From"
      />
      <input
        type="date"
        value={stockOutFilters.date_to}
        onChange={(e) => setStockOutFilters({ ...stockOutFilters, date_to: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Date To"
      />
    </div>
  );

  const renderInventoryTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial No</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{item.product?.name || '-'}</td>
              <td className="px-4 py-3 text-gray-500">{item.product?.brands?.name || '-'}</td>
              <td className="px-4 py-3 text-gray-500">{item.product?.product_categories?.name || '-'}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {item.location?.name || '-'}
                </span>
              </td>
              <td className="px-4 py-3 font-medium">{item.quantity}</td>
              <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.serial_number || '-'}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.status === 'in_stock'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {item.status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStockInTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order No</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((order) => (
            order.items?.map((item: any, idx: number) => (
              <tr key={`${order.id}-${idx}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{order.order_no}</td>
                <td className="px-4 py-3 text-gray-500">{order.invoice_no || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{order.supplier?.name || '-'}</td>
                <td className="px-4 py-3">{item.product?.name || '-'}</td>
                <td className="px-4 py-3 font-medium">{item.quantity}</td>
                <td className="px-4 py-3 text-gray-500">¥{item.unit_price}</td>
                <td className="px-4 py-3 text-gray-500">¥{item.amount}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(order.in_date || order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStockOutTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order No</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Numbers</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((order) => (
            order.items?.map((item: any, idx: number) => (
              <tr key={`${order.id}-${idx}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{order.order_no}</td>
                <td className="px-4 py-3 text-gray-500">{order.customer?.name || '-'}</td>
                <td className="px-4 py-3">{item.product?.name || '-'}</td>
                <td className="px-4 py-3 font-medium">{item.quantity}</td>
                <td className="px-4 py-3 text-gray-500">¥{item.unit_price}</td>
                <td className="px-4 py-3 text-gray-500">¥{item.amount}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                  {item.serial_numbers?.join(', ') || '-'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(order.out_date || order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Generate and export inventory reports</p>
          </div>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Excel
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={resetFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Reset
              </button>
              <button
                onClick={handleFilterSubmit}
                className="px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Search className="h-4 w-4 mr-1" />
                Search
              </button>
            </div>
          </div>
          
          {activeTab === 'inventory' && renderInventoryFilters()}
          {activeTab === 'stock-in' && renderStockInFilters()}
          {activeTab === 'stock-out' && renderStockOutFilters()}
        </div>

        {/* Report Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading report data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">No data found</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 bg-gray-50 border-b">
                <p className="text-sm text-gray-600">
                  Total: <span className="font-medium">{data.length}</span> records
                </p>
              </div>
              {activeTab === 'inventory' && renderInventoryTable()}
              {activeTab === 'stock-in' && renderStockInTable()}
              {activeTab === 'stock-out' && renderStockOutTable()}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
