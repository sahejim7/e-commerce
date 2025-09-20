import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { categories } from './categories';
import { genders } from './filters/genders';
import { brands } from './brands';
import { productTypes } from './attributes';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  productCode: text('product_code'),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  genderId: uuid('gender_id').references(() => genders.id, { onDelete: 'set null' }),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  productTypeId: uuid('product_type_id').references(() => productTypes.id, { onDelete: 'set null' }),
  isPublished: boolean('is_published').notNull().default(false),
  defaultVariantId: uuid('default_variant_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  gender: one(genders, {
    fields: [products.genderId],
    references: [genders.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  productType: one(productTypes, {
    fields: [products.productTypeId],
    references: [productTypes.id],
  }),
}));

export const insertProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  productCode: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  genderId: z.string().uuid().optional().nullable(),
  brandId: z.string().uuid().optional().nullable(),
  productTypeId: z.string().uuid().optional().nullable(),
  isPublished: z.boolean().optional(),
  defaultVariantId: z.string().uuid().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export const selectProductSchema = insertProductSchema.extend({
  id: z.string().uuid(),
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type SelectProduct = z.infer<typeof selectProductSchema>;
