"use server";

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Convert a file to a buffer
 */
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload a single image file to Cloudinary
 */
async function uploadSingleImage(file: File): Promise<string> {
  try {
    // Convert file to buffer
    const buffer = await fileToBuffer(file);
    
    // Create a readable stream from buffer
    const stream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });

    // Upload to Cloudinary using upload_stream
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'my_clothing_brand_products',
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Failed to upload image: ${error.message}`));
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('No result from Cloudinary upload'));
          }
        }
      );

      // Write buffer to stream and end it
      uploadStream.write(buffer);
      uploadStream.end();
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param formData - FormData containing image files
 * @returns Promise<string[]> - Array of secure URLs
 */
export async function uploadImages(formData: FormData): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  try {
    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
    }

    // Extract files from FormData
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.type.startsWith('image/')) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return { success: false, error: 'No valid image files found in the form data' };
    }

    // Validate file types and sizes
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return { 
          success: false, 
          error: `Invalid file type: ${file.type}. Only JPEG, PNG, WebP, and GIF images are allowed.` 
        };
      }
      if (file.size > maxFileSize) {
        return { 
          success: false, 
          error: `File ${file.name} is too large. Maximum size is 10MB.` 
        };
      }
    }

    // Upload all images concurrently
    const uploadPromises = files.map(file => uploadSingleImage(file));
    const urls = await Promise.all(uploadPromises);

    return { success: true, urls };
  } catch (error) {
    console.error('Error in uploadImages:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred during upload' 
    };
  }
}

/**
 * Delete an image from Cloudinary
 * @param imageUrl - The Cloudinary URL to delete
 * @returns Promise<boolean> - Success status
 */
export async function deleteImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract public ID from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    const fullPublicId = `my_clothing_brand_products/${publicId}`;

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(fullPublicId);
    
    if (result.result === 'ok') {
      return { success: true };
    } else {
      return { success: false, error: `Failed to delete image: ${result.result}` };
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete image' 
    };
  }
}

/**
 * Get Cloudinary configuration status
 * @returns Object with configuration status
 */
export async function getCloudinaryStatus(): Promise<{ configured: boolean; error?: string }> {
  try {
    const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
    const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;

    if (!hasCloudName || !hasApiKey || !hasApiSecret) {
      return { 
        configured: false, 
        error: 'Missing Cloudinary environment variables. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.' 
      };
    }

    return { configured: true };
  } catch (error) {
    return { 
      configured: false, 
      error: error instanceof Error ? error.message : 'Unknown configuration error' 
    };
  }
}
