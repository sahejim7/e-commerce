"use server";

import { db } from "@/lib/db";
import { brands, categories, productTypes, attributes, attributeValues, productTypeAttributes } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function seedInitialData(formData: FormData) {
  try {
    console.log("🌱 Seeding initial data...");

    // Check if data already exists
    const existingBrands = await db.select().from(brands).limit(1);
    const existingCategories = await db.select().from(categories).limit(1);
    const existingProductTypes = await db.select().from(productTypes).limit(1);

    // Check if attributes already exist before clearing
    const existingAttributes = await db.select().from(attributes).limit(1);
    
    // Only clear and reseed if no attributes exist
    if (existingAttributes.length === 0) {
      console.log("No attributes found, seeding initial attributes...");
    } else {
      console.log("Attributes already exist, skipping attribute seeding...");
      return; // Exit early if attributes already exist
    }

    // Seed some initial brands (only if they don't exist)
    if (existingBrands.length === 0) {
      const initialBrands = [
        { name: "Nike", slug: "nike" },
        { name: "Adidas", slug: "adidas" },
        { name: "Puma", slug: "puma" },
        { name: "Under Armour", slug: "under-armour" },
      ];

      for (const brand of initialBrands) {
        await db.insert(brands).values({
          name: brand.name,
          slug: brand.slug,
          logoUrl: null,
        });
      }
    }

    // Seed some initial categories (only if they don't exist)
    if (existingCategories.length === 0) {
      const initialCategories = [
        { name: "T-Shirts", slug: "t-shirts" },
        { name: "Jeans", slug: "jeans" },
        { name: "Shoes", slug: "shoes" },
        { name: "Accessories", slug: "accessories" },
      ];

      for (const category of initialCategories) {
        await db.insert(categories).values({
          name: category.name,
          slug: category.slug,
          parentId: null,
        });
      }
    }

    // Create core attributes first
    const colorAttribute = await db.insert(attributes).values({
      name: "color",
      displayName: "Color",
    }).returning();

    const apparelSizeAttribute = await db.insert(attributes).values({
      name: "apparel_size",
      displayName: "Apparel Size",
    }).returning();

    const waistSizeAttribute = await db.insert(attributes).values({
      name: "waist_size",
      displayName: "Waist Size",
    }).returning();

    // Create attribute values for Color
    const colorValues = [
      { value: "Black", sortOrder: 1 },
      { value: "White", sortOrder: 2 },
      { value: "Red", sortOrder: 3 },
      { value: "Blue", sortOrder: 4 },
      { value: "Green", sortOrder: 5 },
      { value: "Yellow", sortOrder: 6 },
      { value: "Purple", sortOrder: 7 },
      { value: "Orange", sortOrder: 8 },
    ];

    for (const colorValue of colorValues) {
      await db.insert(attributeValues).values({
        attributeId: colorAttribute[0].id,
        value: colorValue.value,
        sortOrder: colorValue.sortOrder,
      });
    }

    // Create attribute values for Apparel Size
    const apparelSizeValues = [
      { value: "XS", sortOrder: 1 },
      { value: "S", sortOrder: 2 },
      { value: "M", sortOrder: 3 },
      { value: "L", sortOrder: 4 },
      { value: "XL", sortOrder: 5 },
      { value: "XXL", sortOrder: 6 },
    ];

    for (const sizeValue of apparelSizeValues) {
      await db.insert(attributeValues).values({
        attributeId: apparelSizeAttribute[0].id,
        value: sizeValue.value,
        sortOrder: sizeValue.sortOrder,
      });
    }

    // Create attribute values for Waist Size
    const waistSizeValues = [
      { value: "28", sortOrder: 1 },
      { value: "30", sortOrder: 2 },
      { value: "32", sortOrder: 3 },
      { value: "34", sortOrder: 4 },
      { value: "36", sortOrder: 5 },
      { value: "38", sortOrder: 6 },
      { value: "40", sortOrder: 7 },
      { value: "42", sortOrder: 8 },
    ];

    for (const waistValue of waistSizeValues) {
      await db.insert(attributeValues).values({
        attributeId: waistSizeAttribute[0].id,
        value: waistValue.value,
        sortOrder: waistValue.sortOrder,
      });
    }

    // Seed some initial attribute sets (product types)
    const initialAttributeSets = [
      { name: "Standard Apparel" },
      { name: "Waist-Sized Apparel" },
      { name: "Accessories" },
    ];

    const createdProductTypes = [];
    for (const attributeSet of initialAttributeSets) {
      const [newProductType] = await db.insert(productTypes).values({
        name: attributeSet.name,
      }).returning();
      createdProductTypes.push(newProductType);
    }

    // Link attributes to product types
    // Standard Apparel: Color + Apparel Size
    await db.insert(productTypeAttributes).values({
      productTypeId: createdProductTypes[0].id, // Standard Apparel
      attributeId: colorAttribute[0].id,
    });
    await db.insert(productTypeAttributes).values({
      productTypeId: createdProductTypes[0].id, // Standard Apparel
      attributeId: apparelSizeAttribute[0].id,
    });

    // Waist-Sized Apparel: Color + Waist Size
    await db.insert(productTypeAttributes).values({
      productTypeId: createdProductTypes[1].id, // Waist-Sized Apparel
      attributeId: colorAttribute[0].id,
    });
    await db.insert(productTypeAttributes).values({
      productTypeId: createdProductTypes[1].id, // Waist-Sized Apparel
      attributeId: waistSizeAttribute[0].id,
    });

    // Accessories: Color only (optional)
    await db.insert(productTypeAttributes).values({
      productTypeId: createdProductTypes[2].id, // Accessories
      attributeId: colorAttribute[0].id,
    });

    revalidatePath("/admin");
    console.log("🎉 Initial data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding initial data:", error);
  }
}
