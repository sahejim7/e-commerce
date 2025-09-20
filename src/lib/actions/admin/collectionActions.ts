"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { collections, productCollections } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { uploadImages } from "@/lib/actions/uploadActions";
import { z } from "zod";

// Validation schema for collection form data
const collectionFormSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  slug: z.string().min(1, "Collection slug is required"),
  description: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
  imageUrl: z.string().optional(),
});

export type CollectionFormData = z.infer<typeof collectionFormSchema>;

export type CollectionWithProductCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isFeatured: boolean;
  imageUrl: string | null;
  createdAt: Date;
  productCount: number;
};

/**
 * Get all collections with product count
 */
export async function getCollections(): Promise<CollectionWithProductCount[]> {
  try {
    const collectionsData = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description,
        isFeatured: collections.isFeatured,
        imageUrl: collections.imageUrl,
        createdAt: collections.createdAt,
        productCount: productCollections.id,
      })
      .from(collections)
      .leftJoin(productCollections, eq(productCollections.collectionId, collections.id))
      .orderBy(asc(collections.name));

    // Group by collection and count products
    const collectionMap = new Map<string, CollectionWithProductCount>();
    
    collectionsData.forEach(row => {
      const collectionId = row.id;
      if (!collectionMap.has(collectionId)) {
        collectionMap.set(collectionId, {
          id: collectionId,
          name: row.name,
          slug: row.slug,
          description: row.description,
          isFeatured: row.isFeatured,
          imageUrl: row.imageUrl,
          createdAt: row.createdAt,
          productCount: 0,
        });
      }
      
      if (row.productCount) {
        const collection = collectionMap.get(collectionId)!;
        collection.productCount++;
      }
    });

    return Array.from(collectionMap.values());
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
}

/**
 * Get a single collection by ID
 */
export async function getCollectionById(collectionId: string) {
  try {
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    return collection || null;
  } catch (error) {
    console.error("Error fetching collection:", error);
    return null;
  }
}

/**
 * Create or update a collection
 */
export async function createOrUpdateCollection(formData: FormData) {
  try {
    // Parse form data
    const rawData = {
      id: formData.get("id") as string || undefined,
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || undefined,
      isFeatured: formData.get("isFeatured") === "true",
      image: formData.get("image") as File | null,
    };

    // Validate data
    const validatedData = collectionFormSchema.parse({
      name: rawData.name,
      slug: rawData.slug,
      description: rawData.description,
      isFeatured: rawData.isFeatured,
    });

    let imageUrl: string | undefined = undefined;

    // Handle image upload if provided
    if (rawData.image && rawData.image.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append('images', rawData.image);
      
      const uploadResult = await uploadImages(uploadFormData);
      
      if (uploadResult.success && uploadResult.urls && uploadResult.urls.length > 0) {
        imageUrl = uploadResult.urls[0];
      } else {
        return { 
          success: false, 
          error: uploadResult.error || "Failed to upload image" 
        };
      }
    }

    if (rawData.id) {
      // Update existing collection
      const updateData: any = {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        isFeatured: validatedData.isFeatured,
      };

      // Only update imageUrl if a new image was uploaded
      if (imageUrl) {
        updateData.imageUrl = imageUrl;
      }

      await db
        .update(collections)
        .set(updateData)
        .where(eq(collections.id, rawData.id));

      revalidatePath("/admin/attributes");
      return { success: true, message: "Collection updated successfully!" };
    } else {
      // Create new collection
      const [newCollection] = await db
        .insert(collections)
        .values({
          name: validatedData.name,
          slug: validatedData.slug,
          description: validatedData.description,
          isFeatured: validatedData.isFeatured,
          imageUrl: imageUrl,
        })
        .returning();

      revalidatePath("/admin/attributes");
      return { success: true, message: "Collection created successfully!", collectionId: newCollection.id };
    }
  } catch (error) {
    console.error("Error creating/updating collection:", error);
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    return { success: false, error: "Failed to create/update collection" };
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(collectionId: string) {
  try {
    // Check if collection exists
    const existingCollection = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (!existingCollection.length) {
      return { success: false, error: "Collection not found" };
    }

    // Delete collection (product_collections will be deleted due to cascade)
    await db
      .delete(collections)
      .where(eq(collections.id, collectionId));

    revalidatePath("/admin/attributes");
    return { success: true, message: "Collection deleted successfully!" };
  } catch (error) {
    console.error("Error deleting collection:", error);
    return { success: false, error: "Failed to delete collection" };
  }
}
