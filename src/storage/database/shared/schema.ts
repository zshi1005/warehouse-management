import { pgTable, serial, varchar, text, integer, timestamp, jsonb, index, boolean, date, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 系统表（不要删除）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 产品类别表（支持三级分类）
export const productCategories = pgTable(
	"product_categories",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 100 }).notNull(),
		code: varchar("code", { length: 50 }),
		parent_id: integer("parent_id").references((): any => productCategories.id),
		level: integer("level").default(1).notNull(), // 1, 2, 3 表示层级
		description: text("description"),
		sort_order: integer("sort_order").default(0),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("product_categories_name_idx").on(table.name),
		index("product_categories_parent_id_idx").on(table.parent_id),
		index("product_categories_level_idx").on(table.level),
		index("product_categories_sort_order_idx").on(table.sort_order),
	]
);

// 品牌表
export const brands = pgTable(
	"brands",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 100 }).notNull().unique(),
		description: text("description"),
		logo_key: text("logo_key"),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("brands_name_idx").on(table.name),
		index("brands_is_active_idx").on(table.is_active),
	]
);

// 仓库位置表
export const warehouseLocations = pgTable(
	"warehouse_locations",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 100 }).notNull(),
		code: varchar("code", { length: 50 }).unique(), // 自动生成的编号
		description: text("description"),
		sort_order: integer("sort_order").default(0),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("warehouse_locations_name_idx").on(table.name),
		index("warehouse_locations_code_idx").on(table.code),
		index("warehouse_locations_sort_order_idx").on(table.sort_order),
	]
);

// 出库类别表
export const stockOutCategories = pgTable(
	"stock_out_categories",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 100 }).notNull().unique(),
		code: varchar("code", { length: 50 }),
		description: text("description"),
		sort_order: integer("sort_order").default(0),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("stock_out_categories_name_idx").on(table.name),
		index("stock_out_categories_code_idx").on(table.code),
		index("stock_out_categories_sort_order_idx").on(table.sort_order),
	]
);

// 产品表
export const products = pgTable(
	"products",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 200 }).notNull(),
		category_id: integer("category_id").references(() => productCategories.id),
		brand_id: integer("brand_id").references(() => brands.id),
		specification: varchar("specification", { length: 200 }),
		model: varchar("model", { length: 100 }),
		unit: varchar("unit", { length: 20 }).notNull().default('个'),
		description: text("description"),
		image_key: text("image_key"),
		warning_threshold: integer("warning_threshold").default(10),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("products_name_idx").on(table.name),
		index("products_category_id_idx").on(table.category_id),
		index("products_brand_id_idx").on(table.brand_id),
		index("products_is_active_idx").on(table.is_active),
	]
);

// 供应商表
export const suppliers = pgTable(
	"suppliers",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 200 }).notNull(),
		contact: varchar("contact", { length: 100 }),
		phone: varchar("phone", { length: 50 }),
		email: varchar("email", { length: 100 }),
		address: text("address"),
		notes: text("notes"),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("suppliers_name_idx").on(table.name),
		index("suppliers_is_active_idx").on(table.is_active),
	]
);

// 客户表
export const customers = pgTable(
	"customers",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 200 }).notNull(),
		contact: varchar("contact", { length: 100 }),
		phone: varchar("phone", { length: 50 }),
		email: varchar("email", { length: 100 }),
		address: text("address"),
		notes: text("notes"),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("customers_name_idx").on(table.name),
		index("customers_is_active_idx").on(table.is_active),
	]
);

