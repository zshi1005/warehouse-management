// 品牌类型
export interface Brand {
  id: number;
  name: string;
  description: string | null;
  logo_key: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  logo_url?: string;
}

export interface BrandInsert {
  name: string;
  description?: string;
  logo_key?: string;
  is_active?: boolean;
}

// 产品类别类型（支持三级分类）
export interface ProductCategory {
  id: number;
  name: string;
  code: string | null;
  parent_id: number | null;
  level: number;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  children?: ProductCategory[];
  parent?: ProductCategory;
}

export interface ProductCategoryInsert {
  name: string;
  code?: string;
  parent_id?: number;
  level?: number;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

// 仓库位置类型
export interface WarehouseLocation {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface WarehouseLocationInsert {
  name: string;
  code?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

// 出库类别类型
export interface StockOutCategory {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface StockOutCategoryInsert {
  name: string;
  code?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

// 产品类型
export interface Product {
  id: number;
  name: string;
  category_id: number | null;
  brand_id: number | null;
  specification: string | null;
  model: string | null;
  unit: string;
  description: string | null;
  image_key: string | null;
  warning_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  product_categories?: ProductCategory;
  brands?: Brand;
  image_url?: string;
}

export interface ProductInsert {
  name: string;
  category_id?: number;
  brand_id?: number;
  specification?: string;
  model?: string;
  unit?: string;
  description?: string;
  image_key?: string;
  warning_threshold?: number;
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
  location_id: number | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  products?: Product;
  warehouse_locations?: WarehouseLocation;
}

export interface InventoryInsert {
  product_id: number;
  serial_number: string;
  status?: 'in_stock' | 'out_of_stock' | 'transferred';
  location_id?: number;
  location?: string;
  notes?: string;
}

// 入库单明细类型
export interface StockInOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: string | null;
  amount: string | null;
  location_id: number | null;
  location: string | null;
  serial_numbers: string[];
  notes: string | null;
  created_at: string;
  products?: Product;
  warehouse_locations?: WarehouseLocation;
}

export interface StockInOrderItemInsert {
  order_id?: number;
  product_id: number;
  quantity: number;
  unit_price?: string;
  amount?: string;
  location_id?: number;
  location?: string;
  serial_numbers?: string[];
  notes?: string;
}

// 入库单类型
export interface StockInOrder {
  id: number;
  order_no: string;
  invoice_no: string | null;
  supplier_id: number | null;
  in_date: string | null;
  total_quantity: number;
  total_amount: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  suppliers?: Supplier;
  items?: StockInOrderItem[];
}

export interface StockInOrderInsert {
  order_no?: string;
  invoice_no?: string;
  supplier_id?: number;
  in_date?: string;
  total_quantity?: number;
  total_amount?: string;
  notes?: string;
  items: StockInOrderItemInsert[];
}

// 出库单明细类型
export interface StockOutOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  serial_numbers: string[];
  notes: string | null;
  created_at: string;
  products?: Product;
}

export interface StockOutOrderItemInsert {
  order_id?: number;
  product_id: number;
  quantity: number;
  serial_numbers: string[];
  notes?: string;
}

// 出库单类型
export interface StockOutOrder {
  id: number;
  order_no: string;
  customer_id: number | null;
  category_id: number | null;
  out_date: string | null;
  total_quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  customers?: Customer;
  stock_out_categories?: StockOutCategory;
  items?: StockOutOrderItem[];
}

export interface StockOutOrderInsert {
  order_no?: string;
  customer_id?: number;
  category_id?: number;
  out_date?: string;
  total_quantity?: number;
  notes?: string;
  items: StockOutOrderItemInsert[];
}

// 库存转移类型
export interface StockTransfer {
  id: number;
  transfer_no: string;
  product_id: number;
  inventory_id: number;
  serial_number: string;
  from_site_id: number | null;
  to_site_id: number;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  products?: Product;
  from_site?: ConstructionSite;
  to_site?: ConstructionSite;
}

export interface StockTransferInsert {
  transfer_no?: string;
  product_id: number;
  inventory_id: number;
  serial_number: string;
  from_site_id?: number;
  to_site_id: number;
  notes?: string;
}

// 工地类型
export interface ConstructionSite {
  id: number;
  name: string;
  code: string | null;
  address: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ConstructionSiteInsert {
  name: string;
  code?: string;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  description?: string;
  is_active?: boolean;
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

// 盘点单类型
export interface StockCheckOrder {
  id: number;
  check_no: string;
  check_date: string | null;
  total_items: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  items?: StockCheckItem[];
}

export interface StockCheckItem {
  id: number;
  check_id: number;
  product_id: number;
  system_quantity: number;
  actual_quantity: number;
  difference: number;
  notes: string | null;
  created_at: string;
  products?: Product;
}

export interface StockCheckOrderInsert {
  check_no?: string;
  check_date?: string;
  total_items?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  items?: StockCheckItemInsert[];
}

export interface StockCheckItemInsert {
  check_id?: number;
  product_id: number;
  system_quantity: number;
  actual_quantity: number;
  difference?: number;
  notes?: string;
}
