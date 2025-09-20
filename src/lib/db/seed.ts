import { db } from '@/lib/db';
import {
  genders, brands, categories, collections, productCollections,
  products, productVariants, productImages,
  productTypes, attributes, attributeValues, productTypeAttributes, variantAttributeValues,
  insertGenderSchema, insertBrandSchema, insertCategorySchema, insertCollectionSchema, 
  insertProductSchema, insertVariantSchema, insertProductImageSchema,
  insertProductTypeSchema, insertAttributeSchema, insertAttributeValueSchema,
  insertProductTypeAttributeSchema, insertVariantAttributeValueSchema,
  type InsertProduct, type InsertVariant, type InsertProductImage,
  type InsertProductType, type InsertAttribute, type InsertAttributeValue,
  type InsertProductTypeAttribute, type InsertVariantAttributeValue,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { mkdirSync, existsSync, cpSync } from 'fs';
import { join, basename } from 'path';
type ProductRow = typeof products.$inferSelect;
type VariantRow = typeof productVariants.$inferSelect;

const log = (...args: unknown[]) => console.log('[seed]', ...args);
const err = (...args: unknown[]) => console.error('[seed:error]', ...args);

function pick<T>(arr: T[], n: number) {
  const a = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && a.length; i++) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a.splice(idx, 1)[0]);
  }
  return out;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate all possible combinations of attribute values
function generateVariantCombinations(attributeValueGroups: Record<string, string[]>) {
  const attributes = Object.keys(attributeValueGroups);
  const combinations: Record<string, string>[] = [];
  
  function generateRecursive(index: number, current: Record<string, string>) {
    if (index === attributes.length) {
      combinations.push({ ...current });
      return;
    }
    
    const attribute = attributes[index];
    const values = attributeValueGroups[attribute];
    
    for (const value of values) {
      current[attribute] = value;
      generateRecursive(index + 1, current);
    }
  }
  
  generateRecursive(0, {});
  return combinations;
}

