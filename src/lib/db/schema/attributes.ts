import { pgTable, text, timestamp, uuid, integer, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { products } from './products';
import { productVariants } from './variants';

// Product Types Table
export const productTypes = pgTable('product_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Attributes Table (e.g., Color, Size, Waist Size, etc.)
export const attributes = pgTable('attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // e.g., 'apparel_size', 'waist_size'
  displayName: text('display_name').notNull(), // e.g., 'Apparel Size', 'Waist Size'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Attribute Values Table (e.g., S, M, L, XL for apparel_size)
export const attributeValues = pgTable('attribute_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  attributeId: uuid('attribute_id').references(() => attributes.id, { onDelete: 'cascade' }).notNull(),
  value: text('value').notNull(), // e.g., 'S', 'M', 'L', 'Red', 'Blue'
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Join table linking product types to their allowed attributes
export const productTypeAttributes = pgTable('product_type_attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  productTypeId: uuid('product_type_id').references(() => productTypes.id, { onDelete: 'cascade' }).notNull(),
  attributeId: uuid('attribute_id').references(() => attributes.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure a product type can't have the same attribute twice
  uniqueProductTypeAttribute: unique().on(table.productTypeId, table.attributeId),
}));

// Join table linking product variants to their attribute values
export const variantAttributeValues = pgTable('variant_attribute_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }).notNull(),
  attributeValueId: uuid('attribute_value_id').references(() => attributeValues.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure a variant can't have the same attribute value twice
  uniqueVariantAttributeValue: unique().on(table.variantId, table.attributeValueId),
}));

// Relations
export const productTypesRelations = relations(productTypes, ({ many }) => ({
  products: many(products),
  productTypeAttributes: many(productTypeAttributes),
}));

export const attributesRelations = relations(attributes, ({ many }) => ({
  attributeValues: many(attributeValues),
  productTypeAttributes: many(productTypeAttributes),
}));

export const attributeValuesRelations = relations(attributeValues, ({ one, many }) => ({
  attribute: one(attributes, {
    fields: [attributeValues.attributeId],
    references: [attributes.id],
  }),
  variantAttributeValues: many(variantAttributeValues),
}));

export const productTypeAttributesRelations = relations(productTypeAttributes, ({ one }) => ({
  productType: one(productTypes, {
    fields: [productTypeAttributes.productTypeId],
    references: [productTypes.id],
  }),
  attribute: one(attributes, {
    fields: [productTypeAttributes.attributeId],
    references: [attributes.id],
  }),
}));

export const variantAttributeValuesRelations = relations(variantAttributeValues, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantAttributeValues.variantId],
    references: [productVariants.id],
  }),
  attributeValue: one(attributeValues, {
    fields: [variantAttributeValues.attributeValueId],
    references: [attributeValues.id],
  }),
}));

// Zod schemas for validation
export const insertProductTypeSchema = z.object({
  name: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertAttributeSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertAttributeValueSchema = z.object({
  attributeId: z.string().uuid(),
  value: z.string().min(1),
  sortOrder: z.number().int().optional(),
  createdAt: z.date().optional(),
});

export const insertProductTypeAttributeSchema = z.object({
  productTypeId: z.string().uuid(),
  attributeId: z.string().uuid(),
  createdAt: z.date().optional(),
});

export const insertVariantAttributeValueSchema = z.object({
  variantId: z.string().uuid(),
  attributeValueId: z.string().uuid(),
  createdAt: z.date().optional(),
});

// Select schemas
export const selectProductTypeSchema = insertProductTypeSchema.extend({
  id: z.string().uuid(),
});

export const selectAttributeSchema = insertAttributeSchema.extend({
  id: z.string().uuid(),
});

export const selectAttributeValueSchema = insertAttributeValueSchema.extend({
  id: z.string().uuid(),
});

export const selectProductTypeAttributeSchema = insertProductTypeAttributeSchema.extend({
  id: z.string().uuid(),
});

export const selectVariantAttributeValueSchema = insertVariantAttributeValueSchema.extend({
  id: z.string().uuid(),
});

// Type exports
export type InsertProductType = z.infer<typeof insertProductTypeSchema>;
export type SelectProductType = z.infer<typeof selectProductTypeSchema>;
export type InsertAttribute = z.infer<typeof insertAttributeSchema>;
export type SelectAttribute = z.infer<typeof selectAttributeSchema>;
export type InsertAttributeValue = z.infer<typeof insertAttributeValueSchema>;
export type SelectAttributeValue = z.infer<typeof selectAttributeValueSchema>;
export type InsertProductTypeAttribute = z.infer<typeof insertProductTypeAttributeSchema>;
export type SelectProductTypeAttribute = z.infer<typeof selectProductTypeAttributeSchema>;
export type InsertVariantAttributeValue = z.infer<typeof insertVariantAttributeValueSchema>;
export type SelectVariantAttributeValue = z.infer<typeof selectVariantAttributeValueSchema>;















