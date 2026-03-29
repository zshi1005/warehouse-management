# 🚀 Vercel + Supabase 部署指南

本指南将帮助您将仓库管理系统部署到 Vercel，实现长期免费使用。

---

## 📋 前置准备

您需要准备以下账号：

| 账号 | 用途 | 注册地址 |
|------|------|----------|
| **GitHub** | 代码托管 | https://github.com |
| **Vercel** | 应用部署 | https://vercel.com |
| **Supabase** | 数据库+图片存储 | https://supabase.com |

---

## 第一步：配置 Supabase

### 1.1 创建 Supabase 项目（如果您还没有）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 **New Project**
3. 填写项目名称和数据库密码
4. 选择离您最近的区域
5. 点击 **Create new project**，等待约 2 分钟

### 1.2 获取 API 密钥

1. 进入项目后，点击左侧 **Settings** (齿轮图标)
2. 点击 **API**
3. 复制以下信息：
   - **Project URL** → 这就是 `COZE_SUPABASE_URL`
   - **anon public key** → 这就是 `COZE_SUPABASE_ANON_KEY`

### 1.3 创建图片存储桶

1. 点击左侧 **Storage**
2. 点击 **New bucket**
3. 填写：
   - Name: `product-images`
   - 勾选 **Public bucket**
4. 点击 **Create bucket**

### 1.4 创建数据库表

1. 点击左侧 **SQL Editor**
2. 点击 **New query**
3. 复制以下 SQL 并执行：

```sql
-- 产品类别表
CREATE TABLE product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50),
  parent_id INTEGER REFERENCES product_categories(id),
  level INTEGER DEFAULT 1 NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 品牌表
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo_key TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 产品表
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id INTEGER REFERENCES product_categories(id),
  brand_id INTEGER REFERENCES brands(id),
  specification VARCHAR(200),
  model VARCHAR(100),
  unit VARCHAR(20) DEFAULT '个' NOT NULL,
  description TEXT,
  image_key TEXT,
  warning_threshold INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 供应商表
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 客户表
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 仓库位置表
CREATE TABLE warehouse_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 入库类别表
CREATE TABLE stock_in_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 出库类别表
CREATE TABLE stock_out_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 入库单主表
CREATE TABLE stock_in_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL UNIQUE,
  invoice_no VARCHAR(100),
  supplier_id INTEGER REFERENCES suppliers(id),
  in_date DATE,
  total_quantity INTEGER DEFAULT 0,
  total_amount DECIMAL(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 入库单明细表
CREATE TABLE stock_in_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES stock_in_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2),
  amount DECIMAL(12, 2),
  location_id INTEGER REFERENCES warehouse_locations(id),
  location VARCHAR(200),
  serial_numbers JSONB DEFAULT '[]' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 出库单主表
CREATE TABLE stock_out_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL UNIQUE,
  customer_id INTEGER REFERENCES customers(id),
  category_id INTEGER REFERENCES stock_out_categories(id),
  out_date DATE,
  total_quantity INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 出库单明细表
CREATE TABLE stock_out_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES stock_out_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2),
  amount DECIMAL(12, 2),
  serial_numbers JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 库存表
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  location_id INTEGER REFERENCES warehouse_locations(id),
  serial_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'in_stock' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 库存转移表
CREATE TABLE stock_transfers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  from_location_id INTEGER REFERENCES warehouse_locations(id),
  to_location_id INTEGER REFERENCES warehouse_locations(id),
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_stock_in_orders_supplier ON stock_in_orders(supplier_id);
CREATE INDEX idx_stock_out_orders_customer ON stock_out_orders(customer_id);
```

### 1.5 配置 RLS 策略（允许公开访问）

在 SQL Editor 中执行：

```sql
-- 为所有表启用 RLS 并允许公开访问
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略
CREATE POLICY "Allow all access" ON product_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON warehouse_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON stock_in_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON stock_out_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON stock_in_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON stock_in_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON stock_out_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON stock_out_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON stock_transfers FOR ALL USING (true) WITH CHECK (true);
```

---

## 第二步：推送代码到 GitHub

### 2.1 初始化 Git 仓库

在沙箱终端中执行：

```bash
cd /workspace/projects
git add -A
git commit -m "feat: warehouse management system"
```

### 2.2 创建 GitHub 仓库并推送

1. 登录 [GitHub](https://github.com)
2. 点击右上角 **+** → **New repository**
3. 填写仓库名称，如 `warehouse-management`
4. 选择 **Public** 或 **Private**
5. 点击 **Create repository**
6. 按照页面提示推送代码：

```bash
git remote add origin https://github.com/YOUR_USERNAME/warehouse-management.git
git push -u origin main
```

---

## 第三步：部署到 Vercel

### 3.1 导入项目

1. 登录 [Vercel](https://vercel.com)（可用 GitHub 登录）
2. 点击 **Add New...** → **Project**
3. 选择您刚才创建的 GitHub 仓库
4. 点击 **Import**

### 3.2 配置环境变量

在部署配置页面：

1. 展开 **Environment Variables**
2. 添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `COZE_SUPABASE_URL` | 您的 Supabase Project URL |
| `COZE_SUPABASE_ANON_KEY` | 您的 Supabase anon key |
| `SUPABASE_STORAGE_BUCKET` | `product-images` |

### 3.3 部署

1. 点击 **Deploy**
2. 等待约 2-3 分钟
3. 部署成功后，您将获得一个 `xxx.vercel.app` 域名

---

## 第四步：验证部署

1. 打开您的 Vercel 域名
2. 尝试添加产品类别、产品等数据
3. 验证图片上传功能正常

---

## 📊 费用说明

| 服务 | 免费额度 | 说明 |
|------|----------|------|
| **Vercel** | Hobby 计划永久免费 | 每月 100GB 带宽 |
| **Supabase 数据库** | 500MB | 足够存储大量业务数据 |
| **Supabase Storage** | 1GB | 约 500 张产品图片 |

**总费用：0 元/月** ✅

---

## 🔧 常见问题

### Q: 图片上传失败？
确保：
1. Storage bucket 已设置为 public
2. `SUPABASE_STORAGE_BUCKET` 环境变量已正确设置

### Q: 数据库连接失败？
确保：
1. `COZE_SUPABASE_URL` 和 `COZE_SUPABASE_ANON_KEY` 正确
2. RLS 策略已正确配置

### Q: 如何更新代码？
```bash
git add -A
git commit -m "update: your changes"
git push
```
Vercel 会自动重新部署。

---

## 🎉 完成！

您的仓库管理系统现在已部署到 Vercel，可以长期免费使用！
