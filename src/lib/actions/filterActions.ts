"use server";

import { db } from "@/lib/db";
import { 
  brands, 
  categories, 
  genders,
  attributes, 
  attributeValues, 
  productVariants,
  products,
  variantAttributeValues
} from "@/lib/db/schema";
import { ilike, sql, eq, and, inArray } from "drizzle-orm";

export interface FilterOption {
  name: string;
  slug: string;
}

export interface AttributeFilterOption {
  name: string;
  displayName: string;
  values: Array<{
    value: string;
    slug: string;
  }>;
}

export interface FilterOptions {
  brands: FilterOption[];
  categories: FilterOption[];
  genders: FilterOption[];
  attributes: AttributeFilterOption[];
}

export async function getFilterOptions(): Promise<FilterOptions> {
  try {
    // Fetch all brands that have published products
    const brandsResult = await db
      .selectDistinct({
        name: brands.name,
        slug: brands.slug,
      })
      .from(brands)
      .innerJoin(products, eq(products.brandId, brands.id))
      .where(eq(products.isPublished, true))
      .orderBy(brands.name);

    // Fetch all categories that have published products
    const categoriesResult = await db
      .selectDistinct({
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .innerJoin(products, eq(products.categoryId, categories.id))
      .where(eq(products.isPublished, true))
      .orderBy(categories.name);

    // Fetch all genders that have published products
    const gendersResult = await db
      .selectDistinct({
        name: genders.label,
        slug: genders.slug,
      })
      .from(genders)
      .innerJoin(products, eq(products.genderId, genders.id))
      .where(eq(products.isPublished, true))
      .orderBy(genders.label);

    // Fetch all attributes and their values that are used by published products
    const attributesResult = await db
      .select({
        attributeId: attributes.id,
        attributeName: attributes.name,
        attributeDisplayName: attributes.displayName,
        attributeValueId: attributeValues.id,
        attributeValue: attributeValues.value,
        attributeValueSortOrder: attributeValues.sortOrder,
      })
      .from(attributes)
      .innerJoin(attributeValues, eq(attributeValues.attributeId, attributes.id))
      .innerJoin(variantAttributeValues, eq(variantAttributeValues.attributeValueId, attributeValues.id))
      .innerJoin(productVariants, eq(productVariants.id, variantAttributeValues.variantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(eq(products.isPublished, true))
      .orderBy(attributes.displayName, attributeValues.sortOrder, attributeValues.value);

    // Group attributes and their values
    const attributesMap = new Map<string, AttributeFilterOption>();
    
    for (const row of attributesResult) {
      const attributeKey = row.attributeId;
      
      if (!attributesMap.has(attributeKey)) {
        attributesMap.set(attributeKey, {
          name: row.attributeName,
          displayName: row.attributeDisplayName,
          values: [],
        });
      }
      
      const attribute = attributesMap.get(attributeKey)!;
      const valueSlug = row.attributeValue.toLowerCase().replace(/\s+/g, '-');
      
      // Check if this value is already added (avoid duplicates)
      if (!attribute.values.some(v => v.slug === valueSlug)) {
        attribute.values.push({
          value: row.attributeValue,
          slug: valueSlug,
        });
      }
    }

    return {
      brands: brandsResult,
      categories: categoriesResult,
      genders: gendersResult,
      attributes: Array.from(attributesMap.values()),
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    throw new Error("Failed to fetch filter options");
  }
}
