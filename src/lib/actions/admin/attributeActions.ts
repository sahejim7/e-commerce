"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { 
  attributes, 
  attributeValues, 
  productTypes, 
  productTypeAttributes,
  variantAttributeValues,
  productVariants
} from "@/lib/db/schema";
import { eq, asc, count, inArray } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const createAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required").max(100, "Attribute name must be less than 100 characters"),
  displayName: z.string().min(1, "Display name is required").max(100, "Display name must be less than 100 characters"),
});

const createAttributeValueSchema = z.object({
  attributeId: z.string().uuid("Invalid attribute ID"),
  value: z.string().min(1, "Attribute value is required").max(100, "Attribute value must be less than 100 characters"),
  sortOrder: z.number().int().min(0).optional().default(0),
});

// Types
export type AttributeWithValues = {
  id: string;
  name: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
  values: Array<{
    id: string;
    value: string;
    sortOrder: number;
    createdAt: Date;
  }>;
  productTypeCount: number;
  variantCount: number;
};

export type AttributeValueWithUsage = {
  id: string;
  attributeId: string;
  value: string;
  sortOrder: number;
  createdAt: Date;
  variantCount: number;
};

// Server Actions
export async function getAttributes(): Promise<AttributeWithValues[]> {
  try {
    // Get all attributes
    const attributesData = await db
      .select()
      .from(attributes)
      .orderBy(asc(attributes.displayName));

    console.log(`[DEBUG] Found ${attributesData.length} attributes in database:`, attributesData.map(a => `${a.name} (${a.displayName})`));

    // Get values for each attribute
    const attributesWithValues: AttributeWithValues[] = [];
    
    for (const attribute of attributesData) {
      // Get attribute values
      const values = await db
        .select({
          id: attributeValues.id,
          value: attributeValues.value,
          sortOrder: attributeValues.sortOrder,
          createdAt: attributeValues.createdAt,
        })
        .from(attributeValues)
        .where(eq(attributeValues.attributeId, attribute.id))
        .orderBy(asc(attributeValues.sortOrder), asc(attributeValues.value));

      // Get product type count for this attribute
      const productTypeCountResult = await db
        .select({ count: count() })
        .from(productTypeAttributes)
        .where(eq(productTypeAttributes.attributeId, attribute.id));

      // Get variant count for this attribute
      const variantCountResult = await db
        .select({ count: count() })
        .from(variantAttributeValues)
        .innerJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
        .where(eq(attributeValues.attributeId, attribute.id));

      attributesWithValues.push({
        ...attribute,
        values,
        productTypeCount: productTypeCountResult[0]?.count || 0,
        variantCount: variantCountResult[0]?.count || 0,
      });
    }

    return attributesWithValues;
  } catch (error) {
    console.error("Error fetching attributes:", error);
    throw new Error("Failed to fetch attributes");
  }
}

export async function getAttributeValues(attributeId: string): Promise<AttributeValueWithUsage[]> {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attributeId)) {
      throw new Error("Invalid attribute ID");
    }

    // Get attribute values with usage count
    const values = await db
      .select({
        id: attributeValues.id,
        attributeId: attributeValues.attributeId,
        value: attributeValues.value,
        sortOrder: attributeValues.sortOrder,
        createdAt: attributeValues.createdAt,
        variantCount: count(variantAttributeValues.id),
      })
      .from(attributeValues)
      .leftJoin(variantAttributeValues, eq(variantAttributeValues.attributeValueId, attributeValues.id))
      .where(eq(attributeValues.attributeId, attributeId))
      .groupBy(attributeValues.id, attributeValues.attributeId, attributeValues.value, attributeValues.sortOrder, attributeValues.createdAt)
      .orderBy(asc(attributeValues.sortOrder), asc(attributeValues.value));

    return values;
  } catch (error) {
    console.error("Error fetching attribute values:", error);
    throw new Error("Failed to fetch attribute values");
  }
}

export async function createAttribute(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
      displayName: formData.get("displayName") as string,
    };

    // Validate data
    const validatedData = createAttributeSchema.parse(rawData);

    // Check if attribute with same name already exists
    const existingAttribute = await db
      .select()
      .from(attributes)
      .where(eq(attributes.name, validatedData.name))
      .limit(1);

    if (existingAttribute.length > 0) {
      return { success: false, error: "An attribute with this name already exists" };
    }

    // Create attribute
    const [newAttribute] = await db
      .insert(attributes)
      .values({
        name: validatedData.name,
        displayName: validatedData.displayName,
      })
      .returning();

    revalidatePath("/admin/attributes");
    return { success: true, attribute: newAttribute };
  } catch (error) {
    console.error("Error creating attribute:", error);
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, error: "Failed to create attribute" };
  }
}

