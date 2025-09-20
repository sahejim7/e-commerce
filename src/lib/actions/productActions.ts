"use server";

import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL, exists } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brands,
  categories,
  genders,
  productImages,
  productVariants,
  products,
  // Dynamic attribute schema imports
  attributes,
  attributeValues,
  variantAttributeValues,
  productTypes,
  productTypeAttributes,
} from "@/lib/db/schema";

import { NormalizedProductFilters } from "@/lib/utils/query";

// Utility function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export type ProductListItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  imageUrls: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minSalePrice: number | null;
  maxSalePrice: number | null;
  createdAt: Date;
  subtitle?: string | null;
};

export type FilterOption = {
  name: string;
  slug: string;
};

export type AttributeFilterOption = {
  name: string;
  displayName: string;
  values: Array<{
    value: string;
    slug: string;
  }>;
};

export type HierarchicalCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  children: HierarchicalCategory[];
};

export type FilterOptions = {
  brands: FilterOption[];
  categories: FilterOption[];
  genders: FilterOption[];
  attributes: AttributeFilterOption[];
};

export type ProductsAndFiltersResult = {
  products: ProductListItem[];
  totalCount: number;
  hierarchicalCategories: HierarchicalCategory[];
  availableAttributes: AttributeFilterOption[];
  availableBrands: FilterOption[];
};

/**
 * DEFINITIVE: getProductsAndFilters - The "brain" of the hierarchical filtering system
 * This single action handles all data fetching and processing for the product listing page
 * 
 * Core Architecture:
 * 1. Determine base product set using primary filters (gender, search)
 * 2. Build hierarchical category tree from the base product set
 * 3. Fetch contextual attributes based on selected category
 * 4. Apply all filters to get final products
 */
