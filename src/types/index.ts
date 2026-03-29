// 产品类别类型
export interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ProductCategoryInsert {
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

// 产品类型
export interface Product {
  id: number;
  name: string;
  category_id: number | null;
  specification: string | null;
  model: string | null;
  unit: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  product_categories?: ProductCategory;
}

export interface ProductInsert {
  name: string;
  category_id?: number;
  specification?: string;
  model?: string;
  unit?: string;
  description?: string;
  is_active?: boolean;
}

// 供应商类型
export interface Supplier {
  id: number;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface SupplierInsert {
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}

// 客户类型
export interface Customer {
  id: number;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CustomerInsert {
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}

// 库存类型
export interface Inventory {
  id: number;
  product_id: number;
  serial_number: string;
  status: 'in_stock' | 'out_of_stock' | 'transferred';
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  products?: Product;
}

export interface InventoryInsert {
  product_id: number;
  serial_number: string;
  status?: 'in_stock' | 'out_of_stock' | 'transferred';
  location?: string;
  notes?: string;
}

// 入库单类型
export interface StockInOrder {
  id: number;
  order_no: string;
  product_id: number;
  supplier_id: number | null;
  quantity: number;
  unit_price: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  products?: Product;
  suppliers?: Supplier;
}

export interface StockInOrderInsert {
  order_no: string;
  product_id: number;
  supplier_id?: number;
  quantity: number;
  unit_price?: string;
  location?: string;
  notes?: string;
}

// 出库单类型
export interface StockOutOrder {
  id: number;
  order_no: string;
  product_id: number;
  customer_id: number | null;
  quantity: number;
  serial_numbers: string[];
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  products?: Product;
  customers?: Customer;
}

export interface StockOutOrderInsert {
  order_no: string;
  product_id: number;
  customer_id?: number;
  quantity: number;
  serial_numbers: string[];
  location?: string;
  notes?: string;
}

// 库存转移类型
export interface StockTransfer {
  id: number;
  transfer_no: string;
  product_id: number;
  inventory_id: number;
  serial_number: string;
  from_location: string | null;
  to_location: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  products?: Product;
}

export interface StockTransferInsert {
  transfer_no: string;
  product_id: number;
  inventory_id: number;
  serial_number: string;
  from_location?: string;
  to_location: string;
  notes?: string;
}

// 库存统计
export interface InventoryStats {
  productId: number;
  productName: string;
  totalQuantity: number;
  inStockQuantity: number;
  outOfStockQuantity: number;
  transferredQuantity: number;
}
