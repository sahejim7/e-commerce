"use server";

import { db } from "@/lib/db";
import { users, orders, addresses } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/actions";
import { z } from "zod";

// Types for user actions
export type UserOrder = {
  orderId: string;
  createdAt: Date;
  status: string;
  totalAmount: string;
};

export type UserProfile = {
  id: string;
  name: string | null;
  email: string;
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

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
});

const addressSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['billing', 'shipping']),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  isDefault: z.boolean().optional().default(false),
});

/**
 * Fetches the current user's order history
 * Returns an array of orders sorted by most recent first
 */
export async function getUserOrders(): Promise<UserOrder[]> {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return [];
    }

    const userOrders = await db
      .select({
        orderId: orders.id,
        createdAt: orders.createdAt,
        status: orders.status,
        totalAmount: orders.totalAmount,
      })
      .from(orders)
      .where(eq(orders.userId, currentUser.id))
      .orderBy(desc(orders.createdAt));

    return userOrders.map(order => ({
      orderId: order.orderId,
      createdAt: order.createdAt,
      status: order.status,
      totalAmount: order.totalAmount,
    }));
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw new Error("Failed to fetch order history");
  }
}

/**
 * Fetches the current user's profile information
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return null;
    }

    return {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch user profile");
  }
}

/**
 * Updates the current user's profile information
 */
export async function updateUserProfile(formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your profile" };
    }

    const rawData = {
      name: formData.get('name') as string,
    };

    const validatedData = updateProfileSchema.parse(rawData);

    await db
      .update(users)
      .set({ 
        name: validatedData.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id));

    revalidatePath("/account");
    
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error updating user profile:", error);
    
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0].message };
    }
    
    return { success: false, message: "Failed to update profile" };
  }
}

/**
 * Fetches all addresses associated with the current user
 */
export async function getUserAddresses(): Promise<UserAddress[]> {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return [];
    }

    const userAddresses = await db
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
      .where(eq(addresses.userId, currentUser.id))
      .orderBy(desc(addresses.isDefault));

    return userAddresses.map(address => ({
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
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    throw new Error("Failed to fetch addresses");
  }
}

/**
 * Creates a new address or updates an existing one for the current user
 */
export async function addOrUpdateUserAddress(formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, message: "You must be logged in to manage addresses" };
    }

    const rawData = {
      id: formData.get('id') as string,
      type: formData.get('type') as string,
      line1: formData.get('line1') as string,
      line2: formData.get('line2') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      country: formData.get('country') as string,
      postalCode: formData.get('postalCode') as string,
      isDefault: formData.get('isDefault') === 'true',
    };

    const validatedData = addressSchema.parse(rawData);

    // If this address is being set as default, unset all other default addresses of the same type
    if (validatedData.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(addresses.userId, currentUser.id),
            eq(addresses.type, validatedData.type)
          )
        );
    }

    if (validatedData.id) {
      // Update existing address
      await db
        .update(addresses)
        .set({
          type: validatedData.type,
          line1: validatedData.line1,
          line2: validatedData.line2 || null,
          city: validatedData.city,
          state: validatedData.state,
          country: validatedData.country,
          postalCode: validatedData.postalCode,
          isDefault: validatedData.isDefault,
        })
        .where(
          and(
            eq(addresses.id, validatedData.id),
            eq(addresses.userId, currentUser.id)
          )
        );
    } else {
      // Create new address
      await db.insert(addresses).values({
        userId: currentUser.id,
        type: validatedData.type,
        line1: validatedData.line1,
        line2: validatedData.line2 || null,
        city: validatedData.city,
        state: validatedData.state,
        country: validatedData.country,
        postalCode: validatedData.postalCode,
        isDefault: validatedData.isDefault,
      });
    }

    revalidatePath("/account");
    
    return { 
      success: true, 
      message: validatedData.id ? "Address updated successfully" : "Address added successfully" 
    };
  } catch (error) {
    console.error("Error adding/updating user address:", error);
    
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0].message };
    }
    
    return { success: false, message: "Failed to save address" };
  }
}
