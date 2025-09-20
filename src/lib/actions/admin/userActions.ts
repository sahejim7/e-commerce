"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc, count, sql, and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/actions";

// Types for user management
export type AdminUserListItem = {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
};

export type PaginatedUsers = {
  users: AdminUserListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

// Server Actions
export async function getAdminUsers(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<PaginatedUsers> {
  try {
    const offset = (page - 1) * limit;
    
    // Build where conditions for search
    const conditions = [];
    if (search) {
      conditions.push(
        sql`(${users.name} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get users with pagination
    const usersQuery = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCountQuery = db
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const [usersData, totalCountResult] = await Promise.all([
      usersQuery,
      totalCountQuery,
    ]);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const usersList: AdminUserListItem[] = usersData.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    }));

    return {
      users: usersList,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw new Error("Failed to fetch users");
  }
}

export async function toggleAdminStatus(userId: string) {
  try {
    // Get the current user to check if they're trying to revoke their own admin status
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, message: "You must be logged in to perform this action" };
    }

    if (!currentUser.isAdmin) {
      return { success: false, message: "You must be an admin to perform this action" };
    }

    // Safety check: prevent users from revoking their own admin status
    if (currentUser.id === userId) {
      return { success: false, message: "You cannot revoke your own admin privileges" };
    }

    // Fetch the target user
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser[0]) {
      return { success: false, message: "User not found" };
    }

    // Toggle the admin status
    const newAdminStatus = !targetUser[0].isAdmin;
    
    await db
      .update(users)
      .set({ isAdmin: newAdminStatus })
      .where(eq(users.id, userId));

    // Revalidate the users page to reflect the changes
    revalidatePath("/admin/users");

    return { 
      success: true, 
      message: `User ${newAdminStatus ? 'granted' : 'revoked'} admin privileges successfully` 
    };
  } catch (error) {
    console.error("Error toggling admin status:", error);
    return { success: false, message: "Failed to update admin status" };
  }
}