async function seed() {
  try {
    log('Seeding genders');
    const genderRows = [
      insertGenderSchema.parse({ label: 'Men', slug: 'men' }),
      insertGenderSchema.parse({ label: 'Women', slug: 'women' }),
      insertGenderSchema.parse({ label: 'Unisex', slug: 'unisex' }),
    ];
    for (const row of genderRows) {
      const exists = await db.select().from(genders).where(eq(genders.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(genders).values(row);
    }

    log('Seeding product types and attributes');
    
    // Create product types
    const productTypeRows = [
      insertProductTypeSchema.parse({ name: 'T-Shirt' }),
      insertProductTypeSchema.parse({ name: 'Pants' }),
      insertProductTypeSchema.parse({ name: 'Jacket' }),
    ];
    for (const row of productTypeRows) {
      const exists = await db.select().from(productTypes).where(eq(productTypes.name, row.name)).limit(1);
      if (!exists.length) await db.insert(productTypes).values(row);
    }

    // Create attributes
    const attributeRows = [
      insertAttributeSchema.parse({ name: 'color', displayName: 'Color' }),
      insertAttributeSchema.parse({ name: 'apparel_size', displayName: 'Apparel Size' }),
      insertAttributeSchema.parse({ name: 'waist_size', displayName: 'Waist Size' }),
    ];
    for (const row of attributeRows) {
      const exists = await db.select().from(attributes).where(eq(attributes.name, row.name)).limit(1);
      if (!exists.length) await db.insert(attributes).values(row);
    }

    // Get the inserted records to use their IDs
    const allProductTypes = await db.select().from(productTypes);
    const allAttributes = await db.select().from(attributes);
    
    const tshirtType = allProductTypes.find(pt => pt.name === 'T-Shirt')!;
    const pantsType = allProductTypes.find(pt => pt.name === 'Pants')!;
    const jacketType = allProductTypes.find(pt => pt.name === 'Jacket')!;
    
    const colorAttribute = allAttributes.find(a => a.name === 'color')!;
    const apparelSizeAttribute = allAttributes.find(a => a.name === 'apparel_size')!;
    const waistSizeAttribute = allAttributes.find(a => a.name === 'waist_size')!;

    // Create attribute values
    const attributeValueRows = [
      // Color values
      insertAttributeValueSchema.parse({ attributeId: colorAttribute.id, value: 'Black', sortOrder: 0 }),
      insertAttributeValueSchema.parse({ attributeId: colorAttribute.id, value: 'White', sortOrder: 1 }),
      insertAttributeValueSchema.parse({ attributeId: colorAttribute.id, value: 'Red', sortOrder: 2 }),
      insertAttributeValueSchema.parse({ attributeId: colorAttribute.id, value: 'Blue', sortOrder: 3 }),
      insertAttributeValueSchema.parse({ attributeId: colorAttribute.id, value: 'Green', sortOrder: 4 }),
      insertAttributeValueSchema.parse({ attributeId: colorAttribute.id, value: 'Gray', sortOrder: 5 }),
      
      // Apparel size values
      insertAttributeValueSchema.parse({ attributeId: apparelSizeAttribute.id, value: 'XS', sortOrder: 0 }),
      insertAttributeValueSchema.parse({ attributeId: apparelSizeAttribute.id, value: 'S', sortOrder: 1 }),
      insertAttributeValueSchema.parse({ attributeId: apparelSizeAttribute.id, value: 'M', sortOrder: 2 }),
      insertAttributeValueSchema.parse({ attributeId: apparelSizeAttribute.id, value: 'L', sortOrder: 3 }),
      insertAttributeValueSchema.parse({ attributeId: apparelSizeAttribute.id, value: 'XL', sortOrder: 4 }),
      insertAttributeValueSchema.parse({ attributeId: apparelSizeAttribute.id, value: 'XXL', sortOrder: 5 }),
      
      // Waist size values
      insertAttributeValueSchema.parse({ attributeId: waistSizeAttribute.id, value: '28', sortOrder: 0 }),
      insertAttributeValueSchema.parse({ attributeId: waistSizeAttribute.id, value: '30', sortOrder: 1 }),
      insertAttributeValueSchema.parse({ attributeId: waistSizeAttribute.id, value: '32', sortOrder: 2 }),
      insertAttributeValueSchema.parse({ attributeId: waistSizeAttribute.id, value: '34', sortOrder: 3 }),
      insertAttributeValueSchema.parse({ attributeId: waistSizeAttribute.id, value: '36', sortOrder: 4 }),
      insertAttributeValueSchema.parse({ attributeId: waistSizeAttribute.id, value: '38', sortOrder: 5 }),
    ];
    
    for (const row of attributeValueRows) {
      const exists = await db.select()
        .from(attributeValues)
        .where(and(
          eq(attributeValues.attributeId, row.attributeId),
          eq(attributeValues.value, row.value)
        ))
        .limit(1);
      if (!exists.length) await db.insert(attributeValues).values(row);
    }

    // Link product types to their attributes
    const productTypeAttributeRows = [
      // T-Shirt uses color and apparel_size
      insertProductTypeAttributeSchema.parse({ productTypeId: tshirtType.id, attributeId: colorAttribute.id }),
      insertProductTypeAttributeSchema.parse({ productTypeId: tshirtType.id, attributeId: apparelSizeAttribute.id }),
      
      // Pants uses color and waist_size
      insertProductTypeAttributeSchema.parse({ productTypeId: pantsType.id, attributeId: colorAttribute.id }),
      insertProductTypeAttributeSchema.parse({ productTypeId: pantsType.id, attributeId: waistSizeAttribute.id }),
      
      // Jacket uses color and apparel_size
      insertProductTypeAttributeSchema.parse({ productTypeId: jacketType.id, attributeId: colorAttribute.id }),
      insertProductTypeAttributeSchema.parse({ productTypeId: jacketType.id, attributeId: apparelSizeAttribute.id }),
    ];
    
    for (const row of productTypeAttributeRows) {
      const exists = await db.select()
        .from(productTypeAttributes)
        .where(and(
          eq(productTypeAttributes.productTypeId, row.productTypeId),
          eq(productTypeAttributes.attributeId, row.attributeId)
        ))
        .limit(1);
      if (!exists.length) await db.insert(productTypeAttributes).values(row);
    }

    log('Seeding brand: Nike');
    const brand = insertBrandSchema.parse({ name: 'Nike', slug: 'nike', logoUrl: undefined });
    {
      const exists = await db.select().from(brands).where(eq(brands.slug, brand.slug)).limit(1);
      if (!exists.length) await db.insert(brands).values(brand);
    }

    log('Seeding categories (primary classifications for filtering)');
    const categoryRows = [
      { name: 'Tops', slug: 'tops', parentId: null, imageUrl: null },
      { name: 'Bottoms', slug: 'bottoms', parentId: null, imageUrl: null },
      { name: 'Outerwear', slug: 'outerwear', parentId: null, imageUrl: null },
      { name: 'Accessories', slug: 'accessories', parentId: null, imageUrl: null },
    ].map((c) => insertCategorySchema.parse(c));
    for (const row of categoryRows) {
      const exists = await db.select().from(categories).where(eq(categories.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(categories).values(row);
    }

    log('Seeding collections (marketing groups for discovery)');
    const collectionRows = [
      { 
        name: 'Best Sellers', 
        slug: 'best-sellers', 
        isFeatured: true,
        description: 'Discover our most popular and highly-rated products that customers love.',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      },
      { 
        name: 'Essentials Collection', 
        slug: 'essentials-collection', 
        isFeatured: true,
        description: 'The must-have pieces for every wardrobe - timeless, versatile, and always in style.',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      },
      { 
        name: 'Linen & Tropical Wear', 
        slug: 'linen-tropical-wear', 
        isFeatured: true,
        description: 'Light, breathable fabrics perfect for warm weather and tropical destinations.',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      },
      { 
        name: 'Matching Sets', 
        slug: 'matching-sets', 
        isFeatured: true,
        description: 'Coordinated outfits that take the guesswork out of getting dressed.',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      },
      { 
        name: "Men's Smart Casual", 
        slug: 'mens-smart-casual', 
        isFeatured: true,
        description: 'Sophisticated yet comfortable pieces for the modern gentleman.',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      },
      { 
        name: "Women's Lounge & Comfort", 
        slug: 'womens-lounge-comfort', 
        isFeatured: true,
        description: 'Cozy, comfortable pieces designed for relaxation and everyday wear.',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.3&auto=format&fit=crop&w=2070&q=80'
      },
    ].map((c) => insertCollectionSchema.parse(c));
    for (const row of collectionRows) {
      const exists = await db.select().from(collections).where(eq(collections.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(collections).values(row);
    }

    // Get all the seeded data for product creation
    const allGenders = await db.select().from(genders);
    const allAttributeValues = await db.select().from(attributeValues);
    const nike = (await db.select().from(brands).where(eq(brands.slug, 'nike')))[0];
    
    // Get categories for product classification
    const topsCat = (await db.select().from(categories).where(eq(categories.slug, 'tops')))[0];
    const outerwearCat = (await db.select().from(categories).where(eq(categories.slug, 'outerwear')))[0];
    const bottomsCat = (await db.select().from(categories).where(eq(categories.slug, 'bottoms')))[0];
    const accessoriesCat = (await db.select().from(categories).where(eq(categories.slug, 'accessories')))[0];
    
    // Get collections for marketing assignment
    const allCollections = await db.select().from(collections);
    const bestSellers = allCollections.find(c => c.slug === 'best-sellers');
    const essentials = allCollections.find(c => c.slug === 'essentials-collection');
    const linenTropical = allCollections.find(c => c.slug === 'linen-tropical-wear');
    const matchingSets = allCollections.find(c => c.slug === 'matching-sets');
    const mensSmartCasual = allCollections.find(c => c.slug === 'mens-smart-casual');
    const womensLounge = allCollections.find(c => c.slug === 'womens-lounge-comfort');

    // Group attribute values by attribute
    const colorValues = allAttributeValues.filter(av => av.attributeId === colorAttribute.id);
    const apparelSizeValues = allAttributeValues.filter(av => av.attributeId === apparelSizeAttribute.id);
    const waistSizeValues = allAttributeValues.filter(av => av.attributeId === waistSizeAttribute.id);

    const uploadsRoot = join(process.cwd(), 'static', 'uploads', 'clothing');
    if (!existsSync(uploadsRoot)) {
      mkdirSync(uploadsRoot, { recursive: true });
    }

    const sourceDir = join(process.cwd(), 'public', 'clothing');
    const productNames = [
      'Graphic Tee', 'Denim Jacket', 'Hoodie', 'Cargo Pants', 'Tank Top',
      'Bomber Jacket', 'Sweatpants', 'Polo Shirt', 'Windbreaker', 'Shorts',
      'Cardigan', 'Jeans', 'T-Shirt', 'Blazer', 'Joggers'
    ];

    const sourceImages = [
      'clothing-1.jpg','clothing-2.webp','clothing-3.webp','clothing-4.webp','clothing-5.avif',
      'clothing-6.avif','clothing-7.avif','clothing-8.avif','clothing-9.avif','clothing-10.avif',
      'clothing-11.avif','clothing-12.avif','clothing-13.avif','clothing-14.avif','clothing-15.avif',
    ];

    log('Creating products with variants and images');
    for (let i = 0; i < productNames.length; i++) {
      const name = productNames[i];
      const gender = allGenders[randInt(0, allGenders.length - 1)];
      const desc = `Stylish and comfortable ${name} perfect for any occasion.`;

      // Determine product type and category based on name
      let productType = tshirtType; // default
      let category = topsCat; // default
      
      if (name.toLowerCase().includes('pants') || name.toLowerCase().includes('jeans') || name.toLowerCase().includes('shorts') || name.toLowerCase().includes('joggers')) {
        productType = pantsType;
        category = bottomsCat;
      } else if (name.toLowerCase().includes('jacket') || name.toLowerCase().includes('hoodie') || name.toLowerCase().includes('blazer') || name.toLowerCase().includes('cardigan') || name.toLowerCase().includes('windbreaker')) {
        productType = jacketType;
        category = outerwearCat;
      } else if (name.toLowerCase().includes('tank') || name.toLowerCase().includes('tee') || name.toLowerCase().includes('shirt') || name.toLowerCase().includes('polo')) {
        category = topsCat;
      }

      const product = insertProductSchema.parse({
        name,
        description: desc,
        categoryId: category?.id ?? null,
        genderId: gender?.id ?? null,
        brandId: nike?.id ?? null,
        productTypeId: productType.id,
        isPublished: true,
      });

      const retP = await db.insert(products).values(product as InsertProduct).returning();
      const insertedProduct = (retP as ProductRow[])[0];

      // Create variants based on product type
      let variantCombinations: Record<string, string>[] = [];
      
      if (productType.id === tshirtType.id || productType.id === jacketType.id) {
        // Use color and apparel_size
        const selectedColors = pick(colorValues, randInt(2, Math.min(4, colorValues.length)));
        const selectedSizes = pick(apparelSizeValues, randInt(3, Math.min(6, apparelSizeValues.length)));
        
        const attributeValueGroups = {
          [colorAttribute.id]: selectedColors.map(c => c.id),
          [apparelSizeAttribute.id]: selectedSizes.map(s => s.id),
        };
        variantCombinations = generateVariantCombinations(attributeValueGroups);
      } else if (productType.id === pantsType.id) {
        // Use color and waist_size
        const selectedColors = pick(colorValues, randInt(2, Math.min(4, colorValues.length)));
        const selectedWaistSizes = pick(waistSizeValues, randInt(3, Math.min(5, waistSizeValues.length)));
        
        const attributeValueGroups = {
          [colorAttribute.id]: selectedColors.map(c => c.id),
          [waistSizeAttribute.id]: selectedWaistSizes.map(w => w.id),
        };
        variantCombinations = generateVariantCombinations(attributeValueGroups);
      }

      const variantIds: string[] = [];
      let defaultVariantId: string | null = null;

      for (const combination of variantCombinations) {
        const priceNum = Number((randInt(80, 200) + 0.99).toFixed(2));
        const discountedNum = Math.random() < 0.3 ? Number((priceNum - randInt(5, 25)).toFixed(2)) : null;
        
        // Create a descriptive SKU based on attribute values
        const attributeValueIds = Object.values(combination);
        const sku = `NIKE-${insertedProduct.id.slice(0, 8)}-${attributeValueIds.map(id => {
          const av = allAttributeValues.find(a => a.id === id);
          return av?.value.slice(0, 3).toUpperCase() || 'VAR';
        }).join('-')}`;
        
        const variant = insertVariantSchema.parse({
          productId: insertedProduct.id,
          sku,
          price: priceNum.toFixed(2),
          salePrice: discountedNum !== null ? discountedNum.toFixed(2) : undefined,
          inStock: randInt(5, 50),
          weight: Number((Math.random() * 1 + 0.5).toFixed(2)),
          dimensions: { length: 30, width: 20, height: 12 },
        });
        
        const retV = await db.insert(productVariants).values(variant as InsertVariant).returning();
        const created = (retV as VariantRow[])[0];
        variantIds.push(created.id);
        if (!defaultVariantId) defaultVariantId = created.id;

        // Link variant to its attribute values
        for (const [attributeId, attributeValueId] of Object.entries(combination)) {
          const variantAttributeValue = insertVariantAttributeValueSchema.parse({
            variantId: created.id,
            attributeValueId,
          });
          await db.insert(variantAttributeValues).values(variantAttributeValue);
        }
      }

      if (defaultVariantId) {
        await db.update(products).set({ defaultVariantId }).where(eq(products.id, insertedProduct.id));
      }

      const pickName = sourceImages[i % sourceImages.length];
      const src = join(sourceDir, pickName);
      const destName = `${insertedProduct.id}-${basename(pickName)}`;
      const dest = join(uploadsRoot, destName);
      try {
        cpSync(src, dest);
        const img: InsertProductImage = insertProductImageSchema.parse({
          productId: insertedProduct.id,
          url: `/static/uploads/clothing/${destName}`,
          sortOrder: 0,
          isPrimary: true,
        });
        await db.insert(productImages).values(img);
      } catch (e) {
        err('Failed to copy product image', { src, dest, e });
      }

      // Assign products to collections based on logical marketing groupings
      const collectionsForProduct: { id: string }[] = [];
      
      // All products have a chance to be in Best Sellers
      if (Math.random() < 0.3) {
        collectionsForProduct.push(bestSellers!);
      }
      
      // Gender-specific collections
      if (gender.slug === 'men' && Math.random() < 0.4) {
        collectionsForProduct.push(mensSmartCasual!);
      }
      if (gender.slug === 'women' && Math.random() < 0.4) {
        collectionsForProduct.push(womensLounge!);
      }
      
      // Style-based collections
      if (name.toLowerCase().includes('linen') || name.toLowerCase().includes('tropical') || Math.random() < 0.2) {
        collectionsForProduct.push(linenTropical!);
      }
      
      if (name.toLowerCase().includes('set') || name.toLowerCase().includes('matching') || Math.random() < 0.15) {
        collectionsForProduct.push(matchingSets!);
      }
      
      // Essentials for basic items
      if (name.toLowerCase().includes('tee') || name.toLowerCase().includes('shirt') || name.toLowerCase().includes('pants') || Math.random() < 0.25) {
        collectionsForProduct.push(essentials!);
      }
      
      // Assign to collections
      for (const col of collectionsForProduct) {
        if (col) {
          await db.insert(productCollections).values({
            productId: insertedProduct.id,
            collectionId: col.id,
          });
        }
      }

      log(`Seeded product ${name} (${productType.name}) with ${variantIds.length} variants`);
    }

    log('Seeding complete');
  } catch (e) {
    err(e);
    process.exitCode = 1;
  }
}

// seed(); // Temporarily disabled to check current state