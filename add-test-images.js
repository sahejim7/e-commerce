const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { productImages } = require('./src/lib/db/schema/images.ts');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function addTestImages() {
  try {
    // Add multiple test images to the first product
    const productId = 'efe01aaf-9821-48b0-8c41-be75d5c3d611';
    
    const testImages = [
      { productId, url: '/shoes/shoe-1.jpg', sortOrder: 1, isPrimary: true },
      { productId, url: '/shoes/shoe-2.jpg', sortOrder: 2, isPrimary: false },
      { productId, url: '/shoes/shoe-3.jpg', sortOrder: 3, isPrimary: false },
      { productId, url: '/shoes/shoe-4.jpg', sortOrder: 4, isPrimary: false }
    ];
    
    for (const image of testImages) {
      await db.insert(productImages).values(image);
      console.log('Added image:', image.url);
    }
    
    console.log('Test images added successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addTestImages();
