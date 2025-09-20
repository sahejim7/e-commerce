"use server";

import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  users,
  addresses,
  productVariants,
  products,
  colors,
  sizes,
  variantAttributeValues,
  attributes,
  attributeValues,
  type SelectOrder,
  type SelectOrderItem,
  type SelectAddress,
  type SelectProduct,
  type SelectColor,
  type SelectSize,
  type SelectVariant,
} from "@/lib/db/schema";
import { eq, desc, asc, and, count, sql, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Utility function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Types for order management
export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  createdAt: Date;
  itemCount: number;
};

export type AdminOrderDetails = {
  order: SelectOrder & {
    user?: {
      id: string;
      name: string | null;
      email: string;
      emailVerified: boolean;
      image: string | null;
      isAdmin: boolean;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    shippingAddress?: SelectAddress | null;
    billingAddress?: SelectAddress | null;
  };
  items: Array<SelectOrderItem & {
    variant: SelectVariant & {
      product: SelectProduct;
      attributes: Record<string, string>;
    };
  }>;
};

export type PaginatedOrders = {
  orders: AdminOrderListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

// Server Actions
export async function getAdminOrders(
  page: number = 1,
  limit: number = 20,
  search?: string,
  status?: string
): Promise<PaginatedOrders> {
  try {
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(
        sql`(${users.name} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`} OR ${orders.id}::text ILIKE ${`%${search}%`})`
      );
    }
    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status as 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get orders with customer information
    const ordersQuery = db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: sql<number>`${orders.totalAmount}::numeric`,
        createdAt: orders.createdAt,
        customerName: users.name,
        customerEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.userId))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get item counts for each order
    const itemCountsQuery = db
      .select({
        orderId: orderItems.orderId,
        itemCount: count(orderItems.id),
      })
      .from(orderItems)
      .groupBy(orderItems.orderId);

    // Get total count
    const totalCountQuery = db
      .select({ count: count() })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.userId))
      .where(whereClause);

    const [ordersData, itemCounts, totalCountResult] = await Promise.all([
      ordersQuery,
      itemCountsQuery,
      totalCountQuery,
    ]);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Create a map of item counts by order ID
    const itemCountsMap = new Map(
      itemCounts.map(item => [item.orderId, item.itemCount])
    );

    const ordersList: AdminOrderListItem[] = ordersData.map(order => ({
      id: order.id,
      orderNumber: order.id.slice(-8).toUpperCase(), // Use last 8 characters as order number
      customerName: order.customerName,
      customerEmail: order.customerEmail || 'Guest',
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      itemCount: itemCountsMap.get(order.id) || 0,
    }));

    return {
      orders: ordersList,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    throw new Error("Failed to fetch orders");
  }
}

export async function getAdminOrderDetails(orderId: string): Promise<AdminOrderDetails | null> {
  try {
    // Validate UUID format
    if (!isValidUUID(orderId)) {
      return null;
    }

    // Get order with customer and address information
    const orderData = await db
      .select({
        // Order fields
        orderId: orders.id,
        orderStatus: orders.status,
        orderTotalAmount: sql<number>`${orders.totalAmount}::numeric`,
        orderCreatedAt: orders.createdAt,
        orderUserId: orders.userId,
        orderShippingAddressId: orders.shippingAddressId,
        orderBillingAddressId: orders.billingAddressId,
        
        // User fields
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
        userIsAdmin: users.isAdmin,
        userCreatedAt: users.createdAt,
        userUpdatedAt: users.updatedAt,
        
        // Shipping address fields
        shippingId: sql`shipping.id`,
        shippingUserId: sql`shipping.user_id`,
        shippingType: sql`shipping.type`,
        shippingLine1: sql`shipping.line1`,
        shippingLine2: sql`shipping.line2`,
        shippingCity: sql`shipping.city`,
        shippingState: sql`shipping.state`,
        shippingCountry: sql`shipping.country`,
        shippingPostalCode: sql`shipping.postal_code`,
        shippingIsDefault: sql`shipping.is_default`,
        
        // Billing address fields
        billingId: sql`billing.id`,
        billingUserId: sql`billing.user_id`,
        billingType: sql`billing.type`,
        billingLine1: sql`billing.line1`,
        billingLine2: sql`billing.line2`,
        billingCity: sql`billing.city`,
        billingState: sql`billing.state`,
        billingCountry: sql`billing.country`,
        billingPostalCode: sql`billing.postal_code`,
        billingIsDefault: sql`billing.is_default`,
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.userId))
      .leftJoin(sql`addresses as shipping`, sql`shipping.id = ${orders.shippingAddressId}`)
      .leftJoin(sql`addresses as billing`, sql`billing.id = ${orders.billingAddressId}`)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderData.length) {
      return null;
    }

    const orderRow = orderData[0];

    // Get order items with product variant details
    const itemsData = await db
      .select({
        // Order item fields
        itemId: orderItems.id,
        itemOrderId: orderItems.orderId,
        itemProductVariantId: orderItems.productVariantId,
        itemQuantity: orderItems.quantity,
        itemPriceAtPurchase: sql<number>`${orderItems.priceAtPurchase}::numeric`,
        
        // Product variant fields
        variantId: productVariants.id,
        variantProductId: productVariants.productId,
        variantSku: productVariants.sku,
        variantPrice: sql<number>`${productVariants.price}::numeric`,
        variantSalePrice: sql<number>`${productVariants.salePrice}::numeric`,
        // Note: colorId and sizeId are now handled through variantAttributeValues relationship
        // variantColorId: productVariants.colorId,
        // variantSizeId: productVariants.sizeId,
        variantInStock: productVariants.inStock,
        variantWeight: productVariants.weight,
        variantDimensions: productVariants.dimensions,
        variantCreatedAt: productVariants.createdAt,
        
        // Product fields
        productId: products.id,
        productName: products.name,
        productDescription: products.description,
        productCategoryId: products.categoryId,
        productGenderId: products.genderId,
        productBrandId: products.brandId,
        productIsPublished: products.isPublished,
        productDefaultVariantId: products.defaultVariantId,
        productCreatedAt: products.createdAt,
        productUpdatedAt: products.updatedAt,
        
        // Color and size fields are handled through variantAttributeValues relationship
        // colorId: colors.id,
        // colorName: colors.name,
        // colorSlug: colors.slug,
        // colorHexCode: colors.hexCode,
        
        // sizeId: sizes.id,
        // sizeName: sizes.name,
        // sizeSlug: sizes.slug,
        // sizeSortOrder: sizes.sortOrder,
      })
      .from(orderItems)
      .innerJoin(productVariants, eq(productVariants.id, orderItems.productVariantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      // Note: Color and size information is handled through variantAttributeValues relationship
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(products.name));

    // Build the order object
    const order: SelectOrder & {
      user?: {
        id: string;
        name: string | null;
        email: string;
        emailVerified: boolean;
        image: string | null;
        isAdmin: boolean;
        createdAt: Date;
        updatedAt: Date;
      } | null;
      shippingAddress?: SelectAddress | null;
      billingAddress?: SelectAddress | null;
    } = {
      id: orderRow.orderId,
      userId: orderRow.orderUserId,
      status: orderRow.orderStatus,
      totalAmount: orderRow.orderTotalAmount,
      shippingAddressId: orderRow.orderShippingAddressId,
      billingAddressId: orderRow.orderBillingAddressId,
      createdAt: orderRow.orderCreatedAt,
      user: orderRow.userId ? {
        id: orderRow.userId,
        name: orderRow.userName,
        email: orderRow.userEmail || '',
        emailVerified: false,
        image: orderRow.userImage,
        isAdmin: orderRow.userIsAdmin || false,
        createdAt: orderRow.userCreatedAt || new Date(),
        updatedAt: orderRow.userUpdatedAt || new Date(),
      } : null,
      shippingAddress: orderRow.shippingId ? {
        id: orderRow.shippingId as string,
        userId: orderRow.shippingUserId as string,
        type: orderRow.shippingType as 'billing' | 'shipping',
        line1: orderRow.shippingLine1 as string,
        line2: orderRow.shippingLine2 as string | null,
        city: orderRow.shippingCity as string,
        state: orderRow.shippingState as string,
        country: orderRow.shippingCountry as string,
        postalCode: orderRow.shippingPostalCode as string,
        isDefault: orderRow.shippingIsDefault as boolean,
      } : null,
      billingAddress: orderRow.billingId ? {
        id: orderRow.billingId as string,
        userId: orderRow.billingUserId as string,
        type: orderRow.billingType as 'billing' | 'shipping',
        line1: orderRow.billingLine1 as string,
        line2: orderRow.billingLine2 as string | null,
        city: orderRow.billingCity as string,
        state: orderRow.billingState as string,
        country: orderRow.billingCountry as string,
        postalCode: orderRow.billingPostalCode as string,
        isDefault: orderRow.billingIsDefault as boolean,
      } : null,
    };

    // Get all attribute information for each variant through attributes
    const variantIds = itemsData.map(item => item.variantId);
    const variantAttributes = await db
      .select({
        variantId: variantAttributeValues.variantId,
        attributeName: attributes.name,
        attributeDisplayName: attributes.displayName,
        attributeValue: attributeValues.value,
        attributeSortOrder: attributeValues.sortOrder,
      })
      .from(variantAttributeValues)
      .innerJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
      .innerJoin(attributes, eq(attributes.id, attributeValues.attributeId))
      .where(inArray(variantAttributeValues.variantId, variantIds));

    // Group attributes by variant - dynamically handle any attribute types
    const attributesByVariant = new Map<string, Record<string, string>>();
    for (const attr of variantAttributes) {
      if (!attributesByVariant.has(attr.variantId)) {
        attributesByVariant.set(attr.variantId, {});
      }
      const variantAttrs = attributesByVariant.get(attr.variantId)!;
      variantAttrs[attr.attributeName] = attr.attributeValue;
    }

    // Build the items array
    const items: Array<SelectOrderItem & {
      variant: SelectVariant & {
        product: SelectProduct;
        attributes: Record<string, string>;
      };
    }> = itemsData.map(item => {
      const variantAttrs = attributesByVariant.get(item.variantId) || {};
      return {
        id: item.itemId,
        orderId: item.itemOrderId,
        productVariantId: item.itemProductVariantId,
        quantity: item.itemQuantity,
        priceAtPurchase: item.itemPriceAtPurchase,
        variant: {
          id: item.variantId,
          productId: item.variantProductId,
          sku: item.variantSku,
          price: String(item.variantPrice),
          salePrice: item.variantSalePrice ? String(item.variantSalePrice) : null,
          // Note: colorId and sizeId are now handled through variantAttributeValues relationship
          // colorId: item.variantColorId,
          // sizeId: item.variantSizeId,
          inStock: item.variantInStock,
          weight: item.variantWeight,
          dimensions: item.variantDimensions as { length?: number; width?: number; height?: number } | null,
          createdAt: item.variantCreatedAt,
          product: {
            id: item.productId,
            name: item.productName,
            description: item.productDescription,
            categoryId: item.productCategoryId,
            genderId: item.productGenderId,
            brandId: item.productBrandId,
            isPublished: item.productIsPublished,
            defaultVariantId: item.productDefaultVariantId,
            createdAt: item.productCreatedAt,
            updatedAt: item.productUpdatedAt,
          },
        attributes: variantAttrs,
        },
      };
    });

    return {
      order,
      items,
    };
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw new Error("Failed to fetch order details");
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string): Promise<{ success: boolean; message: string }> {
  try {
    // Validate UUID format
    if (!isValidUUID(orderId)) {
      return {
        success: false,
        message: "Invalid order ID format"
      };
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        message: "Invalid order status"
      };
    }

    // Check if order exists
    const existingOrder = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder.length) {
      return {
        success: false,
        message: "Order not found"
      };
    }

    // Update the order status
    await db
      .update(orders)
      .set({ status: newStatus as 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' })
      .where(eq(orders.id, orderId));

    // Revalidate the order details page to show the updated status
    revalidatePath(`/admin/orders/${orderId}`);

    return {
      success: true,
      message: `Order status updated to ${newStatus}`
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      message: "Failed to update order status"
    };
  }
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Validate UUID format
    if (!isValidUUID(orderId)) {
      return {
        success: false,
        message: "Invalid order ID format"
      };
    }

    // Check if order exists
    const existingOrder = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder.length) {
      return {
        success: false,
        message: "Order not found"
      };
    }

    // Delete order items first (due to foreign key constraint)
    await db
      .delete(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Delete the order
    await db
      .delete(orders)
      .where(eq(orders.id, orderId));

    // Revalidate the orders list page
    revalidatePath('/admin/orders');

    return {
      success: true,
      message: "Order deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting order:", error);
    return {
      success: false,
      message: "Failed to delete order"
    };
  }
}