export async function getProductsAndFilters(searchParams: Record<string, string | string[] | undefined>): Promise<ProductsAndFiltersResult> {
  try {
    // Parse search parameters
    const genderSlugs = Array.isArray(searchParams.gender) ? searchParams.gender : searchParams.gender ? [searchParams.gender] : [];
    const brandSlugs = Array.isArray(searchParams.brand) ? searchParams.brand : searchParams.brand ? [searchParams.brand] : [];
    const categorySlugs = Array.isArray(searchParams.category) ? searchParams.category : searchParams.category ? [searchParams.category] : [];
    const search = typeof searchParams.search === 'string' ? searchParams.search : '';
    const priceParam = typeof searchParams.price === 'string' ? searchParams.price : '';
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest';
    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
    const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit, 10) : 24;

    // STEP A: Determine Base Product Set
    const baseConds: SQL[] = [eq(products.isPublished, true)];

    // Apply primary filters to get base product set
    if (search) {
      const pattern = `%${search}%`;
      baseConds.push(or(ilike(products.name, pattern), ilike(products.description, pattern))!);
    }

    if (genderSlugs.length > 0) {
      baseConds.push(inArray(genders.slug, genderSlugs));
    }

    const baseWhere = and(...baseConds);

    // STEP B: Fetch Contextual Hierarchical Categories
    // Get all subcategories, but filter by gender context (except accessories which show for all genders)
    const allSubcategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
        imageUrl: categories.imageUrl,
        isFeatured: categories.isFeatured,
      })
      .from(categories)
      .where(sql`${categories.parentId} IS NOT NULL`) // Only subcategories (have parentId)
      .orderBy(categories.name);

    // Filter subcategories based on gender context
    // For gender-specific pages, only show categories that have products for that gender
    // For main /products page, show all subcategories including accessories
    let filteredCategories = allSubcategories;
    
    if (genderSlugs.length > 0) {
      // For gender-specific pages, only show categories that have products for this gender
      const categoriesWithProductsForGender = await db
        .select({
          categoryId: products.categoryId,
        })
        .from(products)
        .leftJoin(genders, eq(genders.id, products.genderId))
        .where(and(
          eq(products.isPublished, true),
          inArray(genders.slug, genderSlugs)
        ))
        .groupBy(products.categoryId);

      const categoryIdsWithProducts = categoriesWithProductsForGender.map(c => c.categoryId);
      
      // Show only categories that have products for this gender
      filteredCategories = allSubcategories.filter(cat => 
        categoryIdsWithProducts.includes(cat.id)
      );
    } else {
      // When no gender is selected (main /products page), show all subcategories including accessories
      filteredCategories = allSubcategories;
    }

    const categoriesResult = filteredCategories;

    // Build hierarchical tree from flat category list
    const hierarchicalCategories = buildHierarchicalTree(categoriesResult);

    // STEP C: Fetch Contextual Attributes
    // Get attributes based on currently selected category
    const availableAttributes = await getContextualAttributes(baseWhere, categorySlugs);

    // STEP D: Fetch Available Brands
    const availableBrands = await db
      .selectDistinct({
        name: brands.name,
        slug: brands.slug,
      })
      .from(brands)
      .innerJoin(products, eq(products.brandId, brands.id))
      .leftJoin(genders, eq(genders.id, products.genderId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(baseWhere)
      .orderBy(brands.name);

    // STEP E: Fetch Final Products with All Filters
    const finalProducts = await getFinalProducts({
      search,
      genderSlugs,
      brandSlugs,
      categorySlugs,
      priceParam,
      sort,
      page,
      limit,
      attributeFilters: extractAttributeFilters(searchParams),
    });

    return {
      products: finalProducts.products,
      totalCount: finalProducts.totalCount,
      hierarchicalCategories,
      availableAttributes,
      availableBrands,
    };
  } catch (error) {
    console.error("Error in getProductsAndFilters:", error);
    
    // Return empty result on database timeout or connection errors
    if (error instanceof Error && (
      error.message.includes('ETIMEDOUT') || 
      error.message.includes('fetch failed') ||
      error.message.includes('connection')
    )) {
      console.warn("Database connection timeout, returning empty results");
      return {
        products: [],
        totalCount: 0,
        hierarchicalCategories: [],
        availableAttributes: [],
        availableBrands: [],
      };
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Build hierarchical category tree from flat category list
 * This is the key function that processes parent-child relationships
 */
function buildHierarchicalTree(categories: Array<{
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
}>): HierarchicalCategory[] {
  const categoryMap = new Map<string, HierarchicalCategory>();
  const rootCategories: HierarchicalCategory[] = [];

  // First pass: create all category objects
  for (const category of categories) {
    const hierarchicalCategory: HierarchicalCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      imageUrl: category.imageUrl,
      isFeatured: category.isFeatured,
      children: [],
    };
    categoryMap.set(category.id, hierarchicalCategory);
  }

  // Second pass: build parent-child relationships
  for (const category of categories) {
    const hierarchicalCategory = categoryMap.get(category.id)!;
    
    if (category.parentId && categoryMap.has(category.parentId)) {
      // Has parent - add to parent's children
      const parent = categoryMap.get(category.parentId)!;
      parent.children.push(hierarchicalCategory);
    } else {
      // No parent or parent not found - add to root
      rootCategories.push(hierarchicalCategory);
    }
  }

  // Sort categories: parents first, then children
  const sortCategories = (cats: HierarchicalCategory[]) => {
    cats.sort((a, b) => {
      // Featured categories first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
    
    // Recursively sort children
    cats.forEach(cat => {
      if (cat.children.length > 0) {
        sortCategories(cat.children);
      }
    });
  };

  sortCategories(rootCategories);
  return rootCategories;
}

/**
 * Get contextual attributes based on selected category and product types
 * This ensures attributes are relevant to the current filtering context
 * and intelligently shows attributes based on product types in the current context
 */
async function getContextualAttributes(
  baseWhere: SQL | undefined,
  selectedCategorySlugs: string[]
): Promise<AttributeFilterOption[]> {
  // Build conditions for attribute filtering
  const attributeConds: SQL[] = [];
  
  if (baseWhere) {
    attributeConds.push(baseWhere);
  }

  // If specific categories are selected, focus on those
  if (selectedCategorySlugs.length > 0) {
    attributeConds.push(inArray(categories.slug, selectedCategorySlugs));
  }

  const attributeWhere = attributeConds.length > 0 ? and(...attributeConds) : undefined;

  // First, get the product types that are present in the current context
  const productTypesInContext = await db
    .selectDistinct({
      productTypeId: products.productTypeId,
      productTypeName: productTypes.name,
    })
    .from(products)
    .innerJoin(productTypes, eq(productTypes.id, products.productTypeId))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(attributeWhere);

  // Get the attributes that are relevant to these product types
  const relevantAttributeIds = await db
    .selectDistinct({
      attributeId: productTypeAttributes.attributeId,
    })
    .from(productTypeAttributes)
    .where(inArray(productTypeAttributes.productTypeId, productTypesInContext.map(pt => pt.productTypeId).filter(id => id !== null) as string[]));

  // If no relevant attributes found, fall back to the original logic
  if (relevantAttributeIds.length === 0) {
    // Fall back to original logic
    return getContextualAttributesFallback(attributeWhere);
  }

  // Fetch attributes and their values, but only for relevant attributes
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
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(
        attributeWhere,
        inArray(attributes.id, relevantAttributeIds.map(a => a.attributeId))
      )
    )
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

  return Array.from(attributesMap.values());
}

/**
 * Fallback function for getting contextual attributes when product type filtering fails
 */
async function getContextualAttributesFallback(attributeWhere: SQL | undefined): Promise<AttributeFilterOption[]> {
  // Fetch attributes and their values using the original logic
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
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(attributeWhere)
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

  return Array.from(attributesMap.values());
}

/**
 * Extract attribute filters from search parameters
 */
function extractAttributeFilters(searchParams: Record<string, string | string[] | undefined>): Record<string, string[]> {
  const attributeFilters: Record<string, string[]> = {};
  
  for (const [key, value] of Object.entries(searchParams)) {
    // Skip known non-attribute parameters
    if (['gender', 'brand', 'category', 'search', 'price', 'sort', 'page', 'limit'].includes(key)) {
      continue;
    }
    
    if (value) {
      const values = Array.isArray(value) ? value : [value];
      attributeFilters[key] = values;
    }
  }
  
  return attributeFilters;
}

/**
 * Fetch final products with all filters applied
 */
async function getFinalProducts(filters: {
  search: string;
  genderSlugs: string[];
  brandSlugs: string[];
  categorySlugs: string[];
  priceParam: string;
  sort: string;
  page: number;
  limit: number;
  attributeFilters: Record<string, string[]>;
}): Promise<{ products: ProductListItem[]; totalCount: number }> {
  const conds: SQL[] = [eq(products.isPublished, true)];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conds.push(or(ilike(products.name, pattern), ilike(products.description, pattern))!);
  }

  if (filters.genderSlugs.length) {
    conds.push(inArray(genders.slug, filters.genderSlugs));
  }

  if (filters.brandSlugs.length) {
    conds.push(inArray(brands.slug, filters.brandSlugs));
  }

  if (filters.categorySlugs.length) {
    conds.push(inArray(categories.slug, filters.categorySlugs));
  }

  // Build variant conditions for attributes and price
  const variantConds: SQL[] = [];
  
  // Process attribute filters
  if (Object.keys(filters.attributeFilters).length > 0) {
    for (const [attributeName, filterValues] of Object.entries(filters.attributeFilters)) {
      if (filterValues.length > 0) {
        variantConds.push(
          exists(
            db
              .select()
              .from(variantAttributeValues)
              .innerJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
              .innerJoin(attributes, eq(attributes.id, attributeValues.attributeId))
              .where(
                and(
                  eq(variantAttributeValues.variantId, productVariants.id),
                  eq(attributes.name, attributeName),
                  inArray(attributeValues.value, filterValues)
                )
              )
          )
        );
      }
    }
  }
  
  // Process price filters
  if (filters.priceParam) {
    const [minStr, maxStr] = filters.priceParam.split('-');
    const priceBounds: SQL[] = [];
    
    if (minStr) {
      const min = parseFloat(minStr);
      if (!isNaN(min)) {
        priceBounds.push(sql`(${productVariants.price})::numeric >= ${min}`);
      }
    }
    
    if (maxStr) {
      const max = parseFloat(maxStr);
      if (!isNaN(max)) {
        priceBounds.push(sql`(${productVariants.price})::numeric <= ${max}`);
      }
    }
    
    if (priceBounds.length > 0) {
      variantConds.push(and(...priceBounds)!);
    }
  }

  const variantJoin = db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      price: sql<number>`${productVariants.price}::numeric`.as("price"),
      salePrice: sql<number | null>`${productVariants.salePrice}::numeric`.as("salePrice"),
    })
    .from(productVariants)
    .where(variantConds.length ? and(...variantConds) : undefined)
    .as("v");

  // Fetch product images
  const imagesJoin = db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      rn: sql<number>`row_number() over (partition by ${productImages.productId} order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc)`.as("rn"),
    })
    .from(productImages)
    .where(isNull(productImages.variantId))
    .as("pi");

  const baseWhere = conds.length ? and(...conds) : undefined;

  // Price aggregation should use ALL variants of the product, not just filtered ones
  const priceAgg = {
    minPrice: sql<number | null>`min(${productVariants.price}::numeric)`,
    maxPrice: sql<number | null>`max(${productVariants.price}::numeric)`,
    minSalePrice: sql<number | null>`min(${productVariants.salePrice}::numeric)`,
    maxSalePrice: sql<number | null>`max(${productVariants.salePrice}::numeric)`,
  };

  const imageAgg = sql<string | null>`max(case when ${imagesJoin.rn} = 1 then ${imagesJoin.url} else null end)`;
  const imageUrlsAgg = sql<string[]>`array_agg(distinct ${imagesJoin.url})`;

  // Determine sort order
  const primaryOrder =
    filters.sort === "price_asc"
      ? asc(sql`min(${variantJoin.price})`)
      : filters.sort === "price_desc"
      ? desc(sql`max(${variantJoin.price})`)
      : desc(products.createdAt);

  const page = Math.max(1, filters.page);
  const limit = Math.max(1, Math.min(filters.limit, 60));
  const offset = (page - 1) * limit;

  // Use innerJoin for variantJoin when there are attribute or price filters
  let query = db
    .select({
      id: products.id,
      name: products.name,
      createdAt: products.createdAt,
      subtitle: genders.label,
      minPrice: priceAgg.minPrice,
      maxPrice: priceAgg.maxPrice,
      minSalePrice: priceAgg.minSalePrice,
      maxSalePrice: priceAgg.maxSalePrice,
      imageUrl: imageAgg,
      imageUrls: imageUrlsAgg,
    })
    .from(products);
    
  // Use innerJoin for variantJoin when there are attribute or price filters
  if (variantConds.length > 0) {
    query = query.innerJoin(variantJoin, eq(variantJoin.productId, products.id));
  } else {
    query = query.leftJoin(variantJoin, eq(variantJoin.productId, products.id));
  }
  
  const rows = await query
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(imagesJoin, eq(imagesJoin.productId, products.id))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(baseWhere)
    .groupBy(products.id, products.name, products.createdAt, genders.label)
    .orderBy(primaryOrder, desc(products.createdAt), asc(products.id))
    .limit(limit)
    .offset(offset);
    
  // Use innerJoin for variantJoin when there are attribute or price filters
  let countQuery = db
    .select({
      cnt: count(sql<number>`distinct ${products.id}`),
    })
    .from(products);
    
  if (variantConds.length > 0) {
    countQuery = countQuery.innerJoin(variantJoin, eq(variantJoin.productId, products.id));
  } else {
    countQuery = countQuery.leftJoin(variantJoin, eq(variantJoin.productId, products.id));
  }
  
  const countRows = await countQuery
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(baseWhere);

  const productsOut: ProductListItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    imageUrl: r.imageUrl,
    imageUrls: (r.imageUrls || []).slice(0, 4),
    minPrice: r.minPrice === null ? null : Number(r.minPrice),
    maxPrice: r.maxPrice === null ? null : Number(r.maxPrice),
    minSalePrice: r.minSalePrice === null ? null : Number(r.minSalePrice),
    maxSalePrice: r.maxSalePrice === null ? null : Number(r.maxSalePrice),
    createdAt: r.createdAt,
    subtitle: r.subtitle ? `${r.subtitle} Apparel` : null,
  }));

  const totalCount = countRows[0]?.cnt ?? 0;

  return { products: productsOut, totalCount };
}

