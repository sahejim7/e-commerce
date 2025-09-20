'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
}

interface CategoryCarouselProps {
  categories: CategoryData[];
  onCategorySelect?: (categoryId: string) => void;
  className?: string;
}

export default function CategoryCarousel({ categories, onCategorySelect, className = "" }: CategoryCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update active index based on scroll position
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      // Clear previous timeout
      clearTimeout(scrollTimeout);
      
      // Set a new timeout to debounce scroll events
      scrollTimeout = setTimeout(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const isMobile = window.innerWidth < 640;
          const cardWidth = isMobile ? 350 : 400;
          const margin = isMobile ? 2 : 4;
          const containerWidth = container.clientWidth;
          
          const scrollLeft = container.scrollLeft;
          const cardCenter = scrollLeft + (containerWidth / 2);
          const newIndex = Math.round(cardCenter / (cardWidth + margin));
          const clampedIndex = Math.max(0, Math.min(newIndex, categories.length - 1));
          
          if (clampedIndex !== activeIndex) {
            setActiveIndex(clampedIndex);
            setActiveCategory(categories[clampedIndex]?.id || '');
          }
        }
      }, 100); // 100ms debounce
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      };
    }
  }, [activeIndex, categories]);

  const handleCategoryClick = (categoryId: string, index: number) => {
    setActiveCategory(categoryId);
    setActiveIndex(index);
    onCategorySelect?.(categoryId);
    
    // Perfect mobile scroll alignment - center the card
    if (scrollContainerRef.current) {
      const isMobile = window.innerWidth < 640; // sm breakpoint
      const cardWidth = isMobile ? 350 : 400; // card width
      const margin = isMobile ? 2 : 4; // margin
      const containerWidth = scrollContainerRef.current.clientWidth;
      
      // For both mobile and desktop: center the card
      const cardCenter = (cardWidth + margin) * index + (cardWidth / 2);
      const containerCenter = containerWidth / 2;
      const scrollLeft = cardCenter - containerCenter;
      
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  };

  const scrollToNext = () => {
    if (scrollContainerRef.current) {
      const isMobile = window.innerWidth < 640; // sm breakpoint
      const cardWidth = isMobile ? 350 : 400; // card width
      const margin = isMobile ? 2 : 4; // margin
      const containerWidth = scrollContainerRef.current.clientWidth;
      
      const nextIndex = Math.min(activeIndex + 1, categories.length - 1);
      setActiveIndex(nextIndex);
      setActiveCategory(categories[nextIndex]?.id || '');
      
      const cardCenter = (cardWidth + margin) * nextIndex + (cardWidth / 2);
      const containerCenter = containerWidth / 2;
      const scrollLeft = cardCenter - containerCenter;
      
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  };

  const scrollToPrev = () => {
    if (scrollContainerRef.current) {
      const isMobile = window.innerWidth < 640; // sm breakpoint
      const cardWidth = isMobile ? 350 : 400; // card width
      const margin = isMobile ? 2 : 4; // margin
      const containerWidth = scrollContainerRef.current.clientWidth;
      
      const prevIndex = Math.max(activeIndex - 1, 0);
      setActiveIndex(prevIndex);
      setActiveCategory(categories[prevIndex]?.id || '');
      
      const cardCenter = (cardWidth + margin) * prevIndex + (cardWidth / 2);
      const containerCenter = containerWidth / 2;
      const scrollLeft = cardCenter - containerCenter;
      
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Navigation Arrows - Truly rounded buttons */}
      <button
        onClick={scrollToPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white w-12 h-12 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ borderRadius: '50%' }}
        aria-label="Previous categories"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        onClick={scrollToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white w-12 h-12 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ borderRadius: '50%' }}
        aria-label="Next categories"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Scrollable Container - Fixed mobile padding and card sizing */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide gap-0 py-8 scroll-smooth scroll-snap"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category, index) => (
          <div key={category.id} className="relative flex-none w-[350px] sm:w-[400px] h-[450px] sm:h-[500px] mx-1 sm:mx-2 group cursor-pointer overflow-hidden rounded-lg snap-center">
            {/* Background Image */}
            <div className="absolute inset-0 bg-[#ECE2D9]">
              {category.imageUrl && (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105 group-active:scale-105"
                  style={{ mixBlendMode: 'multiply' }}
                />
              )}
            </div>
            
            {/* Overlay for better contrast */}
            <div className="absolute inset-0 bg-black/10" />
            
                    {/* Category Button - Original Styling with Random Tilt */}
                    <Link href={`/collections/${category.slug}`} className="absolute inset-0">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div 
                          className={`flex-none pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-105 ${activeCategory === category.id ? 'scale-110' : ''}`} 
                          style={{ 
                            transform: `rotate(${index === 0 ? -3 : index === 1 ? 2 : index === 2 ? -4 : index === 3 ? 3 : index === 4 ? -2 : 1}deg)` 
                          }}
                        >
                          <div className="h-[76.413px] relative w-[194.199px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 195 77">
                              <path 
                                d={index % 2 === 0 ? 
                                  "M38.2061 0.801758H155.992C176.65 0.801806 193.396 17.549 193.396 38.207C193.396 58.8649 176.65 75.6113 155.992 75.6113H38.2061C17.5483 75.6111 0.801959 58.8648 0.801758 38.207C0.801758 17.5491 17.5482 0.802008 38.2061 0.801758Z" :
                                  "M38.2061 0.801758H155.992C176.65 0.801801 193.396 17.5482 193.396 38.2061C193.396 58.8641 176.65 75.6113 155.992 75.6113H38.2061C17.5482 75.6111 0.801758 58.864 0.801758 38.2061C0.802011 17.5484 17.5484 0.802015 38.2061 0.801758Z"
                                } 
                                fill="#151413" 
                                stroke="#ECE2D9" 
                                strokeWidth="1.60356"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <p className="font-['Helvetica_Neue:Bold',_sans-serif] text-[#ece2d9] text-[20px] leading-none text-center">
                                {category.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
          </div>
        ))}
      </div>

      {/* Scroll Indicators */}
      <div className="flex justify-center mt-4 gap-2">
        {categories.map((category, index) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id, index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-110 ${
              activeIndex === index 
                ? 'bg-gray-800 scale-110' 
                : 'bg-gray-300 hover:bg-gray-500 active:bg-gray-500'
            }`}
            aria-label={`Go to ${category.name}`}
          />
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scroll-snap {
          scroll-snap-type: x mandatory;
        }
        .snap-center {
          scroll-snap-align: center;
        }
      `}</style>
    </div>
  );
}