"use server";

import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL, exists } from "drizzle-orm";
import { db } from "@/lib/db";
import { 
  collections, 
  productCollections,
  brands,
  categories,
  genders,
  productImages,
  productVariants,
  products,
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

export interface CollectionOption {
  name: string;
  slug: string;
}

export async function getCollections(): Promise<CollectionOption[]> {
  try {
    const collectionsResult = await db
      .select({
        name: collections.name,
        slug: collections.slug,
      })
      .from(collections)
      .orderBy(collections.name);

    return collectionsResult;
  } catch (error) {
    console.error("Error fetching collections:", error);
    throw new Error("Failed to fetch collections");
  }
}

// Types for the new function
type ProductListItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  imageUrls: string[];
  minPrice: number | null;
  maxPrice: number | null;
  createdAt: Date;
  subtitle?: string | null;
};

export type CollectionWithProducts = {
  collection: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    isFeatured: boolean;
  };
  products: ProductListItem[];
  totalCount: number;
};

export async function getProductsByCollectionSlug(slug: string): Promise<CollectionWithProducts | null> {
  try {
    // First, find the collection by slug
    const collectionResult = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description,
        imageUrl: collections.imageUrl,
        isFeatured: collections.isFeatured,
      })
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);

    if (!collectionResult.length) {
      return null;
    }

    const collection = collectionResult[0];

    // Get all product IDs for this collection
    const productIdsResult = await db
      .select({
        productId: productCollections.productId,
      })
      .from(productCollections)
      .where(eq(productCollections.collectionId, collection.id));

    if (!productIdsResult.length) {
      return {
        collection,
        products: [],
        totalCount: 0,
      };
    }

    const productIds = productIdsResult.map(row => row.productId);

    // Now fetch the full product data using the same logic as getAllProducts
    // but filtered to only the products in this collection
    const conds: SQL[] = [
      eq(products.isPublished, true),
      inArray(products.id, productIds)
    ];

    // Create variant join for price aggregation
    const variantJoin = db
      .select({
        variantId: productVariants.id,
        productId: productVariants.productId,
        price: sql<number>`${productVariants.price}::numeric`.as("price"),
      })
      .from(productVariants)
      .as("v");

    // Create images join for product images
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
    };

    const imageAgg = sql<string | null>`max(case when ${imagesJoin.rn} = 1 then ${imagesJoin.url} else null end)`;
    const imageUrlsAgg = sql<string[]>`array_agg(${imagesJoin.url} order by ${imagesJoin.rn} asc)`;

    const primaryOrder = desc(products.createdAt);

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        createdAt: products.createdAt,
        subtitle: genders.label,
        minPrice: priceAgg.minPrice,
        maxPrice: priceAgg.maxPrice,
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
      .orderBy(primaryOrder, desc(products.createdAt), asc(products.id));

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
      createdAt: r.createdAt,
      subtitle: r.subtitle ? `${r.subtitle} Apparel` : null,
    }));

    const totalCount = countRows[0]?.cnt ?? 0;

    return {
      collection,
      products: productsOut,
      totalCount,
    };
  } catch (error) {
    console.error("Error fetching products by collection slug:", error);
    
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
