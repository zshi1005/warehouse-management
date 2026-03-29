import { pgTable, serial, varchar, text, integer, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 系统表（不要删除）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 产品表
export const products = pgTable(
	"products",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 200 }).notNull(),
		specification: varchar("specification", { length: 200 }),
		model: varchar("model", { length: 100 }),
		unit: varchar("unit", { length: 20 }).notNull().default('个'),
		description: text("description"),
		is_active: boolean("is_active").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("products_name_idx").on(table.name),
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
		location: varchar("location", { length: 200 }),
		notes: text("notes"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("inventory_product_id_idx").on(table.product_id),
		index("inventory_serial_number_idx").on(table.serial_number),
		index("inventory_status_idx").on(table.status),
	]
);

// 入库单表
export const stockInOrders = pgTable(
	"stock_in_orders",
	{
		id: serial().primaryKey(),
		order_no: varchar("order_no", { length: 50 }).notNull().unique(),
		product_id: integer("product_id").notNull().references(() => products.id),
		supplier_id: integer("supplier_id").references(() => suppliers.id),
		quantity: integer("quantity").notNull(),
		unit_price: text("unit_price"), // 使用text存储，避免浮点精度问题
		location: varchar("location", { length: 200 }),
		notes: text("notes"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("stock_in_orders_order_no_idx").on(table.order_no),
		index("stock_in_orders_product_id_idx").on(table.product_id),
		index("stock_in_orders_supplier_id_idx").on(table.supplier_id),
		index("stock_in_orders_created_at_idx").on(table.created_at),
	]
);

// 出库单表
export const stockOutOrders = pgTable(
	"stock_out_orders",
	{
		id: serial().primaryKey(),
		order_no: varchar("order_no", { length: 50 }).notNull().unique(),
		product_id: integer("product_id").notNull().references(() => products.id),
		customer_id: integer("customer_id").references(() => customers.id),
		quantity: integer("quantity").notNull(),
		serial_numbers: jsonb("serial_numbers").notNull(), // 存储序列号数组
		location: varchar("location", { length: 200 }),
		notes: text("notes"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("stock_out_orders_order_no_idx").on(table.order_no),
		index("stock_out_orders_product_id_idx").on(table.product_id),
		index("stock_out_orders_customer_id_idx").on(table.customer_id),
		index("stock_out_orders_created_at_idx").on(table.created_at),
	]
);

// 库存转移表
export const stockTransfers = pgTable(
	"stock_transfers",
	{
		id: serial().primaryKey(),
		transfer_no: varchar("transfer_no", { length: 50 }).notNull().unique(),
		product_id: integer("product_id").notNull().references(() => products.id),
		inventory_id: integer("inventory_id").notNull().references(() => inventory.id),
		serial_number: varchar("serial_number", { length: 100 }).notNull(),
		from_location: varchar("from_location", { length: 200 }),
		to_location: varchar("to_location", { length: 200 }).notNull(),
		notes: text("notes"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("stock_transfers_transfer_no_idx").on(table.transfer_no),
		index("stock_transfers_product_id_idx").on(table.product_id),
		index("stock_transfers_inventory_id_idx").on(table.inventory_id),
		index("stock_transfers_serial_number_idx").on(table.serial_number),
		index("stock_transfers_created_at_idx").on(table.created_at),
	]
);
