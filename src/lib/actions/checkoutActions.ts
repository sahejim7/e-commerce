"use server";

import { db } from "@/lib/db";
import { 
  addresses, 
  orders, 
  orderItems, 
  carts, 
  cartItems, 
  users,
  guests,
  productVariants,
  products,
  productImages,
  attributes,
  attributeValues,
  variantAttributeValues
} from "@/lib/db/schema";
import { getCurrentUser, guestSession, createGuestSession } from "@/lib/auth/actions";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Address validation schema
const shippingAddressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// Order summary type for display
export type OrderSummary = {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: Date;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    priceAtPurchase: string;
    variant: {
      id: string;
      sku: string;
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
  }>;
};

export async function createOrder(formData: FormData) {
  try {
    // Get current user or guest
    const user = await getCurrentUser();
    let guest = await guestSession();

    // For guest users, ensure we have a valid session
    if (!user && !guest.sessionToken) {
      const newGuest = await createGuestSession();
      if (!newGuest.ok) {
        return { 
          success: false, 
          error: "Unable to create guest session. Please refresh the page and try again." 
        };
      }
      guest = { sessionToken: newGuest.sessionToken };
    }

    // Validate shipping address
    const addressData = {
      line1: formData.get("line1") as string,
      line2: formData.get("line2") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      country: formData.get("country") as string,
      postalCode: formData.get("postalCode") as string,
    };

    const validatedAddress = shippingAddressSchema.parse(addressData);

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

    // Get current cart
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

    if (cartRows.length === 0) {
      return { 
        success: false, 
        error: "No cart found. Please add items to your cart first." 
      };
    }

    const cartId = cartRows[0].cartId;

    // Get cart items with full product information
    const itemRows = await db
      .select({
        itemId: cartItems.id,
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
      .where(eq(cartItems.cartId, cartId));

    if (itemRows.length === 0) {
      return { 
        success: false, 
        error: "Your cart is empty. Please add items to your cart first." 
      };
    }

    // Group items and calculate total
    const itemsMap = new Map<string, any>();
    const attributesMap = new Map<string, Array<{ name: string; value: string; displayName: string }>>();
    let totalAmount = 0;

    for (const row of itemRows) {
      if (!itemsMap.has(row.itemId)) {
        const price = parseFloat(row.variantSalePrice || row.variantPrice);
        const itemTotal = price * row.itemQuantity;
        totalAmount += itemTotal;

        itemsMap.set(row.itemId, {
          id: row.itemId,
          variantId: row.variantId,
          quantity: row.itemQuantity,
          priceAtPurchase: price,
          variant: {
            id: row.variantId,
            sku: row.variantSku,
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

    // Add shipping cost (fixed for now)
    const shippingCost = totalAmount > 100 ? 0 : 10; // Free shipping over LKR 100
    const tax = totalAmount * 0.08; // 8% tax
    const finalTotal = totalAmount + shippingCost + tax;

    // Create shipping address
    // For guest users, we'll use a special guest user ID approach
    // In a production system, you might want to create a separate guest_addresses table
    let addressId: string;
    
    if (user) {
      // For authenticated users, create address normally
      const [newAddress] = await db
        .insert(addresses)
        .values({
          userId: user.id,
          type: 'shipping',
          ...validatedAddress,
        })
        .returning({ id: addresses.id });
      addressId = newAddress.id;
    } else {
      // For guest users, we need to create a temporary user record or modify the schema
      // For now, let's create a guest user record for this checkout
      const [guestUser] = await db
        .insert(users)
        .values({
          email: `guest-${Date.now()}@temp.com`,
          name: 'Guest User',
          // Add other required fields as needed
        })
        .returning({ id: users.id });
      
      const [newAddress] = await db
        .insert(addresses)
        .values({
          userId: guestUser.id,
          type: 'shipping',
          ...validatedAddress,
        })
        .returning({ id: addresses.id });
      addressId = newAddress.id;
    }

    // Create order
    const [newOrder] = await db
      .insert(orders)
      .values({
        userId: user?.id || null,
        status: 'pending',
        totalAmount: finalTotal.toString(),
        shippingAddressId: addressId,
      })
      .returning({ id: orders.id });

    // Create order items
    const orderItemsData = Array.from(itemsMap.values()).map(item => ({
      orderId: newOrder.id,
      productVariantId: item.variantId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase.toString(),
    }));

    await db.insert(orderItems).values(orderItemsData);

    // Clear cart items
    await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cartId));

    // Clear guest session if it was a guest order
    if (guest.sessionToken && !user) {
      await db
        .delete(guests)
        .where(eq(guests.sessionToken, guest.sessionToken));
    }

    const newOrderId = newOrder.id;

    revalidatePath("/cart");
    revalidatePath("/checkout");
    
    return { 
      success: true, 
      orderId: newOrderId
    };
  } catch (error) {
    console.error("Error creating order:", error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues[0].message 
      };
    }
    
    return { 
      success: false, 
      error: "Failed to create order. Please try again." 
    };
  }
}

export async function getOrderById(orderId: string): Promise<OrderSummary | null> {
  try {
    const orderRows = await db
      .select({
        orderId: orders.id,
        orderStatus: orders.status,
        orderTotal: orders.totalAmount,
        orderCreatedAt: orders.createdAt,
        addressId: addresses.id,
        addressLine1: addresses.line1,
        addressLine2: addresses.line2,
        addressCity: addresses.city,
        addressState: addresses.state,
        addressCountry: addresses.country,
        addressPostalCode: addresses.postalCode,
        itemId: orderItems.id,
        itemQuantity: orderItems.quantity,
        itemPriceAtPurchase: orderItems.priceAtPurchase,
        variantId: productVariants.id,
        variantSku: productVariants.sku,
        productId: products.id,
        productName: products.name,
        productImageUrl: productImages.url,
        attributeId: attributes.id,
        attributeName: attributes.name,
        attributeDisplayName: attributes.displayName,
        attributeValueId: attributeValues.id,
        attributeValue: attributeValues.value,
      })
      .from(orders)
      .leftJoin(addresses, eq(addresses.id, orders.shippingAddressId))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(productVariants, eq(productVariants.id, orderItems.productVariantId))
      .leftJoin(products, eq(products.id, productVariants.productId))
      .leftJoin(productImages, and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true)
      ))
      .leftJoin(variantAttributeValues, eq(variantAttributeValues.variantId, productVariants.id))
      .leftJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
      .leftJoin(attributes, eq(attributes.id, attributeValues.attributeId))
      .where(eq(orders.id, orderId));

    if (orderRows.length === 0) {
      return null;
    }

    const firstRow = orderRows[0];
    const itemsMap = new Map<string, any>();
    const attributesMap = new Map<string, Array<{ name: string; value: string; displayName: string }>>();

    for (const row of orderRows) {
      if (row.itemId && !itemsMap.has(row.itemId)) {
        itemsMap.set(row.itemId, {
          id: row.itemId,
          quantity: row.itemQuantity,
          priceAtPurchase: row.itemPriceAtPurchase,
          variant: {
            id: row.variantId,
            sku: row.variantSku,
            product: {
              id: row.productId,
              name: row.productName,
              imageUrl: row.productImageUrl,
            },
            attributes: [],
          },
        });
      }

      // Collect attributes
      if (row.attributeId && row.attributeValueId && row.itemId) {
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

    return {
      id: firstRow.orderId,
      status: firstRow.orderStatus,
      totalAmount: firstRow.orderTotal,
      createdAt: firstRow.orderCreatedAt,
      shippingAddress: {
        line1: firstRow.addressLine1 || '',
        line2: firstRow.addressLine2 || '',
        city: firstRow.addressCity || '',
        state: firstRow.addressState || '',
        country: firstRow.addressCountry || '',
        postalCode: firstRow.addressPostalCode || '',
      },
      items,
    };
  } catch (error) {
    console.error("Error getting order:", error);
    return null;
  }
}

export async function clearCart() {
  try {
    const user = await getCurrentUser();
    const guest = await guestSession();

    if (!user && !guest.sessionToken) {
      return { success: false, error: "No active session" };
    }

    const cartRows = await db
      .select({ cartId: carts.id })
      .from(carts)
      .where(
        user 
          ? eq(carts.userId, user.id)
          : guest.sessionToken ? eq(carts.guestId, guest.sessionToken) : sql`1=0`
      )
      .limit(1);

    if (cartRows.length > 0) {
      await db
        .delete(cartItems)
        .where(eq(cartItems.cartId, cartRows[0].cartId));
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return { success: false, error: "Failed to clear cart" };
  }
}
