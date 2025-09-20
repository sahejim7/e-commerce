/**
 * Compress an image file to reduce its size
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param maxHeight - Maximum height in pixels (default: 600)
 * @param quality - JPEG quality (0-1, default: 0.8)
 * @returns Promise<File> - The compressed image file
 */
export function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert a file to Base64 data URL
 * @param file - The file to convert
 * @returns Promise<string> - The Base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Process multiple image files: compress and convert to Base64
 * @param files - Array of image files
 * @returns Promise<string[]> - Array of Base64 data URLs
 */
export async function processImages(files: File[]): Promise<string[]> {
  const processedImages: string[] = [];
  
  for (const file of files) {
    try {
      // Compress the image first
      const compressedFile = await compressImage(file);
      // Convert to Base64
      const base64 = await fileToBase64(compressedFile);
      processedImages.push(base64);
    } catch (error) {
      console.error('Error processing image:', file.name, error);
      // If compression fails, try without compression
      try {
        const base64 = await fileToBase64(file);
        processedImages.push(base64);
      } catch (fallbackError) {
        console.error('Fallback also failed for:', file.name, fallbackError);
      }
    }
  }
  
  return processedImages;
}
