-- 添加品牌表
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS brands_name_idx ON brands(name);
CREATE INDEX IF NOT EXISTS brands_is_active_idx ON brands(is_active);

-- 添加产品类别层级支持
ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_name_unique;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES product_categories(id);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS product_categories_parent_id_idx ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS product_categories_level_idx ON product_categories(level);

-- 添加产品品牌字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id);
CREATE INDEX IF NOT EXISTS products_brand_id_idx ON products(brand_id);

-- 创建入库单明细表
CREATE TABLE IF NOT EXISTS stock_in_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES stock_in_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2),
  amount NUMERIC(12, 2),
  location_id INTEGER REFERENCES warehouse_locations(id),
  location VARCHAR(200),
  serial_numbers JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stock_in_order_items_order_id_idx ON stock_in_order_items(order_id);
CREATE INDEX IF NOT EXISTS stock_in_order_items_product_id_idx ON stock_in_order_items(product_id);

-- 修改入库单主表
ALTER TABLE stock_in_orders ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(100);
ALTER TABLE stock_in_orders ADD COLUMN IF NOT EXISTS in_date DATE;
ALTER TABLE stock_in_orders ADD COLUMN IF NOT EXISTS total_quantity INTEGER DEFAULT 0;
ALTER TABLE stock_in_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2);

CREATE INDEX IF NOT EXISTS stock_in_orders_invoice_no_idx ON stock_in_orders(invoice_no);
CREATE INDEX IF NOT EXISTS stock_in_orders_in_date_idx ON stock_in_orders(in_date);

-- 迁移旧数据到新结构（如果有的话）
-- 先创建临时表存储旧数据
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_in_orders' AND column_name = 'product_id') THEN
    -- 迁移数据到明细表
    INSERT INTO stock_in_order_items (order_id, product_id, quantity, unit_price, location, notes, created_at)
    SELECT id, product_id, quantity, unit_price::text::numeric, location, notes, created_at
    FROM stock_in_orders
    WHERE product_id IS NOT NULL;
    
    -- 更新主表总数量
    UPDATE stock_in_orders o SET total_quantity = (SELECT SUM(quantity) FROM stock_in_order_items WHERE order_id = o.id);
    
    -- 删除旧字段
    ALTER TABLE stock_in_orders DROP COLUMN IF EXISTS product_id;
    ALTER TABLE stock_in_orders DROP COLUMN IF EXISTS quantity;
    ALTER TABLE stock_in_orders DROP COLUMN IF EXISTS unit_price;
    ALTER TABLE stock_in_orders DROP COLUMN IF EXISTS location;
  END IF;
END $$;

-- 仓库位置编号唯一约束
ALTER TABLE warehouse_locations ADD CONSTRAINT warehouse_locations_code_unique UNIQUE (code);
