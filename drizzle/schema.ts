import { pgTable, unique, uuid, text, timestamp, foreignKey, boolean, numeric, integer, real, jsonb, uniqueIndex, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const addressType = pgEnum("address_type", ['billing', 'shipping'])
export const discountType = pgEnum("discount_type", ['percentage', 'fixed'])
export const orderStatus = pgEnum("order_status", ['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
export const paymentMethod = pgEnum("payment_method", ['stripe', 'paypal', 'cod'])
export const paymentStatus = pgEnum("payment_status", ['initiated', 'completed', 'failed'])


export const subscribers = pgTable("subscribers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("subscribers_email_unique").on(table.email),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	parentId: uuid("parent_id"),
	imageUrl: text("image_url"),
	isFeatured: boolean("is_featured").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_parent_id_categories_id_fk"
		}).onDelete("set null"),
	unique("categories_slug_unique").on(table.slug),
]);

export const accounts = pgTable("accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	idToken: text("id_token"),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const addresses = pgTable("addresses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: addressType().notNull(),
	line1: text().notNull(),
	line2: text(),
	city: text().notNull(),
	state: text().notNull(),
	country: text().notNull(),
	postalCode: text("postal_code").notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "addresses_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const verifications = pgTable("verifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const brands = pgTable("brands", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	logoUrl: text("logo_url"),
}, (table) => [
	unique("brands_slug_unique").on(table.slug),
]);

export const guests = pgTable("guests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionToken: text("session_token").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("guests_session_token_unique").on(table.sessionToken),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	categoryId: uuid("category_id"),
	genderId: uuid("gender_id"),
	brandId: uuid("brand_id"),
	productTypeId: uuid("product_type_id"),
	isPublished: boolean("is_published").default(false).notNull(),
	defaultVariantId: uuid("default_variant_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	productCode: text("product_code"),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.genderId],
			foreignColumns: [genders.id],
			name: "products_gender_id_genders_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "products_brand_id_brands_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.productTypeId],
			foreignColumns: [productTypes.id],
			name: "products_product_type_id_product_types_id_fk"
		}).onDelete("set null"),
]);

export const productVariants = pgTable("product_variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	sku: text().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	salePrice: numeric("sale_price", { precision: 10, scale:  2 }),
	inStock: integer("in_stock").default(0).notNull(),
	weight: real(),
	dimensions: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("product_variants_sku_unique").on(table.sku),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	userId: uuid("user_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "reviews_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const carts = pgTable("carts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	guestId: uuid("guest_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "carts_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.guestId],
			foreignColumns: [guests.id],
			name: "carts_guest_id_guests_id_fk"
		}).onDelete("set null"),
]);

export const wishlists = pgTable("wishlists", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	productId: uuid("product_id").notNull(),
	addedAt: timestamp("added_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("wishlists_user_product_uniq").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wishlists_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "wishlists_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const coupons = pgTable("coupons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	discountType: discountType("discount_type").notNull(),
	discountValue: numeric("discount_value").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	maxUsage: integer("max_usage").default(0).notNull(),
	usedCount: integer("used_count").default(0).notNull(),
}, (table) => [
	unique("coupons_code_unique").on(table.code),
]);

export const collections = pgTable("collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isFeatured: boolean("is_featured").default(false).notNull(),
}, (table) => [
	unique("collections_slug_unique").on(table.slug),
]);

export const productImages = pgTable("product_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id"),
	url: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	isPrimary: boolean("is_primary").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_images_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "product_images_variant_id_product_variants_id_fk"
		}).onDelete("set null"),
]);

export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	productVariantId: uuid("product_variant_id").notNull(),
	quantity: integer().default(1).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_items_cart_id_carts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productVariantId],
			foreignColumns: [productVariants.id],
			name: "cart_items_product_variant_id_product_variants_id_fk"
		}).onDelete("restrict"),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	status: orderStatus().default('pending').notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	shippingAddressId: uuid("shipping_address_id"),
	billingAddressId: uuid("billing_address_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.shippingAddressId],
			foreignColumns: [addresses.id],
			name: "orders_shipping_address_id_addresses_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.billingAddressId],
			foreignColumns: [addresses.id],
			name: "orders_billing_address_id_addresses_id_fk"
		}).onDelete("set null"),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productVariantId: uuid("product_variant_id").notNull(),
	quantity: integer().default(1).notNull(),
	priceAtPurchase: numeric("price_at_purchase", { precision: 10, scale:  2 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productVariantId],
			foreignColumns: [productVariants.id],
			name: "order_items_product_variant_id_product_variants_id_fk"
		}).onDelete("restrict"),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	method: paymentMethod().notNull(),
	status: paymentStatus().default('initiated').notNull(),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	transactionId: text("transaction_id"),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payments_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const attributeValues = pgTable("attribute_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	attributeId: uuid("attribute_id").notNull(),
	value: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.attributeId],
			foreignColumns: [attributes.id],
			name: "attribute_values_attribute_id_attributes_id_fk"
		}).onDelete("cascade"),
]);

export const colors = pgTable("colors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	hexCode: text("hex_code").notNull(),
}, (table) => [
	unique("colors_slug_unique").on(table.slug),
]);

export const sizes = pgTable("sizes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	sortOrder: integer("sort_order").notNull(),
}, (table) => [
	unique("sizes_slug_unique").on(table.slug),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	isAdmin: boolean("is_admin").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const sessions = pgTable("sessions", {
	id: uuid().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_token_unique").on(table.token),
]);

export const productCollections = pgTable("product_collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	collectionId: uuid("collection_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_collections_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "product_collections_collection_id_collections_id_fk"
		}).onDelete("cascade"),
]);

export const genders = pgTable("genders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	label: text().notNull(),
	slug: text().notNull(),
}, (table) => [
	unique("genders_slug_unique").on(table.slug),
]);

export const productTypes = pgTable("product_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("product_types_name_unique").on(table.name),
]);

export const attributes = pgTable("attributes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	displayName: text("display_name").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("attributes_name_unique").on(table.name),
]);

export const productTypeAttributes = pgTable("product_type_attributes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productTypeId: uuid("product_type_id").notNull(),
	attributeId: uuid("attribute_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productTypeId],
			foreignColumns: [productTypes.id],
			name: "product_type_attributes_product_type_id_product_types_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.attributeId],
			foreignColumns: [attributes.id],
			name: "product_type_attributes_attribute_id_attributes_id_fk"
		}).onDelete("cascade"),
	unique("product_type_attributes_product_type_id_attribute_id_unique").on(table.productTypeId, table.attributeId),
]);

export const variantAttributeValues = pgTable("variant_attribute_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	variantId: uuid("variant_id").notNull(),
	attributeValueId: uuid("attribute_value_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.attributeValueId],
			foreignColumns: [attributeValues.id],
			name: "variant_attribute_values_attribute_value_id_attribute_values_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "variant_attribute_values_variant_id_product_variants_id_fk"
		}).onDelete("cascade"),
	unique("variant_attribute_values_variant_id_attribute_value_id_unique").on(table.variantId, table.attributeValueId),
]);
