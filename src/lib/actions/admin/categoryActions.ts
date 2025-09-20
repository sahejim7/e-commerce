"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { categories, products, collections } from "@/lib/db/schema";
import { eq, asc, count, isNull } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name must be less than 100 characters"),
  slug: z.string().min(1, "Category slug is required").max(100, "Category slug must be less than 100 characters"),
  parentId: z.string().uuid("Invalid parent category ID").optional().nullable(),
});

// Types
export type CategoryWithProductCount = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  productCount: number;
  children?: CategoryWithProductCount[];
};

// Server Actions
export async function getCategories(): Promise<CategoryWithProductCount[]> {
  try {
    const categoriesData = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.slug, categories.parentId)
      .orderBy(asc(categories.name));

    return categoriesData;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

export async function getRootCategories(): Promise<CategoryWithProductCount[]> {
  try {
    const categoriesData = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .where(isNull(categories.parentId))
      .groupBy(categories.id, categories.name, categories.slug, categories.parentId)
      .orderBy(asc(categories.name));

    return categoriesData;
  } catch (error) {
    console.error("Error fetching root categories:", error);
    throw new Error("Failed to fetch root categories");
  }
}

export async function createCategory(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      parentId: formData.get("parentId") as string || null,
    };

    // Validate data
    const validatedData = createCategorySchema.parse(rawData);

    // Check if category with same slug already exists
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, validatedData.slug))
      .limit(1);

    if (existingCategory.length > 0) {
      return { success: false, error: "A category with this slug already exists" };
    }

    // If parentId is provided, verify parent category exists
    if (validatedData.parentId) {
      const parentCategory = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, validatedData.parentId))
        .limit(1);

      if (!parentCategory.length) {
        return { success: false, error: "Parent category not found" };
      }
    }

    // Create category
    const [newCategory] = await db
      .insert(categories)
      .values({
        name: validatedData.name,
        slug: validatedData.slug,
        parentId: validatedData.parentId,
      })
      .returning();

    revalidatePath("/admin/attributes");
    return { success: true, category: newCategory };
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, error: "Failed to create category" };
  }
}

// Create category on-the-fly (simplified version for dynamic select)
export async function createCategoryOnTheFly(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
    };

    if (!rawData.name) {
      return { success: false, error: "Category name is required" };
    }

    // Generate slug from name
    const slug = rawData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if category with same slug already exists
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existingCategory.length > 0) {
      return { success: false, error: "A category with this name already exists" };
    }

    // Create category
    const [newCategory] = await db
      .insert(categories)
      .values({
        name: rawData.name,
        slug: slug,
        parentId: null,
      })
      .returning();

    revalidatePath("/admin/attributes");
    return { success: true, category: newCategory };
  } catch (error) {
    console.error("Error creating category on-the-fly:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
      return { success: false, error: "Invalid category ID" };
    }

    // Check if category exists
    const existingCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!existingCategory.length) {
      return { success: false, error: "Category not found" };
    }

    // Check if category is used by any products
    const productsUsingCategory = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.categoryId, categoryId));

    if (productsUsingCategory[0]?.count > 0) {
      return { 
        success: false, 
        error: `Cannot delete category. It is currently used by ${productsUsingCategory[0].count} product(s).` 
      };
    }

    // Check if category has children
    const childCategories = await db
      .select({ count: count() })
      .from(categories)
      .where(eq(categories.parentId, categoryId));

    if (childCategories[0]?.count > 0) {
      return { 
        success: false, 
        error: `Cannot delete category. It has ${childCategories[0].count} subcategory(ies).` 
      };
    }

    // Delete category
    await db
      .delete(categories)
      .where(eq(categories.id, categoryId));

    revalidatePath("/admin/attributes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}

export async function getFeaturedCategories() {
  try {
    const featuredCollections = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        isFeatured: collections.isFeatured,
        createdAt: collections.createdAt,
      })
      .from(collections)
      .where(eq(collections.isFeatured, true))
      .orderBy(asc(collections.name));

    return featuredCollections;
  } catch (error) {
    console.error("Error fetching featured collections:", error);
    throw new Error("Failed to fetch featured collections");
  }
}
