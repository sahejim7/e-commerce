import { relations } from "drizzle-orm/relations";
import { categories, users, accounts, addresses, products, genders, brands, productTypes, productVariants, reviews, carts, guests, wishlists, productImages, cartItems, orders, orderItems, payments, attributes, attributeValues, sessions, productCollections, collections, productTypeAttributes, variantAttributeValues } from "./schema";

export const categoriesRelations = relations(categories, ({one, many}) => ({
	category: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categories_parentId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_parentId_categories_id"
	}),
	products: many(products),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(accounts),
	addresses: many(addresses),
	reviews: many(reviews),
	carts: many(carts),
	wishlists: many(wishlists),
	orders: many(orders),
	sessions: many(sessions),
}));

export const addressesRelations = relations(addresses, ({one, many}) => ({
	user: one(users, {
		fields: [addresses.userId],
		references: [users.id]
	}),
	orders_shippingAddressId: many(orders, {
		relationName: "orders_shippingAddressId_addresses_id"
	}),
	orders_billingAddressId: many(orders, {
		relationName: "orders_billingAddressId_addresses_id"
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	gender: one(genders, {
		fields: [products.genderId],
		references: [genders.id]
	}),
	brand: one(brands, {
		fields: [products.brandId],
		references: [brands.id]
	}),
	productType: one(productTypes, {
		fields: [products.productTypeId],
		references: [productTypes.id]
	}),
	productVariants: many(productVariants),
	reviews: many(reviews),
	wishlists: many(wishlists),
	productImages: many(productImages),
	productCollections: many(productCollections),
}));

export const gendersRelations = relations(genders, ({many}) => ({
	products: many(products),
}));

export const brandsRelations = relations(brands, ({many}) => ({
	products: many(products),
}));

export const productTypesRelations = relations(productTypes, ({many}) => ({
	products: many(products),
	productTypeAttributes: many(productTypeAttributes),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
	productImages: many(productImages),
	cartItems: many(cartItems),
	orderItems: many(orderItems),
	variantAttributeValues: many(variantAttributeValues),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	product: one(products, {
		fields: [reviews.productId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
}));

export const cartsRelations = relations(carts, ({one, many}) => ({
	user: one(users, {
		fields: [carts.userId],
		references: [users.id]
	}),
	guest: one(guests, {
		fields: [carts.guestId],
		references: [guests.id]
	}),
	cartItems: many(cartItems),
}));

export const guestsRelations = relations(guests, ({many}) => ({
	carts: many(carts),
}));

export const wishlistsRelations = relations(wishlists, ({one}) => ({
	user: one(users, {
		fields: [wishlists.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [wishlists.productId],
		references: [products.id]
	}),
}));

export const productImagesRelations = relations(productImages, ({one}) => ({
	product: one(products, {
		fields: [productImages.productId],
		references: [products.id]
	}),
	productVariant: one(productVariants, {
		fields: [productImages.variantId],
		references: [productVariants.id]
	}),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
	productVariant: one(productVariants, {
		fields: [cartItems.productVariantId],
		references: [productVariants.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	address_shippingAddressId: one(addresses, {
		fields: [orders.shippingAddressId],
		references: [addresses.id],
		relationName: "orders_shippingAddressId_addresses_id"
	}),
	address_billingAddressId: one(addresses, {
		fields: [orders.billingAddressId],
		references: [addresses.id],
		relationName: "orders_billingAddressId_addresses_id"
	}),
	orderItems: many(orderItems),
	payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	productVariant: one(productVariants, {
		fields: [orderItems.productVariantId],
		references: [productVariants.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id]
	}),
}));

export const attributeValuesRelations = relations(attributeValues, ({one, many}) => ({
	attribute: one(attributes, {
		fields: [attributeValues.attributeId],
		references: [attributes.id]
	}),
	variantAttributeValues: many(variantAttributeValues),
}));

export const attributesRelations = relations(attributes, ({many}) => ({
	attributeValues: many(attributeValues),
	productTypeAttributes: many(productTypeAttributes),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const productCollectionsRelations = relations(productCollections, ({one}) => ({
	product: one(products, {
		fields: [productCollections.productId],
		references: [products.id]
	}),
	collection: one(collections, {
		fields: [productCollections.collectionId],
		references: [collections.id]
	}),
}));

export const collectionsRelations = relations(collections, ({many}) => ({
	productCollections: many(productCollections),
}));

export const productTypeAttributesRelations = relations(productTypeAttributes, ({one}) => ({
	productType: one(productTypes, {
		fields: [productTypeAttributes.productTypeId],
		references: [productTypes.id]
	}),
	attribute: one(attributes, {
		fields: [productTypeAttributes.attributeId],
		references: [attributes.id]
	}),
}));

export const variantAttributeValuesRelations = relations(variantAttributeValues, ({one}) => ({
	attributeValue: one(attributeValues, {
		fields: [variantAttributeValues.attributeValueId],
		references: [attributeValues.id]
	}),
	productVariant: one(productVariants, {
		fields: [variantAttributeValues.variantId],
		references: [productVariants.id]
	}),
}));