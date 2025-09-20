  import { pgTable, text, uuid, foreignKey, boolean } from 'drizzle-orm/pg-core';
  import { relations } from 'drizzle-orm';
  import { z } from 'zod';

  export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    parentId: uuid('parent_id'),
    imageUrl: text('image_url'),
    isFeatured: boolean('is_featured').notNull().default(false),
  }, (t) => ({
    parentFk: foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete('set null'),
  }));

  export const categoriesRelations = relations(categories, ({ many, one }) => ({
    parent: one(categories, {
      fields: [categories.parentId],
      references: [categories.id],
    }),
    children: many(categories),
  }));

  export const insertCategorySchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    parentId: z.string().uuid().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    isFeatured: z.boolean().optional().default(false),
  });
  export const selectCategorySchema = insertCategorySchema.extend({
    id: z.string().uuid(),
  });
  export type InsertCategory = z.infer<typeof insertCategorySchema>;
  export type SelectCategory = z.infer<typeof selectCategorySchema>;