// 库存表（带序列号）
export const inventory = pgTable(
	"inventory",
	{
		id: serial().primaryKey(),
		product_id: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
		serial_number: varchar("serial_number", { length: 100 }).notNull().unique(),
		status: varchar("status", { length: 20 }).notNull().default('in_stock'), // in_stock, out_of_stock, transferred
		location_id: integer("location_id").references(() => warehouseLocations.id),
		location: varchar("location", { length: 200 }),
		notes: text("notes"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("inventory_product_id_idx").on(table.product_id),
		index("inventory_serial_number_idx").on(table.serial_number),
		index("inventory_status_idx").on(table.status),
		index("inventory_location_id_idx").on(table.location_id),
	]
);

// 入库单主表
export const stockInOrders = pgTable(
	"stock_in_orders",
	{
		id: serial().primaryKey(),
		order_no: varchar("order_no", { length: 50 }).notNull().unique(),
		invoice_no: varchar("invoice_no", { length: 100 }), // 发票编号
		supplier_id: integer("supplier_id").references(() => suppliers.id),
		in_date: date("in_date"), // 入库日期
		total_quantity: integer("total_quantity").default(0),
		total_amount: numeric("total_amount", { precision: 12, scale: 2 }), // 总金额
		notes: text("notes"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("stock_in_orders_order_no_idx").on(table.order_no),
		index("stock_in_orders_invoice_no_idx").on(table.invoice_no),
		index("stock_in_orders_supplier_id_idx").on(table.supplier_id),
		index("stock_in_orders_in_date_idx").on(table.in_date),
		index("stock_in_orders_created_at_idx").on(table.created_at),
	]
);

// 入库单明细表
export const stockInOrderItems = pgTable(
	"stock_in_order_items",
	{
		id: serial().primaryKey(),
		order_id: integer("order_id").notNull().references(() => stockInOrders.id, { onDelete: "cascade" }),
		product_id: integer("product_id").notNull().references(() => products.id),
		quantity: integer("quantity").notNull(),
		unit_price: numeric("unit_price", { precision: 10, scale: 2 }), // 单价
		amount: numeric("amount", { precision: 12, scale: 2 }), // 金额
		location_id: integer("location_id").references(() => warehouseLocations.id),
		location: varchar("location", { length: 200 }),
		serial_numbers: jsonb("serial_numbers").notNull().default(sql`'[]'::jsonb`),
		notes: text("notes"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("stock_in_order_items_order_id_idx").on(table.order_id),
		index("stock_in_order_items_product_id_idx").on(table.product_id),
	]
);

// 出库单表
export const stockOutOrders = pgTable(
	"stock_out_orders",
	{
		id: serial().primaryKey(),
		order_no: varchar("order_no", { length: 50 }).notNull().unique(),
		customer_id: integer("customer_id").references(() => customers.id),
		category_id: integer("category_id").references(() => stockOutCategories.id),
		out_date: date("out_date"),
		total_quantity: integer("total_quantity").default(0),
		notes: text("notes"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("stock_out_orders_order_no_idx").on(table.order_no),
		index("stock_out_orders_customer_id_idx").on(table.customer_id),
		index("stock_out_orders_category_id_idx").on(table.category_id),
		index("stock_out_orders_out_date_idx").on(table.out_date),
		index("stock_out_orders_created_at_idx").on(table.created_at),
	]
);

// 出库单明细表
export const stockOutOrderItems = pgTable(
	"stock_out_order_items",
	{
		id: serial().primaryKey(),
		order_id: integer("order_id").notNull().references(() => stockOutOrders.id, { onDelete: "cascade" }),
		product_id: integer("product_id").notNull().references(() => products.id),
		quantity: integer("quantity").notNull(),
		serial_numbers: jsonb("serial_numbers").notNull().default(sql`'[]'::jsonb`),
		notes: text("notes"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("stock_out_order_items_order_id_idx").on(table.order_id),
		index("stock_out_order_items_product_id_idx").on(table.product_id),
	]
);

// 工地表（用于库存转移的来源和目的地）
export const constructionSites = pgTable(
	"construction_sites",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 200 }).notNull(),
		code: varchar("code", { length: 50 }),
		address: text("address"),
		contact_person: varchar("contact_person", { length: 100 }),
		contact_phone: varchar("contact_phone", { length: 50 }),
		description: text("description"),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("construction_sites_name_idx").on(table.name),
		index("construction_sites_code_idx").on(table.code),
		index("construction_sites_is_active_idx").on(table.is_active),
	]
);

// 库存转移表（从已出库的内部使用设备转移）
export const stockTransfers = pgTable(
	"stock_transfers",
	{
		id: serial().primaryKey(),
		transfer_no: varchar("transfer_no", { length: 50 }).notNull().unique(),
		product_id: integer("product_id").notNull().references(() => products.id),
		inventory_id: integer("inventory_id").notNull().references(() => inventory.id),
		serial_number: varchar("serial_number", { length: 100 }).notNull(),
		from_site_id: integer("from_site_id").references(() => constructionSites.id),
		to_site_id: integer("to_site_id").notNull().references(() => constructionSites.id),
		notes: text("notes"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("stock_transfers_transfer_no_idx").on(table.transfer_no),
		index("stock_transfers_product_id_idx").on(table.product_id),
		index("stock_transfers_inventory_id_idx").on(table.inventory_id),
		index("stock_transfers_serial_number_idx").on(table.serial_number),
		index("stock_transfers_from_site_id_idx").on(table.from_site_id),
		index("stock_transfers_to_site_id_idx").on(table.to_site_id),
		index("stock_transfers_created_at_idx").on(table.created_at),
	]
);
