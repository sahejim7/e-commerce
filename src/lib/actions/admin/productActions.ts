"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  products,
  productVariants,
  productImages,
  brands,
  categories,
  genders,
  colors,
  sizes,
  productTypes,
  attributes,
  attributeValues,
  productTypeAttributes,
  variantAttributeValues,
  collections,
  productCollections,
  orderItems,
  orders,
  type SelectProduct,
  type SelectVariant,
  type SelectBrand,
  type SelectCategory,
  type SelectGender,
  type SelectColor,
  type SelectSize,
  type SelectProductType,
  type SelectAttribute,
  type SelectAttributeValue,
  type SelectVariantAttributeValue,
  type SelectCollection,
} from "@/lib/db/schema";
import { eq, desc, asc, and, count, sql, inArray } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  price: z.string().min(1, "Price is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Price must be a positive number"),
  salePrice: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), "Sale price must be a positive number"),
  attributeValueIds: z.array(z.string().uuid("Invalid attribute value")).min(1, "At least one attribute value is required"),
  inStock: z.number().int().min(0, "Stock must be non-negative"),
  imageUrl: z.string().optional(),
});

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  productCode: z.string().min(1, "Product code is required"),
  categoryId: z.string().uuid().optional().nullable(),
  genderId: z.string().uuid().optional().nullable(),
  brandId: z.string().uuid().optional().nullable(),
  productTypeId: z.string().uuid("Product type is required"),
  isPublished: z.boolean().optional().default(false),
  collectionIds: z.array(z.string().uuid()).optional().default([]),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  productImages: z.array(z.string()).optional().default([]),
});

// Types
export type AdminProduct = {
  id: string;
  name: string;
  description: string;
  productCode: string | null;
  categoryId: string | null;
  genderId: string | null;
  brandId: string | null;
  productTypeId: string | null;
  isPublished: boolean;
  defaultVariantId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category?: SelectCategory | null;
  gender?: SelectGender | null;
  brand?: SelectBrand | null;
  productType?: SelectProductType | null;
  collections?: SelectCollection[];
  variants: Array<SelectVariant & {
    attributeValues: Array<SelectAttributeValue & {
      attribute: SelectAttribute;
    }>;
    attributeValueIds: string[];
    imageUrl?: string;
  }>;
  productImages?: string[];
};

export type AdminProductListItem = {
  id: string;
  name: string;
  description: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: SelectCategory | null;
  gender?: SelectGender | null;
  brand?: SelectBrand | null;
  variantCount: number;
  totalStock: number;
  minPrice: number | null;
  maxPrice: number | null;
};

