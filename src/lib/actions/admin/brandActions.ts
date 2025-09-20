"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { brands, products } from "@/lib/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100, "Brand name must be less than 100 characters"),
  slug: z.string().min(1, "Brand slug is required").max(100, "Brand slug must be less than 100 characters"),
  logoUrl: z.string().url("Invalid logo URL").optional().nullable(),
});

// Types
export type BrandWithProductCount = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount: number;
};

// Server Actions
export async function getBrands(): Promise<BrandWithProductCount[]> {
  try {
    const brandsData = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        logoUrl: brands.logoUrl,
        productCount: count(products.id),
      })
      .from(brands)
      .leftJoin(products, eq(products.brandId, brands.id))
      .groupBy(brands.id, brands.name, brands.slug, brands.logoUrl)
      .orderBy(asc(brands.name));

    return brandsData;
  } catch (error) {
    console.error("Error fetching brands:", error);
    throw new Error("Failed to fetch brands");
  }
}

export async function createBrand(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      logoUrl: formData.get("logoUrl") as string || null,
    };

    // Validate data
    const validatedData = createBrandSchema.parse(rawData);

    // Check if brand with same name or slug already exists
    const existingBrand = await db
      .select()
      .from(brands)
      .where(eq(brands.slug, validatedData.slug))
      .limit(1);

    if (existingBrand.length > 0) {
      return { success: false, error: "A brand with this slug already exists" };
    }

    // Create brand
    const [newBrand] = await db
      .insert(brands)
      .values({
        name: validatedData.name,
        slug: validatedData.slug,
        logoUrl: validatedData.logoUrl,
      })
      .returning();

    revalidatePath("/admin/attributes");
    return { success: true, brand: newBrand };
  } catch (error) {
    console.error("Error creating brand:", error);
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, error: "Failed to create brand" };
  }
}

// Create brand on-the-fly (simplified version for dynamic select)
export async function createBrandOnTheFly(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
    };

    if (!rawData.name) {
      return { success: false, error: "Brand name is required" };
    }

    // Generate slug from name
    const slug = rawData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if brand with same name or slug already exists
    const existingBrand = await db
      .select()
      .from(brands)
      .where(eq(brands.slug, slug))
      .limit(1);

    if (existingBrand.length > 0) {
      return { success: false, error: "A brand with this name already exists" };
    }

    // Create brand
    const [newBrand] = await db
      .insert(brands)
      .values({
        name: rawData.name,
        slug: slug,
        logoUrl: null,
      })
      .returning();

    revalidatePath("/admin/attributes");
    return { success: true, brand: newBrand };
  } catch (error) {
    console.error("Error creating brand on-the-fly:", error);
    return { success: false, error: "Failed to create brand" };
  }
}

export async function deleteBrand(brandId: string) {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandId)) {
      return { success: false, error: "Invalid brand ID" };
    }

    // Check if brand exists
    const existingBrand = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    if (!existingBrand.length) {
      return { success: false, error: "Brand not found" };
    }

    // Check if brand is used by any products
    const productsUsingBrand = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.brandId, brandId));

    if (productsUsingBrand[0]?.count > 0) {
      return { 
        success: false, 
        error: `Cannot delete brand. It is currently used by ${productsUsingBrand[0].count} product(s).` 
      };
    }

    // Delete brand
    await db
      .delete(brands)
      .where(eq(brands.id, brandId));

    revalidatePath("/admin/attributes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting brand:", error);
    return { success: false, error: "Failed to delete brand" };
  }
}
