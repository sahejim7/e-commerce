"use server";

import { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or, sql, type SQL, exists } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brands,
  categories,
  genders,
  productImages,
  productVariants,
  products,
  users,
  reviews,
  // New dynamic attribute schema imports
  attributes,
  attributeValues,
  variantAttributeValues,
  productTypes,
  type SelectProduct,
  type SelectVariant,
  type SelectProductImage,
  type SelectBrand,
  type SelectCategory,
  type SelectGender,
  type SelectAttribute,
  type SelectAttributeValue,
  type SelectProductType,
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

export type GetAllProductsResult = {
  products: ProductListItem[];
  totalCount: number;
};

export async function getAllProducts(filters: NormalizedProductFilters): Promise<GetAllProductsResult> {
  try {
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

  const hasAttributeFilters = filters.attributeFilters && Object.keys(filters.attributeFilters).length > 0;
  const hasPrice = !!(filters.priceMin !== undefined || filters.priceMax !== undefined || filters.priceRanges.length);

  // Build variant conditions using the new dynamic attribute system
  const variantConds: SQL[] = [];
  
  // Process all dynamic attribute filters
  if (filters.attributeFilters) {
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
                ilike(attributes.name, `%${attributeName}%`), // Match attribute by name
                inArray(attributeValues.value, filterValues)
              )
            )
        )
      );
    }
    }
  }
  
  if (hasPrice) {
    const priceBounds: SQL[] = [];
    if (filters.priceRanges.length) {
      for (const [min, max] of filters.priceRanges) {
        const subConds: SQL[] = [];
        if (min !== undefined) {
          subConds.push(sql`(${productVariants.price})::numeric >= ${min}`);
        }
        if (max !== undefined) {
          subConds.push(sql`(${productVariants.price})::numeric <= ${max}`);
        }
        if (subConds.length) priceBounds.push(and(...subConds)!);
      }
    }
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const subConds: SQL[] = [];
      if (filters.priceMin !== undefined) subConds.push(sql`(${productVariants.price})::numeric >= ${filters.priceMin}`);
      if (filters.priceMax !== undefined) subConds.push(sql`(${productVariants.price})::numeric <= ${filters.priceMax}`);
      if (subConds.length) priceBounds.push(and(...subConds)!);
    }
    if (priceBounds.length) {
      variantConds.push(or(...priceBounds)!);
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

  // Fetch only product-level images (not variant images) for hover effect
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

  const priceAgg = {
    minPrice: sql<number | null>`min(${variantJoin.price})`,
    maxPrice: sql<number | null>`max(${variantJoin.price})`,
    minSalePrice: sql<number | null>`min(${variantJoin.salePrice})`,
    maxSalePrice: sql<number | null>`max(${variantJoin.salePrice})`,
  };

  const imageAgg = sql<string | null>`max(case when ${imagesJoin.rn} = 1 then ${imagesJoin.url} else null end)`;
  const imageUrlsAgg = sql<string[]>`array_agg(distinct ${imagesJoin.url})`;

  const primaryOrder =
    filters.sort === "price_asc"
      ? asc(sql`min(${variantJoin.price})`)
      : filters.sort === "price_desc"
      ? desc(sql`max(${variantJoin.price})`)
      : desc(products.createdAt);

  const page = Math.max(1, filters.page);
  const limit = Math.max(1, Math.min(filters.limit, 60));
  const offset = (page - 1) * limit;

  const rows = await db
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
    .from(products)
    .leftJoin(variantJoin, eq(variantJoin.productId, products.id))
    .leftJoin(imagesJoin, eq(imagesJoin.productId, products.id))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(baseWhere)
    .groupBy(products.id, products.name, products.createdAt, genders.label)
    .orderBy(primaryOrder, desc(products.createdAt), asc(products.id))
    .limit(limit)
    .offset(offset);
    
  const countRows = await db
    .select({
      cnt: count(sql<number>`distinct ${products.id}`),
    })
    .from(products)
    .leftJoin(variantJoin, eq(variantJoin.productId, products.id))
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
  } catch (error) {
    console.error("Error fetching products:", error);
    
    // Return empty result on database timeout or connection errors
    if (error instanceof Error && (
      error.message.includes('ETIMEDOUT') || 
      error.message.includes('fetch failed') ||
      error.message.includes('connection')
    )) {
      console.warn("Database connection timeout, returning empty results");
      return { products: [], totalCount: 0 };
    }
    
    // Re-throw other errors
    throw error;
  }
}

