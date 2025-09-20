"use server";

import { db } from "@/lib/db";
import { users, orders, orderItems, addresses, productVariants, products, variantAttributeValues, attributeValues, attributes } from "@/lib/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";

// Types for user details
export type UserDetails = {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  image: string | null;
  emailVerified: boolean;
};

export type UserOrderHistory = {
  id: string;
  orderNumber: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  createdAt: Date;
  itemCount: number;
  items: Array<{
    id: string;
    productName: string;
    variantSku: string;
    quantity: number;
    priceAtPurchase: number;
    attributes: Record<string, string>;
  }>;
};

export type UserAddress = {
  id: string;
  type: 'billing' | 'shipping';
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
};

// Server Actions
export async function getAdminUserDetails(userId: string): Promise<UserDetails | null> {
  try {
    // Validate UUID format
    if (!isValidUUID(userId)) {
      return null;
    }

    // Get current user to check admin status
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.isAdmin) {
      throw new Error("Unauthorized access");
    }

    // Get user details
    const userData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        image: users.image,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData.length) {
      return null;
    }

    const user = userData[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      image: user.image,
      emailVerified: user.emailVerified,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw new Error("Failed to fetch user details");
  }
}

export async function getAdminUserOrders(userId: string): Promise<UserOrderHistory[]> {
  try {
    // Validate UUID format
    if (!isValidUUID(userId)) {
      return [];
    }

    // Get current user to check admin status
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.isAdmin) {
      throw new Error("Unauthorized access");
    }

    // Get user's orders
    const ordersData = await db
      .select({
        orderId: orders.id,
        orderStatus: orders.status,
        orderTotalAmount: sql<number>`${orders.totalAmount}::numeric`,
        orderCreatedAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    if (!ordersData.length) {
      return [];
    }

    // Get order items for each order
    const orderIds = ordersData.map(order => order.orderId);
    const itemsData = await db
      .select({
        itemId: orderItems.id,
        itemOrderId: orderItems.orderId,
        itemQuantity: orderItems.quantity,
        itemPriceAtPurchase: sql<number>`${orderItems.priceAtPurchase}::numeric`,
        
        // Product variant fields
        variantId: productVariants.id,
        variantSku: productVariants.sku,
        
        // Product fields
        productId: products.id,
        productName: products.name,
      })
      .from(orderItems)
      .innerJoin(productVariants, eq(productVariants.id, orderItems.productVariantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(inArray(orderItems.orderId, orderIds));

    // Get attributes for variants
    const variantIds = itemsData.map(item => item.variantId);
    const variantAttributes = await db
      .select({
        variantId: variantAttributeValues.variantId,
        attributeName: attributes.name,
        attributeValue: attributeValues.value,
      })
      .from(variantAttributeValues)
      .innerJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
      .innerJoin(attributes, eq(attributes.id, attributeValues.attributeId))
      .where(inArray(variantAttributeValues.variantId, variantIds));

    // Group attributes by variant
    const attributesByVariant = new Map<string, Record<string, string>>();
    for (const attr of variantAttributes) {
      if (!attributesByVariant.has(attr.variantId)) {
        attributesByVariant.set(attr.variantId, {});
      }
      const variantAttrs = attributesByVariant.get(attr.variantId)!;
      variantAttrs[attr.attributeName] = attr.attributeValue;
    }

    // Group items by order
    const itemsByOrder = new Map<string, any[]>();
    for (const item of itemsData) {
      if (!itemsByOrder.has(item.itemOrderId)) {
        itemsByOrder.set(item.itemOrderId, []);
      }
      const variantAttrs = attributesByVariant.get(item.variantId) || {};
      itemsByOrder.get(item.itemOrderId)!.push({
        id: item.itemId,
        productName: item.productName,
        variantSku: item.variantSku,
        quantity: item.itemQuantity,
        priceAtPurchase: item.itemPriceAtPurchase,
        attributes: variantAttrs,
      });
    }

    // Build the orders array
    const userOrders: UserOrderHistory[] = ordersData.map(order => ({
      id: order.orderId,
      orderNumber: order.orderId.slice(-8).toUpperCase(),
      status: order.orderStatus,
      totalAmount: Number(order.orderTotalAmount),
      createdAt: order.orderCreatedAt,
      itemCount: itemsByOrder.get(order.orderId)?.length || 0,
      items: itemsByOrder.get(order.orderId) || [],
    }));

    return userOrders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw new Error("Failed to fetch user orders");
  }
}

export async function getAdminUserAddresses(userId: string): Promise<UserAddress[]> {
  try {
    // Validate UUID format
    if (!isValidUUID(userId)) {
      return [];
    }

    // Get current user to check admin status
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.isAdmin) {
      throw new Error("Unauthorized access");
    }

    // Get user's addresses
    const addressesData = await db
      .select({
        id: addresses.id,
        type: addresses.type,
        line1: addresses.line1,
        line2: addresses.line2,
        city: addresses.city,
        state: addresses.state,
        country: addresses.country,
        postalCode: addresses.postalCode,
        isDefault: addresses.isDefault,
      })
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.id));

    const userAddresses: UserAddress[] = addressesData.map(address => ({
      id: address.id,
      type: address.type,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    }));

    return userAddresses;
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    throw new Error("Failed to fetch user addresses");
  }
}

// Utility function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