// Legacy functions for backward compatibility
export async function getInitialFilterData(searchParams: Record<string, string | string[] | undefined>): Promise<FilterOptions> {
  const result = await getProductsAndFilters(searchParams);
  return {
    brands: result.availableBrands,
    categories: flattenCategories(result.hierarchicalCategories),
    genders: [], // Will be populated by the main function
    attributes: result.availableAttributes,
  };
}

export async function getFilteredProducts(filters: NormalizedProductFilters): Promise<{
  products: ProductListItem[];
  totalCount: number;
}> {
  // Convert NormalizedProductFilters to searchParams format
  const searchParams: Record<string, string | string[]> = {};
  
  if (filters.search) searchParams.search = filters.search;
  if (filters.genderSlugs.length) searchParams.gender = filters.genderSlugs;
  if (filters.brandSlugs.length) searchParams.brand = filters.brandSlugs;
  if (filters.categorySlugs.length) searchParams.category = filters.categorySlugs;
  if (filters.sort) searchParams.sort = filters.sort;
  if (filters.page) searchParams.page = filters.page.toString();
  if (filters.limit) searchParams.limit = filters.limit.toString();
  
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const min = filters.priceMin ?? 0;
    const max = filters.priceMax ?? 50000;
    searchParams.price = `${min}-${max}`;
  }
  
    // Add attribute filters
    if (filters.attributeFilters) {
      for (const [key, values] of Object.entries(filters.attributeFilters)) {
        if (Array.isArray(values) && values.length > 0) {
          searchParams[key] = values as string[];
        }
      }
    }
  
  const result = await getProductsAndFilters(searchParams);
  return {
    products: result.products,
    totalCount: result.totalCount,
  };
}

/**
 * Flatten hierarchical categories to flat list for backward compatibility
 */
function flattenCategories(categories: HierarchicalCategory[]): FilterOption[] {
  const result: FilterOption[] = [];
  
  function flatten(cats: HierarchicalCategory[]) {
    for (const cat of cats) {
      result.push({
        name: cat.name,
        slug: cat.slug,
      });
      if (cat.children.length > 0) {
        flatten(cat.children);
      }
    }
  }
  
  flatten(categories);
  return result;
}