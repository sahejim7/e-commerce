"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { productTypes, products, productTypeAttributes } from "@/lib/db/schema";
import { eq, asc, count, inArray, and } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const createAttributeSetSchema = z.object({
  name: z.string().min(1, "Attribute set name is required").max(100, "Attribute set name must be less than 100 characters"),
});

// Types
export type AttributeSetWithProductCount = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
};

// Server Actions
export async function getAttributeSets(): Promise<AttributeSetWithProductCount[]> {
  try {
    const attributeSetsData = await db
      .select({
        id: productTypes.id,
        name: productTypes.name,
        createdAt: productTypes.createdAt,
        updatedAt: productTypes.updatedAt,
        productCount: count(products.id),
      })
      .from(productTypes)
      .leftJoin(products, eq(products.productTypeId, productTypes.id))
      .groupBy(productTypes.id, productTypes.name, productTypes.createdAt, productTypes.updatedAt)
      .orderBy(asc(productTypes.name));

    return attributeSetsData;
  } catch (error) {
    console.error("Error fetching attribute sets:", error);
    throw new Error("Failed to fetch attribute sets");
  }
}

export async function createAttributeSet(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
    };

    // Validate data
    const validatedData = createAttributeSetSchema.parse(rawData);

    // Check if attribute set with same name already exists
    const existingAttributeSet = await db
      .select()
      .from(productTypes)
      .where(eq(productTypes.name, validatedData.name))
      .limit(1);

    if (existingAttributeSet.length > 0) {
      return { success: false, error: "An attribute set with this name already exists" };
    }

    // Create attribute set
    const [newAttributeSet] = await db
      .insert(productTypes)
      .values({
        name: validatedData.name,
      })
      .returning();

    revalidatePath("/admin/attributes");
    return { success: true, attributeSet: newAttributeSet };
  } catch (error) {
    console.error("Error creating attribute set:", error);
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, error: "Failed to create attribute set" };
  }
}

export async function deleteAttributeSet(attributeSetId: string) {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attributeSetId)) {
      return { success: false, error: "Invalid attribute set ID" };
    }

    // Check if attribute set exists
    const existingAttributeSet = await db
      .select({ id: productTypes.id })
      .from(productTypes)
      .where(eq(productTypes.id, attributeSetId))
      .limit(1);

    if (!existingAttributeSet.length) {
      return { success: false, error: "Attribute set not found" };
    }

    // Check if attribute set is used by any products
    const productsUsingAttributeSet = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.productTypeId, attributeSetId));

    if (productsUsingAttributeSet[0]?.count > 0) {
      return { 
        success: false, 
        error: `Cannot delete attribute set. It is currently used by ${productsUsingAttributeSet[0].count} product(s).` 
      };
    }

    // Delete attribute set
    await db
      .delete(productTypes)
      .where(eq(productTypes.id, attributeSetId));

    revalidatePath("/admin/attributes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting attribute set:", error);
    return { success: false, error: "Failed to delete attribute set" };
  }
}

// New server actions for attribute set management
export async function getAttributesForAttributeSet(attributeSetId: string) {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attributeSetId)) {
      throw new Error("Invalid attribute set ID");
    }

    const linkedAttributes = await db
      .select({
        id: productTypeAttributes.attributeId,
      })
      .from(productTypeAttributes)
      .where(eq(productTypeAttributes.productTypeId, attributeSetId));

    return linkedAttributes.map(attr => attr.id);
  } catch (error) {
    console.error("Error fetching attributes for attribute set:", error);
    throw new Error("Failed to fetch attributes for attribute set");
  }
}

export async function updateAttributesForSet(attributeSetId: string, attributeIds: string[]) {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attributeSetId)) {
      return { success: false, error: "Invalid attribute set ID" };
    }

    // Validate all attribute IDs
    for (const attributeId of attributeIds) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attributeId)) {
        return { success: false, error: "Invalid attribute ID" };
      }
    }

    // Check if attribute set exists
    const existingAttributeSet = await db
      .select({ id: productTypes.id })
      .from(productTypes)
      .where(eq(productTypes.id, attributeSetId))
      .limit(1);

    if (!existingAttributeSet.length) {
      return { success: false, error: "Attribute set not found" };
    }

    // Get current linked attributes
    const currentAttributes = await db
      .select({ attributeId: productTypeAttributes.attributeId })
      .from(productTypeAttributes)
      .where(eq(productTypeAttributes.productTypeId, attributeSetId));

    const currentAttributeIds = currentAttributes.map(attr => attr.attributeId);
    
    // Find attributes to add and remove
    const attributesToAdd = attributeIds.filter(id => !currentAttributeIds.includes(id));
    const attributesToRemove = currentAttributeIds.filter(id => !attributeIds.includes(id));

    // Remove unlinked attributes
    if (attributesToRemove.length > 0) {
      await db
        .delete(productTypeAttributes)
        .where(
          and(
            eq(productTypeAttributes.productTypeId, attributeSetId),
            inArray(productTypeAttributes.attributeId, attributesToRemove)
          )
        );
    }

    // Add new linked attributes
    if (attributesToAdd.length > 0) {
      await db
        .insert(productTypeAttributes)
        .values(
          attributesToAdd.map(attributeId => ({
            productTypeId: attributeSetId,
            attributeId,
          }))
        );
    }

    revalidatePath("/admin/attributes");
    return { success: true };
  } catch (error) {
    console.error("Error updating attributes for set:", error);
    return { success: false, error: "Failed to update attributes for set" };
  }
}

// Legacy exports for backward compatibility (will be removed in future versions)
export const getProductTypes = getAttributeSets;
export const createProductType = createAttributeSet;
export const deleteProductType = deleteAttributeSet;
export type ProductTypeWithProductCount = AttributeSetWithProductCount;







