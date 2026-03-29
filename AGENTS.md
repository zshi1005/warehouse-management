# 仓库管理系统 - AGENTS.md

## 项目概览

这是一个基于 Next.js 16 + Supabase 的仓库管理系统，支持产品管理、供应商管理、客户管理、入库出库管理和库存转移功能。

### 核心功能

1. **基础信息管理**
   - 产品管理：添加、编辑、删除产品信息
   - 供应商管理：管理供应商信息
   - 客户管理：管理客户信息

2. **库存操作**
   - 入库管理：批量入库，自动生成序列号
   - 出库管理：基于序列号的精确出库
   - 库存转移：在不同位置间转移库存

3. **库存查询**
   - 按状态筛选（在库、已出库、已转移）
   - 按产品筛选
   - 序列号搜索

### 技术栈

- **前端**: Next.js 16 (App Router), React 19, TypeScript 5
- **UI组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM

## 项目结构

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── products/      # 产品管理API
│   │   │   ├── suppliers/     # 供应商管理API
│   │   │   ├── customers/     # 客户管理API
│   │   │   ├── inventory/     # 库存管理API
│   │   │   ├── stock-in/      # 入库管理API
│   │   │   ├── stock-out/     # 出库管理API
│   │   │   └── stock-transfers/ # 库存转移API
│   │   ├── products/          # 产品管理页面
│   │   ├── suppliers/         # 供应商管理页面
│   │   ├── customers/         # 客户管理页面
│   │   ├── inventory/         # 库存查询页面
│   │   ├── stock-in/          # 入库管理页面
│   │   ├── stock-out/         # 出库管理页面
│   │   └── stock-transfers/   # 库存转移页面
│   ├── components/
│   │   ├── layout/            # 布局组件
│   │   └── ui/                # UI组件库
│   ├── storage/database/      # 数据库配置
│   │   ├── shared/           # 共享数据库模型
│   │   │   └── schema.ts     # Drizzle schema定义
│   │   └── supabase-client.ts # Supabase客户端
│   ├── types/                 # TypeScript类型定义
│   └── lib/                   # 工具函数
├── .coze                      # Coze配置文件
└── package.json
```

## 数据库设计

### 表结构

1. **products (产品表)**
   - id: 主键
   - name: 产品名称
   - specification: 规格
   - model: 型号
   - unit: 单位
   - description: 描述
   - is_active: 是否启用

2. **suppliers (供应商表)**
   - id: 主键
   - name: 供应商名称
   - contact: 联系人
   - phone: 电话
   - email: 邮箱
   - address: 地址

3. **customers (客户表)**
   - id: 主键
   - name: 客户名称
   - contact: 联系人
   - phone: 电话
   - email: 邮箱
   - address: 地址

4. **inventory (库存表)**
   - id: 主键
   - product_id: 产品ID（外键）
   - serial_number: 序列号（唯一）
   - status: 状态（in_stock/out_of_stock/transferred）
   - location: 存放位置

5. **stock_in_orders (入库单表)**
   - id: 主键
   - order_no: 入库单号
   - product_id: 产品ID
   - supplier_id: 供应商ID
   - quantity: 入库数量
   - location: 存放位置

6. **stock_out_orders (出库单表)**
   - id: 主键
   - order_no: 出库单号
   - product_id: 产品ID
   - customer_id: 客户ID
   - quantity: 出库数量
   - serial_numbers: 序列号列表（JSONB）

7. **stock_transfers (库存转移表)**
   - id: 主键
   - transfer_no: 转移单号
   - product_id: 产品ID
   - inventory_id: 库存ID
   - serial_number: 序列号
   - from_location: 原位置
   - to_location: 目标位置

## 开发指南

### 环境要求

- Node.js 24+
- pnpm 9.0.0+

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
coze dev
```

服务将在 http://localhost:5000 启动

### 构建生产版本

```bash
coze build
```

### 启动生产服务器

```bash
coze start
```

## API 接口

### 产品管理
- `GET /api/products` - 获取产品列表
- `POST /api/products` - 创建产品
- `GET /api/products/[id]` - 获取单个产品
- `PUT /api/products/[id]` - 更新产品
- `DELETE /api/products/[id]` - 删除产品

### 供应商管理
- `GET /api/suppliers` - 获取供应商列表
- `POST /api/suppliers` - 创建供应商
- `GET /api/suppliers/[id]` - 获取单个供应商
- `PUT /api/suppliers/[id]` - 更新供应商
- `DELETE /api/suppliers/[id]` - 删除供应商

### 客户管理
- `GET /api/customers` - 获取客户列表
- `POST /api/customers` - 创建客户
- `GET /api/customers/[id]` - 获取单个客户
- `PUT /api/customers/[id]` - 更新客户
- `DELETE /api/customers/[id]` - 删除客户

### 库存管理
- `GET /api/inventory` - 获取库存列表（支持按产品、状态、序列号筛选）
- `POST /api/inventory` - 创建库存记录

### 入库管理
- `GET /api/stock-in` - 获取入库单列表
- `POST /api/stock-in` - 创建入库单（自动生成库存记录和序列号）

### 出库管理
- `GET /api/stock-out` - 获取出库单列表
- `POST /api/stock-out` - 创建出库单（需要提供序列号）

### 库存转移
- `GET /api/stock-transfers` - 获取转移单列表
- `POST /api/stock-transfers` - 创建转移单

## 业务流程

### 入库流程
1. 选择产品和供应商
2. 输入入库数量
3. 系统自动生成序列号（格式：SN{时间戳}{序号}）
4. 创建入库单记录
5. 批量创建库存记录，状态为 in_stock

### 出库流程
1. 选择产品
2. 从在库库存中选择或输入序列号
3. 选择客户（可选）
4. 系统验证序列号是否在库
5. 创建出库单记录
6. 更新库存状态为 out_of_stock

### 转移流程
1. 选择产品
2. 从在库库存中选择要转移的物品
3. 输入目标位置
4. 创建转移单记录
5. 更新库存状态为 transferred，位置更新为目标位置

## 注意事项

1. **数据库操作**：使用 Supabase SDK 进行数据操作，不要直接使用 Drizzle ORM 的查询方法
2. **字段命名**：数据库字段使用 snake_case，前端代码中使用对应的类型
3. **序列号管理**：入库时自动生成序列号，出库时必须提供有效的在库序列号
4. **库存状态**：
   - in_stock: 在库
   - out_of_stock: 已出库
   - transferred: 已转移
5. **Next.js 16 动态路由**：params 参数现在是 Promise 类型，需要 await

## 常见问题

### Q: 如何修改数据库表结构？
A: 修改 `src/storage/database/shared/schema.ts` 文件，然后运行 `coze-coding-ai db upgrade`

### Q: 如何添加新的API接口？
A: 在 `src/app/api/` 目录下创建相应的路由文件，使用 Supabase SDK 进行数据操作

### Q: 为什么出库时必须输入序列号？
A: 为了实现精确的库存追踪，每个产品都有唯一的序列号，出库时需要指定具体哪个序列号的产品出库

## 测试

所有API接口已通过测试，包括：
- 基础数据的CRUD操作
- 入库、出库、转移流程
- 库存状态更新
- 数据关联查询

## 许可证

MIT