export type PaginatedProducts = {
  products: AdminProductListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

// Server Actions
export async function getAdminProducts(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<PaginatedProducts> {
  try {
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(sql`${products.name} ILIKE ${`%${search}%`}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get products with related data
    const productsQuery = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        isPublished: products.isPublished,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryId: products.categoryId,
        genderId: products.genderId,
        brandId: products.brandId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        genderLabel: genders.label,
        genderSlug: genders.slug,
        brandName: brands.name,
        brandSlug: brands.slug,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(genders, eq(genders.id, products.genderId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    // Get variant counts and pricing for each product
    const variantStatsQuery = db
      .select({
        productId: productVariants.productId,
        variantCount: count(productVariants.id),
        totalStock: sql<number>`sum(${productVariants.inStock})`,
        minPrice: sql<number>`min(${productVariants.price}::numeric)`,
        maxPrice: sql<number>`max(${productVariants.price}::numeric)`,
      })
      .from(productVariants)
      .groupBy(productVariants.productId);

    // Get total count
    const totalCountQuery = db
      .select({ count: count() })
      .from(products)
      .where(whereClause);

    const [productsData, variantStats, totalCountResult] = await Promise.all([
      productsQuery,
      variantStatsQuery,
      totalCountQuery,
    ]);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Create a map of variant stats by product ID
    const statsMap = new Map(
      variantStats.map(stat => [stat.productId, stat])
    );

    const productsList: AdminProductListItem[] = productsData.map(product => {
      const stats = statsMap.get(product.id);
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        isPublished: product.isPublished,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        categoryId: product.categoryId,
        genderId: product.genderId,
        brandId: product.brandId,
        category: product.categoryName ? {
          id: product.categoryId!,
          name: product.categoryName,
          slug: product.categorySlug!,
          parentId: null,
        } : null,
        gender: product.genderLabel ? {
          id: product.genderId!,
          label: product.genderLabel,
          slug: product.genderSlug!,
        } : null,
        brand: product.brandName ? {
          id: product.brandId!,
          name: product.brandName,
          slug: product.brandSlug!,
          logoUrl: null,
        } : null,
        variantCount: stats?.variantCount || 0,
        totalStock: stats?.totalStock || 0,
        minPrice: stats?.minPrice || null,
        maxPrice: stats?.maxPrice || null,
      };
    });

    return {
      products: productsList,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching admin products:", error);
    throw new Error("Failed to fetch products");
  }
}

export async function getProductForEdit(productId: string): Promise<AdminProduct | null> {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
      return null;
    }

    // Get product with related data using a single optimized query
    const productData = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        productCode: products.productCode,
        categoryId: products.categoryId,
        genderId: products.genderId,
        brandId: products.brandId,
        productTypeId: products.productTypeId,
        isPublished: products.isPublished,
        defaultVariantId: products.defaultVariantId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
        genderLabel: genders.label,
        genderSlug: genders.slug,
        brandName: brands.name,
        brandSlug: brands.slug,
        brandLogoUrl: brands.logoUrl,
        productTypeName: productTypes.name,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(genders, eq(genders.id, products.genderId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .leftJoin(productTypes, eq(productTypes.id, products.productTypeId))
      .where(eq(products.id, productId))
      .limit(1);

    if (!productData.length) {
      return null;
    }

    const product = productData[0];

    // Get all variants with their attribute values in a single query
    const variantsWithAttributes = await db
      .select({
        variantId: productVariants.id,
        productId: productVariants.productId,
        sku: productVariants.sku,
        price: productVariants.price,
        salePrice: productVariants.salePrice,
        inStock: productVariants.inStock,
        weight: productVariants.weight,
        dimensions: productVariants.dimensions,
        variantCreatedAt: productVariants.createdAt,
        attributeValueId: attributeValues.id,
        attributeValue: attributeValues.value,
        attributeValueSortOrder: attributeValues.sortOrder,
        attributeId: attributes.id,
        attributeName: attributes.name,
        attributeDisplayName: attributes.displayName,
      })
      .from(productVariants)
      .leftJoin(variantAttributeValues, eq(variantAttributeValues.variantId, productVariants.id))
      .leftJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
      .leftJoin(attributes, eq(attributes.id, attributeValues.attributeId))
      .where(eq(productVariants.productId, productId));

    // Group variants and their attributes
    const variantsMap = new Map<string, any>();
    variantsWithAttributes.forEach(row => {
      if (!variantsMap.has(row.variantId)) {
        variantsMap.set(row.variantId, {
          id: row.variantId,
          productId: row.productId,
          sku: row.sku,
          price: row.price,
          salePrice: row.salePrice,
          inStock: row.inStock,
          weight: row.weight,
          dimensions: row.dimensions as { length?: number; width?: number; height?: number } | null,
          createdAt: row.variantCreatedAt,
          attributeValues: [],
          attributeValueIds: [],
        });
      }

      if (row.attributeValueId) {
        const variant = variantsMap.get(row.variantId);
        variant.attributeValues.push({
          id: row.attributeValueId,
          attributeId: row.attributeId,
          value: row.attributeValue,
          sortOrder: row.attributeValueSortOrder,
          createdAt: new Date(),
          attribute: {
            id: row.attributeId,
            name: row.attributeName,
            displayName: row.attributeDisplayName,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        variant.attributeValueIds.push(row.attributeValueId);
      }
    });

    const variants = Array.from(variantsMap.values());

    // Get product images (main product images)
    const productImagesData = await db
      .select({
        imageUrl: productImages.url,
        sortOrder: productImages.sortOrder,
        isPrimary: productImages.isPrimary,
      })
      .from(productImages)
      .where(
        and(
          eq(productImages.productId, productId),
          sql`${productImages.variantId} IS NULL`
        )
      )
      .orderBy(asc(productImages.sortOrder));

    // Get variant images
    const variantImagesData = variants.length > 0 ? await db
      .select({
        variantId: productImages.variantId,
        imageUrl: productImages.url,
      })
      .from(productImages)
      .where(
        and(
          inArray(productImages.variantId, variants.map(v => v.id)),
          sql`${productImages.variantId} IS NOT NULL`
        )
      )
      : [];

    // Group images by variant
    const imagesByVariant = new Map<string, string>();
    variantImagesData.forEach(row => {
      if (row.variantId && row.imageUrl) {
        imagesByVariant.set(row.variantId, row.imageUrl);
      }
    });

    // Add image URLs to variants
    variants.forEach(variant => {
      variant.imageUrl = imagesByVariant.get(variant.id) || undefined;
    });

    // Get product collections
    const productCollectionsData = await db
      .select({
        collectionId: productCollections.collectionId,
        collectionName: collections.name,
        collectionSlug: collections.slug,
        isFeatured: collections.isFeatured,
        createdAt: collections.createdAt,
      })
      .from(productCollections)
      .innerJoin(collections, eq(collections.id, productCollections.collectionId))
      .where(eq(productCollections.productId, productId));

    const productCollectionsList = productCollectionsData.map(pc => ({
      id: pc.collectionId,
      name: pc.collectionName,
      slug: pc.collectionSlug,
      isFeatured: pc.isFeatured,
      createdAt: pc.createdAt,
    }));

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      productCode: product.productCode,
      categoryId: product.categoryId,
      genderId: product.genderId,
      brandId: product.brandId,
      productTypeId: product.productTypeId,
      isPublished: product.isPublished,
      defaultVariantId: product.defaultVariantId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.categoryName ? {
        id: product.categoryId!,
        name: product.categoryName,
        slug: product.categorySlug!,
        parentId: null,
      } : null,
      gender: product.genderLabel ? {
        id: product.genderId!,
        label: product.genderLabel,
        slug: product.genderSlug!,
      } : null,
      brand: product.brandName ? {
        id: product.brandId!,
        name: product.brandName,
        slug: product.brandSlug!,
        logoUrl: product.brandLogoUrl,
      } : null,
      productType: product.productTypeName ? {
        id: product.productTypeId!,
        name: product.productTypeName,
        createdAt: new Date(),
        updatedAt: new Date(),
      } : null,
      collections: productCollectionsList,
      variants,
      productImages: productImagesData.map(img => img.imageUrl),
    };
  } catch (error) {
    console.error("Error fetching product for edit:", error);
    throw new Error("Failed to fetch product");
  }
}

export async function createProduct(formData: FormData) {
  try {
    // Parse form data
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      productCode: formData.get("productCode") as string,
      categoryId: formData.get("categoryId") as string || null,
      genderId: formData.get("genderId") as string || null,
      brandId: formData.get("brandId") as string || null,
      productTypeId: formData.get("productTypeId") as string,
      isPublished: formData.get("isPublished") === "true",
      collectionIds: JSON.parse(formData.get("collectionIds") as string || "[]"),
      variants: JSON.parse(formData.get("variants") as string || "[]"),
      productImages: JSON.parse(formData.get("productImages") as string || "[]"),
    };

    // Validate data
    const validatedData = productFormSchema.parse(rawData);

    // Create product
    const [newProduct] = await db
      .insert(products)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        productCode: validatedData.productCode,
        categoryId: validatedData.categoryId,
        genderId: validatedData.genderId,
        brandId: validatedData.brandId,
        productTypeId: validatedData.productTypeId,
        isPublished: validatedData.isPublished,
      })
      .returning();

    // Create variants
    const variantsToInsert = validatedData.variants.map(variant => ({
      productId: newProduct.id,
      sku: variant.sku,
      price: variant.price,
      salePrice: variant.salePrice || null,
      inStock: variant.inStock,
    }));

    const newVariants = await db
      .insert(productVariants)
      .values(variantsToInsert)
      .returning();

    // Create variant attribute values
    for (let i = 0; i < newVariants.length; i++) {
      const variant = newVariants[i];
      const variantData = validatedData.variants[i];
      
      const variantAttributeValuesToInsert = variantData.attributeValueIds.map(attributeValueId => ({
        variantId: variant.id,
        attributeValueId: attributeValueId,
      }));

      if (variantAttributeValuesToInsert.length > 0) {
        await db
          .insert(variantAttributeValues)
          .values(variantAttributeValuesToInsert);
      }
    }

    // Set first variant as default if none specified
    if (newVariants.length > 0) {
      await db
        .update(products)
        .set({ defaultVariantId: newVariants[0].id })
        .where(eq(products.id, newProduct.id));
    }

    // Create product-collection associations
    if (validatedData.collectionIds && validatedData.collectionIds.length > 0) {
      const productCollectionInserts = validatedData.collectionIds.map(collectionId => ({
        productId: newProduct.id,
        collectionId: collectionId,
      }));

      await db
        .insert(productCollections)
        .values(productCollectionInserts);
    }

    // Create product images
    if (validatedData.productImages && validatedData.productImages.length > 0) {
      const imagesToInsert = validatedData.productImages.map((imageUrl, index) => ({
        productId: newProduct.id,
        variantId: null, // Main product images
        url: imageUrl,
        sortOrder: index,
        isPrimary: index === 0, // First image is primary
      }));

      await db
        .insert(productImages)
        .values(imagesToInsert);
    }

    // Create variant images
    for (let i = 0; i < newVariants.length; i++) {
      const variant = newVariants[i];
      const variantData = validatedData.variants[i];
      
      if (variantData.imageUrl) {
        await db
          .insert(productImages)
          .values({
            productId: newProduct.id,
            variantId: variant.id,
            url: variantData.imageUrl,
            sortOrder: 0,
            isPrimary: false,
          });
      }
    }

    const result = newProduct;

    revalidatePath("/admin/products");
    return { success: true, productId: result.id, message: "Product created successfully!" };
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, error: "Failed to create product" };
  }
}

export async function updateProduct(productId: string, formData: FormData) {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
      return { success: false, error: "Invalid product ID" };
    }

    // Parse form data
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      productCode: formData.get("productCode") as string,
      categoryId: formData.get("categoryId") as string || null,
      genderId: formData.get("genderId") as string || null,
      brandId: formData.get("brandId") as string || null,
      productTypeId: formData.get("productTypeId") as string,
      isPublished: formData.get("isPublished") === "true",
      collectionIds: JSON.parse(formData.get("collectionIds") as string || "[]"),
      variants: JSON.parse(formData.get("variants") as string || "[]"),
      productImages: JSON.parse(formData.get("productImages") as string || "[]"),
    };

    // Validate data
    const validatedData = productFormSchema.parse(rawData);

    // Update product
    await db
      .update(products)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        productCode: validatedData.productCode,
        categoryId: validatedData.categoryId,
        genderId: validatedData.genderId,
        brandId: validatedData.brandId,
        productTypeId: validatedData.productTypeId,
        isPublished: validatedData.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    // Get existing variants to determine which to update/delete
    const existingVariants = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    const existingVariantIds = new Set(existingVariants.map(v => v.id));
    const submittedVariantIds = new Set(validatedData.variants.filter(v => v.id).map(v => v.id!));

    // Delete variants that are no longer in the submitted data
    const variantsToDelete = Array.from(existingVariantIds).filter(id => !submittedVariantIds.has(id));
    if (variantsToDelete.length > 0) {
      await db
        .delete(productVariants)
        .where(inArray(productVariants.id, variantsToDelete));
    }

    // Process variants with upsert logic
    const updatedVariants: Array<{ id: string; sku: string; price: string; salePrice?: string; inStock: number; attributeValueIds: string[]; imageUrl?: string }> = [];
    
    for (const variantData of validatedData.variants) {
      if (variantData.id && existingVariantIds.has(variantData.id)) {
        const variantId = variantData.id;
        // Update existing variant
        await db
          .update(productVariants)
          .set({
            sku: variantData.sku,
            price: variantData.price,
            salePrice: variantData.salePrice || null,
            inStock: variantData.inStock,
          })
          .where(eq(productVariants.id, variantId));

        // Update variant attribute values
        await db
          .delete(variantAttributeValues)
          .where(eq(variantAttributeValues.variantId, variantId));

        if (variantData.attributeValueIds.length > 0) {
          const variantAttributeValuesToInsert = variantData.attributeValueIds.map(attributeValueId => ({
            variantId: variantId,
            attributeValueId: attributeValueId,
          }));

          await db
            .insert(variantAttributeValues)
            .values(variantAttributeValuesToInsert);
        }

        updatedVariants.push({ id: variantId, ...variantData });
      } else {
        // Create new variant
        const [newVariant] = await db
          .insert(productVariants)
          .values({
            productId,
            sku: variantData.sku,
            price: variantData.price,
            salePrice: variantData.salePrice || null,
            inStock: variantData.inStock,
          })
          .returning();

        // Create variant attribute values
        if (variantData.attributeValueIds.length > 0) {
          const variantAttributeValuesToInsert = variantData.attributeValueIds.map(attributeValueId => ({
            variantId: newVariant.id,
            attributeValueId: attributeValueId,
          }));

          await db
            .insert(variantAttributeValues)
            .values(variantAttributeValuesToInsert);
        }

        updatedVariants.push({ id: newVariant.id, ...variantData });
      }
    }

    // Set first variant as default if none specified
    if (updatedVariants.length > 0) {
      await db
        .update(products)
        .set({ defaultVariantId: updatedVariants[0].id })
        .where(eq(products.id, productId));
    }

    // Update product-collection associations
    await db
      .delete(productCollections)
      .where(eq(productCollections.productId, productId));

    if (validatedData.collectionIds && validatedData.collectionIds.length > 0) {
      const productCollectionInserts = validatedData.collectionIds.map(collectionId => ({
        productId: productId,
        collectionId: collectionId,
      }));

      await db
        .insert(productCollections)
        .values(productCollectionInserts);
    }

    // Delete existing images
    await db
      .delete(productImages)
      .where(eq(productImages.productId, productId));

    // Create product images
    if (validatedData.productImages && validatedData.productImages.length > 0) {
      const imagesToInsert = validatedData.productImages.map((imageUrl, index) => ({
        productId: productId,
        variantId: null, // Main product images
        url: imageUrl,
        sortOrder: index,
        isPrimary: index === 0, // First image is primary
      }));

      await db
        .insert(productImages)
        .values(imagesToInsert);
    }

    // Create variant images
    for (const variantData of validatedData.variants) {
      if (variantData.imageUrl) {
        const variantId = variantData.id || updatedVariants.find(v => v.sku === variantData.sku)?.id;
        if (variantId) {
          await db
            .insert(productImages)
            .values({
              productId: productId,
              variantId: variantId,
              url: variantData.imageUrl,
              sortOrder: 0,
              isPrimary: false,
            });
        }
      }
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true, message: "Product updated successfully!" };
  } catch (error) {
    console.error("Error updating product:", error);
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProduct(productId: string) {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
      return { success: false, error: "Invalid product ID" };
    }

    // Check if product exists
    const existingProduct = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existingProduct.length) {
      return { success: false, error: "Product not found" };
    }

    // Delete product (variants will be deleted due to cascade)
    await db
      .delete(products)
      .where(eq(products.id, productId));

    revalidatePath("/admin/products");
    return { success: true, message: "Product deleted successfully!" };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function bulkDeleteProducts(productIds: string[]) {
  try {
    // Validate all product IDs
    for (const productId of productIds) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
        return { success: false, error: "Invalid product ID in selection" };
      }
    }

    if (productIds.length === 0) {
      return { success: false, error: "No products selected" };
    }

    // Check if all products exist
    const existingProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, productIds));

    if (existingProducts.length !== productIds.length) {
      return { success: false, error: "Some selected products were not found" };
    }

    // Check if any products have active orders (pending or paid status)
    // We allow deletion of products with cancelled or delivered orders
    const productsWithActiveOrders = await db
      .select({
        productId: productVariants.productId,
        orderCount: count()
      })
      .from(productVariants)
      .innerJoin(orderItems, eq(orderItems.productVariantId, productVariants.id))
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(
          inArray(productVariants.productId, productIds),
          sql`${orders.status} IN ('pending', 'paid')`
        )
      )
      .groupBy(productVariants.productId);

    if (productsWithActiveOrders.length > 0) {
      const productNames = await db
        .select({ name: products.name })
        .from(products)
        .where(inArray(products.id, productsWithActiveOrders.map(p => p.productId)));
      
      return { 
        success: false, 
        error: `Cannot delete products that have active orders (pending or paid): ${productNames.map(p => p.name).join(', ')}` 
      };
    }

    // For products with cancelled/delivered orders, we need to handle the cascade manually
    // First, get all variants for these products
    const productVariantsToDelete = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds));

    const variantIds = productVariantsToDelete.map(v => v.id);

    if (variantIds.length > 0) {
      // Delete order items that reference these variants (for cancelled/delivered orders)
      await db
        .delete(orderItems)
        .where(
          and(
            inArray(orderItems.productVariantId, variantIds),
            sql`EXISTS (
              SELECT 1 FROM orders 
              WHERE orders.id = order_items.order_id 
              AND orders.status IN ('cancelled', 'delivered')
            )`
          )
        );

      // Delete cart items that reference these variants
      // Use IN clause instead of ANY for better compatibility
      if (variantIds.length > 0) {
        await db.execute(sql`
          DELETE FROM cart_items 
          WHERE cart_items.product_variant_id IN (${sql.join(variantIds.map(id => sql`${id}`), sql`, `)})
        `);
      }
    }

    // Now delete the products (variants will be deleted due to cascade)
    await db
      .delete(products)
      .where(inArray(products.id, productIds));

    revalidatePath("/admin/products");
    return { 
      success: true, 
      message: `${productIds.length} product${productIds.length > 1 ? 's' : ''} deleted successfully!` 
    };
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    return { success: false, error: "Failed to delete products" };
  }
}

// Helper functions to get reference data
export async function getBrands() {
  try {
    return await db
      .select()
      .from(brands)
      .orderBy(asc(brands.name));
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
}

export async function getCategories() {
  try {
    return await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getGenders() {
  try {
    return await db
      .select()
      .from(genders)
      .orderBy(asc(genders.label));
  } catch (error) {
    console.error("Error fetching genders:", error);
    return [];
  }
}

export async function getColors() {
  try {
    return await db
      .select()
      .from(colors)
      .orderBy(asc(colors.name));
  } catch (error) {
    console.error("Error fetching colors:", error);
    return [];
  }
}

export async function getSizes() {
  try {
    return await db
      .select()
      .from(sizes)
      .orderBy(asc(sizes.sortOrder));
  } catch (error) {
    console.error("Error fetching sizes:", error);
    return [];
  }
}

// New V2 helper functions
export async function getProductTypes() {
  try {
    return await db
      .select()
      .from(productTypes)
      .orderBy(asc(productTypes.name));
  } catch (error) {
    console.error("Error fetching product types:", error);
    return [];
  }
}

export async function getAttributesForProductType(productTypeId: string) {
  try {
    return await db
      .select({
        id: attributes.id,
        name: attributes.name,
        displayName: attributes.displayName,
        createdAt: attributes.createdAt,
        updatedAt: attributes.updatedAt,
      })
      .from(attributes)
      .innerJoin(productTypeAttributes, eq(productTypeAttributes.attributeId, attributes.id))
      .where(eq(productTypeAttributes.productTypeId, productTypeId))
      .orderBy(asc(attributes.displayName));
  } catch (error) {
    console.error("Error fetching attributes for product type:", error);
    return [];
  }
}

export async function getAttributeValuesForAttribute(attributeId: string) {
  try {
    return await db
      .select()
      .from(attributeValues)
      .where(eq(attributeValues.attributeId, attributeId))
      .orderBy(asc(attributeValues.sortOrder), asc(attributeValues.value));
  } catch (error) {
    console.error("Error fetching attribute values:", error);
    return [];
  }
}

export async function getAttributeValuesForProductType(productTypeId: string) {
  try {
    return await db
      .select({
        attributeId: attributes.id,
        attributeName: attributes.name,
        attributeDisplayName: attributes.displayName,
        attributeValueId: attributeValues.id,
        attributeValue: attributeValues.value,
        attributeValueSortOrder: attributeValues.sortOrder,
      })
      .from(attributes)
      .innerJoin(productTypeAttributes, eq(productTypeAttributes.attributeId, attributes.id))
      .innerJoin(attributeValues, eq(attributeValues.attributeId, attributes.id))
      .where(eq(productTypeAttributes.productTypeId, productTypeId))
      .orderBy(asc(attributes.displayName), asc(attributeValues.sortOrder), asc(attributeValues.value));
  } catch (error) {
    console.error("Error fetching attribute values for product type:", error);
    return [];
  }
}

export async function getAllCollections() {
  try {
    return await db
      .select()
      .from(collections)
      .orderBy(asc(collections.name));
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
}