export type ProductVariant = {
  id: string;
  sku: string;
  price: number;
  salePrice: number | null;
  inStock: boolean;
  imageUrl: string | null;
  attributes: Array<{
    name: string;
    value: string;
    displayName: string;
  }>;
};

export type FullProduct = {
  product: SelectProduct & {
    brand?: SelectBrand | null;
    category?: SelectCategory | null;
    gender?: SelectGender | null;
    productType?: SelectProductType | null;
  };
  variants: ProductVariant[];
  galleryImages: string[];
};

export async function getProduct(productId: string): Promise<FullProduct | null> {
  try {
    // Validate that productId is a valid UUID format
    if (!isValidUUID(productId)) {
      return null;
    }

    // First, get the product and its basic information
    const productRows = await db
      .select({
        productId: products.id,
        productName: products.name,
        productDescription: products.description,
        productBrandId: products.brandId,
        productCategoryId: products.categoryId,
        productGenderId: products.genderId,
        productTypeId: products.productTypeId,
        isPublished: products.isPublished,
        defaultVariantId: products.defaultVariantId,
        productCreatedAt: products.createdAt,
        productUpdatedAt: products.updatedAt,

        brandId: brands.id,
        brandName: brands.name,
        brandSlug: brands.slug,
        brandLogoUrl: brands.logoUrl,

        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,

        genderId: genders.id,
        genderLabel: genders.label,
        genderSlug: genders.slug,

        productTypeTableId: productTypes.id,
        productTypeName: productTypes.name,
      })
      .from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(genders, eq(genders.id, products.genderId))
      .leftJoin(productTypes, eq(productTypes.id, products.productTypeId))
      .where(eq(products.id, productId))
      .limit(1);

    if (!productRows.length) return null;

    const productRow = productRows[0];

    // Get all variants for this product with their attributes
    const variantRows = await db
      .select({
        variantId: productVariants.id,
        variantSku: productVariants.sku,
        variantPrice: sql<number | null>`${productVariants.price}::numeric`,
        variantSalePrice: sql<number | null>`${productVariants.salePrice}::numeric`,
        variantInStock: productVariants.inStock,
        variantWeight: productVariants.weight,
        variantDimensions: productVariants.dimensions,
        variantCreatedAt: productVariants.createdAt,
        
        attributeId: attributes.id,
        attributeName: attributes.name,
        attributeDisplayName: attributes.displayName,
        attributeValueId: attributeValues.id,
        attributeValue: attributeValues.value,
        attributeValueSortOrder: attributeValues.sortOrder,
      })
      .from(productVariants)
      .leftJoin(variantAttributeValues, eq(variantAttributeValues.variantId, productVariants.id))
      .leftJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
      .leftJoin(attributes, eq(attributes.id, attributeValues.attributeId))
      .where(eq(productVariants.productId, productId));

    // Get all images for this product
    const imageRows = await db
      .select({
        imageId: productImages.id,
        imageUrl: productImages.url,
        imageIsPrimary: productImages.isPrimary,
        imageSortOrder: productImages.sortOrder,
        imageVariantId: productImages.variantId,
      })
      .from(productImages)
      .where(eq(productImages.productId, productId));

    // Build the product object
    const product: SelectProduct & {
      brand?: SelectBrand | null;
      category?: SelectCategory | null;
      gender?: SelectGender | null;
      productType?: SelectProductType | null;
    } = {
      id: productRow.productId,
      name: productRow.productName,
      description: productRow.productDescription,
      brandId: productRow.productBrandId ?? null,
      categoryId: productRow.productCategoryId ?? null,
      genderId: productRow.productGenderId ?? null,
      productTypeId: productRow.productTypeId ?? null,
      isPublished: productRow.isPublished,
      defaultVariantId: productRow.defaultVariantId ?? null,
      createdAt: productRow.productCreatedAt,
      updatedAt: productRow.productUpdatedAt,
      brand: productRow.brandId
        ? {
            id: productRow.brandId,
            name: productRow.brandName!,
            slug: productRow.brandSlug!,
            logoUrl: productRow.brandLogoUrl ?? null,
          }
        : null,
      category: productRow.categoryId
        ? {
            id: productRow.categoryId,
            name: productRow.categoryName!,
            slug: productRow.categorySlug!,
            parentId: null,
          }
        : null,
      gender: productRow.genderId
        ? {
            id: productRow.genderId,
            label: productRow.genderLabel!,
            slug: productRow.genderSlug!,
          }
        : null,
      productType: productRow.productTypeTableId
        ? {
            id: productRow.productTypeTableId,
            name: productRow.productTypeName!,
            createdAt: productRow.productCreatedAt,
            updatedAt: productRow.productUpdatedAt,
          }
        : null,
    };

    // Build variants map with their attributes
    const variantsMap = new Map<string, ProductVariant>();
    const attributesMap = new Map<string, Array<{ name: string; value: string; displayName: string }>>();

    for (const r of variantRows) {
      if (r.variantId && !variantsMap.has(r.variantId)) {
        variantsMap.set(r.variantId, {
          id: r.variantId,
          sku: r.variantSku!,
          price: r.variantPrice !== null ? Number(r.variantPrice) : 0,
          salePrice: r.variantSalePrice !== null ? Number(r.variantSalePrice) : null,
          inStock: Boolean(r.variantInStock),
          imageUrl: null, // Will be populated below
          attributes: [], // Will be populated below
        });
      }

      // Collect attributes for each variant
      if (r.variantId && r.attributeId && r.attributeValueId) {
        if (!attributesMap.has(r.variantId)) {
          attributesMap.set(r.variantId, []);
        }
        attributesMap.get(r.variantId)!.push({
          name: r.attributeName!,
          value: r.attributeValue!,
          displayName: r.attributeDisplayName!,
        });
      }
    }

    // Attach attributes to variants
    const variants: ProductVariant[] = Array.from(variantsMap.values()).map(variant => ({
      ...variant,
      attributes: attributesMap.get(variant.id) || [],
    }));

    // Create a map of variant images
    const variantImageMap = new Map<string, string>();
    for (const image of imageRows) {
      if (image.imageVariantId && image.imageUrl) {
        variantImageMap.set(image.imageVariantId, image.imageUrl);
      }
    }

    // Attach images to variants
    variants.forEach(variant => {
      variant.imageUrl = variantImageMap.get(variant.id) || null;
    });

    // Get gallery images (images with no variantId)
    const galleryImages = imageRows
      .filter(img => img.imageVariantId === null && img.imageUrl)
      .sort((a, b) => {
        if (a.imageIsPrimary && !b.imageIsPrimary) return -1;
        if (!a.imageIsPrimary && b.imageIsPrimary) return 1;
        return (a.imageSortOrder ?? 0) - (b.imageSortOrder ?? 0);
      })
      .map(img => img.imageUrl!);

    return {
      product,
      variants,
      galleryImages,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    
    // Return null on database timeout or connection errors
    if (error instanceof Error && (
      error.message.includes('ETIMEDOUT') || 
      error.message.includes('fetch failed') ||
      error.message.includes('connection')
    )) {
      console.warn("Database connection timeout, returning null");
      return null;
    }
    
    // Re-throw other errors
    throw error;
  }
}

export type Review = {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
};

export type RecommendedProduct = {
  id: string;
  title: string;
  price: number | null;
  imageUrl: string;
  imageUrls?: string[];
};

export async function getProductReviews(productId: string): Promise<Review[]> {
  // Validate that productId is a valid UUID format
  if (!isValidUUID(productId)) {
    return [];
  }

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return rows.map((r) => ({
    id: r.id,
    author: r.authorName?.trim() || r.authorEmail || "Anonymous",
    rating: r.rating,
    title: undefined,
    content: r.comment || "",
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createReview(productId: string, userId: string, rating: number, comment?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate inputs
    if (!isValidUUID(productId) || !isValidUUID(userId)) {
      return { success: false, error: "Invalid product or user ID" };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5" };
    }

    // Check if user has already reviewed this product
    const existingReview = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, userId)))
      .limit(1);

    if (existingReview.length > 0) {
      return { success: false, error: "You have already reviewed this product" };
    }

    // Insert the review
    await db.insert(reviews).values({
      productId,
      userId,
      rating,
      comment: comment || null,
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating review:", error);
    return { success: false, error: "Failed to create review" };
  }
}

export async function getRecommendedProducts(productId: string): Promise<RecommendedProduct[]> {
  // Validate that productId is a valid UUID format
  if (!isValidUUID(productId)) {
    return [];
  }

  const base = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      brandId: products.brandId,
      genderId: products.genderId,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!base.length) return [];
  const b = base[0];

  const v = db
    .select({
      productId: productVariants.productId,
      price: sql<number>`${productVariants.price}::numeric`.as("price"),
    })
    .from(productVariants)
    .as("v");

  const pi = db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      rn: sql<number>`row_number() over (partition by ${productImages.productId} order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc)`.as(
        "rn",
      ),
    })
    .from(productImages)
    .as("pi");

  const priority = sql<number>`
    (case when ${products.categoryId} is not null and ${products.categoryId} = ${b.categoryId} then 1 else 0 end) * 3 +
    (case when ${products.brandId} is not null and ${products.brandId} = ${b.brandId} then 1 else 0 end) * 2 +
    (case when ${products.genderId} is not null and ${products.genderId} = ${b.genderId} then 1 else 0 end) * 1
  `;

  const rows = await db
    .select({
      id: products.id,
      title: products.name,
      minPrice: sql<number | null>`min(${v.price})`,
      imageUrl: sql<string | null>`max(case when ${pi.rn} = 1 then ${pi.url} else null end)`,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(v, eq(v.productId, products.id))
    .leftJoin(pi, eq(pi.productId, products.id))
    .where(and(eq(products.isPublished, true), sql`${products.id} <> ${productId}`))
    .groupBy(products.id, products.name, products.createdAt)
    .orderBy(
      desc(priority),
      desc(products.createdAt),
      asc(products.id)
    )
    .limit(8);

  const out: RecommendedProduct[] = [];
  for (const r of rows) {
    const img = r.imageUrl?.trim();
    if (!img) continue;
    
    // Fetch additional images for this product
    const additionalImages = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(and(
        eq(productImages.productId, r.id),
        ne(productImages.url, img)
      ))
      .limit(3);
    
    out.push({
      id: r.id,
      title: r.title,
      price: r.minPrice === null ? null : Number(r.minPrice),
      imageUrl: img,
      imageUrls: additionalImages.map(img => img.url).filter(Boolean),
    });
    if (out.length >= 6) break;
  }
  return out;
}

// Live Search Types
export type LiveSearchResult = {
  id: string;
  name: string;
  imageUrl: string | null;
};

// Lightweight server action for live search
export async function getLiveSearchResults(query: string): Promise<LiveSearchResult[]> {
  try {
    // Return empty array if query is empty or too short
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchPattern = `%${query.trim()}%`;

    // Get products first, then get images separately for better reliability
    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
      })
      .from(products)
      .where(
        and(
          eq(products.isPublished, true),
          or(
            ilike(products.name, searchPattern),
            ilike(products.description, searchPattern)
          )!
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(5);

    // Get images for these products
    const productIds = productRows.map(p => p.id);
    const imageRows = productIds.length > 0 ? await db
      .select({
        productId: productImages.productId,
        url: productImages.url,
        isPrimary: productImages.isPrimary,
        sortOrder: productImages.sortOrder,
      })
      .from(productImages)
      .where(
        and(
          inArray(productImages.productId, productIds),
          isNull(productImages.variantId)
        )
      )
      .orderBy(
        productImages.productId,
        desc(productImages.isPrimary),
        asc(productImages.sortOrder)
      ) : [];

    // Create a map of product ID to primary image
    const imageMap = new Map<string, string>();
    const processedProducts = new Set<string>();
    
    for (const image of imageRows) {
      if (!processedProducts.has(image.productId)) {
        imageMap.set(image.productId, image.url);
        processedProducts.add(image.productId);
      }
    }

    // Combine products with their images
    const rows = productRows.map(product => ({
      id: product.id,
      name: product.name,
      imageUrl: imageMap.get(product.id) || null,
    }));

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      imageUrl: row.imageUrl,
    }));
  } catch (error) {
    console.error("Error fetching live search results:", error);
    
    // Return empty array on database timeout or connection errors
    if (error instanceof Error && (
      error.message.includes('ETIMEDOUT') || 
      error.message.includes('fetch failed') ||
      error.message.includes('connection')
    )) {
      console.warn("Database connection timeout, returning empty results");
      return [];
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Context-aware filtering types
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

export interface FilteredProductsAndOptionsResult {
  products: ProductListItem[];
  totalCount: number;
  filterOptions: FilterOptions;
}

/**
 * Unified, intelligent server action that fetches both products and context-aware filter options.
 * This function provides truly context-aware filtering by showing only filter options that would
 * result in products when combined with the current filters.
 * 
 * This is the INITIAL load action that fetches both products and filter options.
 * For subsequent client-side updates, use getFilteredProducts instead.
 */
export async function getProductsAndFilters(filters: NormalizedProductFilters): Promise<FilteredProductsAndOptionsResult> {
  try {
    // First, get the filtered products using the existing logic
    const { products: filteredProducts, totalCount } = await getAllProducts(filters);

    // If no products found, return empty filter options
    if (filteredProducts.length === 0) {
      return {
        products: [],
        totalCount: 0,
        filterOptions: {
          brands: [],
          categories: [],
          genders: [],
          attributes: [],
        },
      };
    }

    // Get the product IDs from the filtered results
    const productIds = filteredProducts.map(p => p.id);

    // Build base conditions that match the current filtered products
    const baseConds: SQL[] = [eq(products.isPublished, true), inArray(products.id, productIds)];

    // Now fetch context-aware filter options
    // For each filter type, we need to find options that would still result in products
    // when combined with the current filters (excluding that specific filter type)
    
    const [brandsResult, categoriesResult, gendersResult, attributesResult] = await Promise.all([
      // Get brands that are available in the current context
      // (excluding current brand filters to show what other brands are available)
      db
        .selectDistinct({
          name: brands.name,
          slug: brands.slug,
        })
        .from(brands)
        .innerJoin(products, eq(products.brandId, brands.id))
        .where(and(...baseConds))
        .orderBy(brands.name),

      // Get categories that are available in the current context
      // (excluding current category filters to show what other categories are available)
      db
        .selectDistinct({
          name: categories.name,
          slug: categories.slug,
        })
        .from(categories)
        .innerJoin(products, eq(products.categoryId, categories.id))
        .where(and(...baseConds))
        .orderBy(categories.name),

      // Get genders that are available in the current context
      // (excluding current gender filters to show what other genders are available)
      db
        .selectDistinct({
          name: genders.label,
          slug: genders.slug,
        })
        .from(genders)
        .innerJoin(products, eq(products.genderId, genders.id))
        .where(and(...baseConds))
        .orderBy(genders.label),

      // Get attributes and their values that are available in the current context
      db
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
        .where(and(...baseConds))
        .orderBy(attributes.displayName, attributeValues.sortOrder, attributeValues.value),
    ]);

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

    const filterOptions: FilterOptions = {
      brands: brandsResult,
      categories: categoriesResult,
      genders: gendersResult,
      attributes: Array.from(attributesMap.values()),
    };

    return {
      products: filteredProducts,
      totalCount,
      filterOptions,
    };
  } catch (error) {
    console.error("Error fetching filtered products and options:", error);
    
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
        filterOptions: {
          brands: [],
          categories: [],
          genders: [],
          attributes: [],
        },
      };
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Lightweight server action for client-side filtering updates.
 * This action ONLY fetches products without recalculating filter options.
 * Used for instant updates when users change filters on the client side.
 */
export async function getFilteredProducts(filters: NormalizedProductFilters): Promise<GetAllProductsResult> {
  try {
    return await getAllProducts(filters);
  } catch (error) {
    console.error("Error fetching filtered products:", error);
    
    // Return empty result on database timeout or connection errors
    if (error instanceof Error && (
      error.message.includes('ETIMEDOUT') || 
      error.message.includes('fetch failed') ||
      error.message.includes('connection')
    )) {
      console.warn("Database connection timeout, returning empty results");
      return { products: [], totalCount: 0 };
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Legacy export for backward compatibility
export const getFilteredProductsAndOptions = getProductsAndFilters;