export async function addAttributeValue(formData: FormData) {
  try {
    const rawData = {
      attributeId: formData.get("attributeId") as string,
      value: formData.get("value") as string,
      sortOrder: formData.get("sortOrder") ? parseInt(formData.get("sortOrder") as string) : 0,
    };

    // Validate data
    const validatedData = createAttributeValueSchema.parse(rawData);

    // Check if attribute exists
    const existingAttribute = await db
      .select({ id: attributes.id })
      .from(attributes)
      .where(eq(attributes.id, validatedData.attributeId))
      .limit(1);

    if (!existingAttribute.length) {
      return { success: false, error: "Attribute not found" };
    }

    // Check if attribute value already exists for this attribute
    const existingValue = await db
      .select()
      .from(attributeValues)
      .where(
        eq(attributeValues.attributeId, validatedData.attributeId) &&
        eq(attributeValues.value, validatedData.value)
      )
      .limit(1);

    if (existingValue.length > 0) {
      return { success: false, error: "This value already exists for this attribute" };
    }

    // Create attribute value
    const [newAttributeValue] = await db
      .insert(attributeValues)
      .values({
        attributeId: validatedData.attributeId,
        value: validatedData.value,
        sortOrder: validatedData.sortOrder,
      })
      .returning();

    revalidatePath("/admin/attributes");
    return { success: true, attributeValue: newAttributeValue };
  } catch (error) {
    console.error("Error creating attribute value:", error);
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, error: "Failed to create attribute value" };
  }
}

// Create attribute value on-the-fly (simplified version for dynamic select)
export async function createAttributeValueOnTheFly(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string, // This will be the attribute value
    };

    // For on-the-fly creation, we need the attributeId to be passed in the form
    const attributeId = formData.get("attributeId") as string;
    
    if (!attributeId) {
      return { success: false, error: "Attribute ID is required" };
    }

    // Validate data
    const validatedData = {
      attributeId,
      value: rawData.name,
      sortOrder: 0,
    };

    // Check if attribute exists
    const existingAttribute = await db
      .select({ id: attributes.id })
      .from(attributes)
      .where(eq(attributes.id, attributeId))
      .limit(1);

    if (!existingAttribute.length) {
      return { success: false, error: "Attribute not found" };
    }

    // Check if attribute value already exists for this attribute
    const existingValue = await db
      .select()
      .from(attributeValues)
      .where(
        eq(attributeValues.attributeId, attributeId) &&
        eq(attributeValues.value, validatedData.value)
      )
      .limit(1);

    if (existingValue.length > 0) {
      return { success: false, error: "This value already exists for this attribute" };
    }

    // Create attribute value
    const [newAttributeValue] = await db
      .insert(attributeValues)
      .values({
        attributeId: validatedData.attributeId,
        value: validatedData.value,
        sortOrder: validatedData.sortOrder,
      })
      .returning();

    revalidatePath("/admin/attributes");
    return { success: true, attributeValue: newAttributeValue };
  } catch (error) {
    console.error("Error creating attribute value on-the-fly:", error);
    return { success: false, error: "Failed to create attribute value" };
  }
}

export async function deleteAttribute(attributeId: string) {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attributeId)) {
      return { success: false, error: "Invalid attribute ID" };
    }

    // Check if attribute exists
    const existingAttribute = await db
      .select({ id: attributes.id })
      .from(attributes)
      .where(eq(attributes.id, attributeId))
      .limit(1);

    if (!existingAttribute.length) {
      return { success: false, error: "Attribute not found" };
    }

    // Check if attribute is used by any product types
    const productTypesUsingAttribute = await db
      .select({ count: count() })
      .from(productTypeAttributes)
      .where(eq(productTypeAttributes.attributeId, attributeId));

    if (productTypesUsingAttribute[0]?.count > 0) {
      return { 
        success: false, 
        error: `Cannot delete attribute. It is currently used by ${productTypesUsingAttribute[0].count} product type(s).` 
      };
    }

    // Check if attribute values are used by any variants
    const variantsUsingAttributeValues = await db
      .select({ count: count() })
      .from(variantAttributeValues)
      .innerJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
      .where(eq(attributeValues.attributeId, attributeId));

    if (variantsUsingAttributeValues[0]?.count > 0) {
      return { 
        success: false, 
        error: `Cannot delete attribute. Its values are currently used by ${variantsUsingAttributeValues[0].count} variant(s).` 
      };
    }

    // Delete attribute (attribute values will be deleted due to cascade)
    await db
      .delete(attributes)
      .where(eq(attributes.id, attributeId));

    revalidatePath("/admin/attributes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting attribute:", error);
    return { success: false, error: "Failed to delete attribute" };
  }
}

export async function deleteAttributeValue(valueId: string) {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valueId)) {
      return { success: false, error: "Invalid attribute value ID" };
    }

    // Check if attribute value exists
    const existingValue = await db
      .select({ id: attributeValues.id })
      .from(attributeValues)
      .where(eq(attributeValues.id, valueId))
      .limit(1);

    if (!existingValue.length) {
      return { success: false, error: "Attribute value not found" };
    }

    // Check if attribute value is used by any variants
    const variantsUsingValue = await db
      .select({ count: count() })
      .from(variantAttributeValues)
      .where(eq(variantAttributeValues.attributeValueId, valueId));

    if (variantsUsingValue[0]?.count > 0) {
      return { 
        success: false, 
        error: `Cannot delete attribute value. It is currently used by ${variantsUsingValue[0].count} variant(s).` 
      };
    }

    // Delete attribute value
    await db
      .delete(attributeValues)
      .where(eq(attributeValues.id, valueId));

    revalidatePath("/admin/attributes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting attribute value:", error);
    return { success: false, error: "Failed to delete attribute value" };
  }
}
