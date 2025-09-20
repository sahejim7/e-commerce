"use server";

import { db } from "@/lib/db";
import { carts, cartItems, productVariants, products, productImages, attributes, attributeValues, variantAttributeValues } from "@/lib/db/schema";
import { guests } from "@/lib/db/schema/guest";
import { getCurrentUser } from "@/lib/auth/actions";
import { guestSession, createGuestSession } from "@/lib/auth/actions";
import { cookies } from "next/headers";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Helper function to ensure we have a valid guest session
async function ensureValidGuestSession(): Promise<{ sessionToken: string } | null> {
  let guest = await guestSession();
  
  if (!guest.sessionToken) {
    const newGuest = await createGuestSession();
    if (!newGuest.ok) {
      return null;
    }
    return { sessionToken: newGuest.sessionToken };
  }
  
  // Verify the guest session exists in database
  const guestRecord = await db
    .select({ sessionToken: guests.sessionToken })
    .from(guests)
    .where(eq(guests.sessionToken, guest.sessionToken))
    .limit(1);
  
  if (guestRecord.length === 0) {
    // Clear the invalid cookie and create a new session
    const cookieStore = await cookies();
    await cookieStore.delete("guest_session");
    
    const newGuest = await createGuestSession();
    if (!newGuest.ok) {
      return null;
    }
    return { sessionToken: newGuest.sessionToken };
  }
  
  return { sessionToken: guest.sessionToken };
}

export type CartItem = {
  id: string;
  cartId: string;
  productVariantId: string;
  quantity: number;
  variant: {
    id: string;
    sku: string;
    price: string;
    salePrice: string | null;
    inStock: boolean;
    product: {
      id: string;
      name: string;
      imageUrl: string | null;
    };
    attributes: Array<{
      name: string;
      value: string;
      displayName: string;
    }>;
  };
};

export type Cart = {
  id: string;
  userId: string | null;
  guestId: string | null;
  items: CartItem[];
  total: number;
  itemCount: number;
};

