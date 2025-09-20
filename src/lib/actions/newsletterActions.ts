"use server";

import { z } from 'zod';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const emailSchema = z.string().email('Please enter a valid email address');

export async function subscribeToNewsletter(formData: FormData) {
  try {
    const email = formData.get('email') as string;

    // Validate email using Zod
    const validationResult = emailSchema.safeParse(email);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message
      };
    }

    const validatedEmail = validationResult.data;

    // Check if email already exists
    const existingSubscriber = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, validatedEmail))
      .limit(1);

    if (existingSubscriber.length > 0) {
      return {
        success: false,
        error: 'This email is already subscribed.'
      };
    }

    // Insert new subscriber
    await db.insert(subscribers).values({
      email: validatedEmail,
    });

    return {
      success: true,
      message: 'Thank you for subscribing!'
    };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again.'
    };
  }
}






