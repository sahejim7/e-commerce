import React from 'react';
import CategoryCarousel from './CategoryCarousel';

// Static fallback data - guaranteed to work with correct .webp files
const FALLBACK_CATEGORIES = [
  { id: '1', name: 'Best Sellers', slug: 'best-sellers', imageUrl: '/assets/category-best-sellers.webp' },
  { id: '2', name: 'Linen & Tropical Wear', slug: 'linen-tropical-wear', imageUrl: '/assets/category-linen.webp' },
  { id: '3', name: 'Essentials Collection', slug: 'essentials-collection', imageUrl: '/assets/category-essentials.webp' },
  { id: '4', name: "Men's Smart Casual", slug: 'mens-smart-casual', imageUrl: '/assets/category-mens-casual.webp' },
  { id: '5', name: "Women's Lounge & Comfort", slug: 'womens-lounge-comfort', imageUrl: '/assets/category-womens-lounge.webp' },
  { id: '6', name: 'Matching Sets', slug: 'matching-sets', imageUrl: '/assets/category-matching-sets.webp' },
];

export default function CategoryGrid() {
  // Always use static fallback categories with proper image mappings
  const categories = FALLBACK_CATEGORIES;

  return (
    <section className="w-full">
      {/* Section Title with Gap - Responsive */}
      <div className="bg-[#F9F9F9] h-[78px] flex items-center justify-center relative mb-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-8 w-full max-w-7xl px-4">
          <div className="flex-1 h-[3px] bg-[#B0B0B0]" />
          <h2 className="text-[20px] sm:text-[24px] lg:text-[26px] font-bold text-black leading-[1.0] tracking-[10%] whitespace-nowrap flex-shrink-0 text-center">
            SHOP CATEGORY
          </h2>
          <div className="flex-1 h-[3px] bg-[#B0B0B0]" />
        </div>
      </div>
      
      {/* Working Carousel Component */}
      <div className="w-full flex justify-center">
        <CategoryCarousel 
          categories={categories}
          className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-8"
        />
      </div>
    </section>
  );
}