export async function getCart(): Promise<Cart | null> {
  try {
    // Get current user or guest session
    const user = await getCurrentUser();

    // If no user, ensure we have a valid guest session
    let guest: { sessionToken: string } | null = null;
    if (!user) {
      guest = await ensureValidGuestSession();
      if (!guest) {
        return null;
      }
    }

    // For guest users, get the guest ID first
    let guestId: string | null = null;
    if (!user && guest?.sessionToken) {
      const guestRecord = await db
        .select({ id: guests.id })
        .from(guests)
        .where(eq(guests.sessionToken, guest.sessionToken))
        .limit(1);
      
      if (guestRecord.length > 0) {
        guestId = guestRecord[0].id;
      }
    }

    // Find the cart for the current user or guest
    const cartRows = await db
      .select({
        cartId: carts.id,
        userId: carts.userId,
        guestId: carts.guestId,
      })
      .from(carts)
      .where(
        user 
          ? eq(carts.userId, user.id)
          : guestId ? eq(carts.guestId, guestId) : sql`1=0`
      )
      .limit(1);

    let cartId: string;
    
    if (cartRows.length === 0) {
      // For guest users, ensure the guest record exists in the database
      if (!user && guest?.sessionToken && !guestId) {
        const newGuest = await createGuestSession();
        if (!newGuest.ok) {
          throw new Error("Failed to create guest session");
        }
        guest = { sessionToken: newGuest.sessionToken };
        
        // Get the new guest's ID
        const newGuestRecord = await db
          .select({ id: guests.id })
          .from(guests)
          .where(eq(guests.sessionToken, newGuest.sessionToken))
          .limit(1);
        
        if (newGuestRecord.length === 0) {
          throw new Error("Failed to retrieve new guest record");
        }
        guestId = newGuestRecord[0].id;
      }
      
      // Create a new cart if none exists
      const newCart = await db
        .insert(carts)
        .values({
          userId: user?.id || null,
          guestId: user ? null : guestId,
        })
        .returning({ id: carts.id });
      
      cartId = newCart[0].id;
    } else {
      cartId = cartRows[0].cartId;
    }

    // Get cart items with full product and variant information
    const itemRows = await db
      .select({
        itemId: cartItems.id,
        itemCartId: cartItems.cartId,
        itemQuantity: cartItems.quantity,
        variantId: productVariants.id,
        variantSku: productVariants.sku,
        variantPrice: productVariants.price,
        variantSalePrice: productVariants.salePrice,
        variantInStock: productVariants.inStock,
        productId: products.id,
        productName: products.name,
        imageUrl: productImages.url,
        attributeId: attributes.id,
        attributeName: attributes.name,
        attributeDisplayName: attributes.displayName,
        attributeValueId: attributeValues.id,
        attributeValue: attributeValues.value,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(productVariants.id, cartItems.productVariantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .leftJoin(productImages, and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true)
      ))
      .leftJoin(variantAttributeValues, eq(variantAttributeValues.variantId, productVariants.id))
      .leftJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
      .leftJoin(attributes, eq(attributes.id, attributeValues.attributeId))
      .where(eq(cartItems.cartId, cartId))
      .orderBy(desc(cartItems.id));

    // Group items and their attributes
    const itemsMap = new Map<string, CartItem>();
    const attributesMap = new Map<string, Array<{ name: string; value: string; displayName: string }>>();

    for (const row of itemRows) {
      if (!itemsMap.has(row.itemId)) {
        itemsMap.set(row.itemId, {
          id: row.itemId,
          cartId: row.itemCartId,
          productVariantId: row.variantId,
          quantity: row.itemQuantity,
          variant: {
            id: row.variantId,
            sku: row.variantSku,
            price: row.variantPrice,
            salePrice: row.variantSalePrice,
            inStock: row.variantInStock > 0,
            product: {
              id: row.productId,
              name: row.productName,
              imageUrl: row.imageUrl,
            },
            attributes: [],
          },
        });
      }

      // Collect attributes
      if (row.attributeId && row.attributeValueId) {
        if (!attributesMap.has(row.itemId)) {
          attributesMap.set(row.itemId, []);
        }
        attributesMap.get(row.itemId)!.push({
          name: row.attributeName!,
          value: row.attributeValue!,
          displayName: row.attributeDisplayName!,
        });
      }
    }

    // Attach attributes to items
    const items = Array.from(itemsMap.values()).map(item => ({
      ...item,
      variant: {
        ...item.variant,
        attributes: attributesMap.get(item.id) || [],
      },
    }));

    // Calculate totals
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.variant.salePrice || item.variant.price);
      return sum + (price * item.quantity);
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cartId,
      userId: user?.id || null,
      guestId: user ? null : (guest?.sessionToken || null),
      items,
      total,
      itemCount,
    };
  } catch (error) {
    console.error("Error getting cart:", error);
    return null;
  }
}

export async function addCartItem(formData: FormData) {
  try {
    const variantId = formData.get("variantId") as string;
    const quantity = parseInt(formData.get("quantity") as string) || 1;

    if (!variantId) {
      return { success: false, error: "Variant ID is required" };
    }

    // Get current cart
    const cart = await getCart();
    if (!cart) {
      return { success: false, error: "Failed to get cart" };
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.productVariantId === variantId);
    
    if (existingItem) {
      // Update quantity of existing item
      await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      // Add new item to cart
      await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productVariantId: variantId,
          quantity,
        });
    }

    revalidatePath("/cart");
    return { success: true, message: "Item added to cart!" };
  } catch (error) {
    console.error("Error adding cart item:", error);
    return { success: false, error: "Failed to add item to cart" };
  }
}

export async function updateCartItemQuantity(itemId: string, newQuantity: number) {
  try {
    if (newQuantity <= 0) {
      return await removeCartItem(itemId);
    }

    await db
      .update(cartItems)
      .set({ quantity: newQuantity })
      .where(eq(cartItems.id, itemId));

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    return { success: false, error: "Failed to update quantity" };
  }
}

export async function removeCartItem(itemId: string) {
  try {
    await db
      .delete(cartItems)
      .where(eq(cartItems.id, itemId));

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error removing cart item:", error);
    return { success: false, error: "Failed to remove item" };
  }
}


