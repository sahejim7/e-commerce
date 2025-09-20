"use server";

import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  users,
  products,
  productVariants,
  type SelectOrder,
  type SelectOrderItem,
} from "@/lib/db/schema";
import { eq, desc, count, sql, and, inArray } from "drizzle-orm";

// Types for dashboard stats
export type DashboardStats = {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string | null;
    customerEmail: string;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    totalAmount: number;
    createdAt: Date;
    itemCount: number;
  }>;
};

// Server Action to get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total revenue from paid and shipped orders
    const revenueResult = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
      })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ['paid', 'shipped', 'delivered'])
        )
      );

    // Get total sales count
    const salesResult = await db
      .select({
        totalSales: count(),
      })
      .from(orders);

    // Get total products count
    const productsResult = await db
      .select({
        totalProducts: count(),
      })
      .from(products);

    // Get total users count
    const usersResult = await db
      .select({
        totalUsers: count(),
      })
      .from(users);

    // Get 5 most recent orders with customer info and item counts
    const recentOrdersQuery = db
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
      .orderBy(desc(orders.createdAt))
      .limit(5);

    // Get item counts for the recent orders
    const recentOrdersData = await recentOrdersQuery;
    const orderIds = recentOrdersData.map(order => order.id);
    
    const itemCountsQuery = orderIds.length > 0 ? db
      .select({
        orderId: orderItems.orderId,
        itemCount: count(orderItems.id),
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds))
      .groupBy(orderItems.orderId) : [];

    const [revenueData, salesData, productsData, usersData, itemCountsData] = await Promise.all([
      revenueResult,
      salesResult,
      productsResult,
      usersResult,
      orderIds.length > 0 ? itemCountsQuery : Promise.resolve([]),
    ]);

    // Create a map of item counts by order ID
    const itemCountsMap = new Map(
      itemCountsData.map(item => [item.orderId, item.itemCount])
    );

    // Build recent orders with item counts
    const recentOrders = recentOrdersData.map(order => ({
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
      totalRevenue: Number(revenueData[0]?.totalRevenue || 0),
      totalSales: salesData[0]?.totalSales || 0,
      totalProducts: productsData[0]?.totalProducts || 0,
      totalUsers: usersData[0]?.totalUsers || 0,
      recentOrders,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw new Error("Failed to fetch dashboard statistics");
  }
}
