"use client";

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

interface EmblaCarouselProps {
  children: React.ReactNode;
  className?: string;
  autoScrollInterval?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  slidesToShow?: number;
}

export function EmblaCarousel({ 
  children, 
  className,
  autoScrollInterval = 4000,
  pauseOnHover = true,
  loop = true,
  slidesToShow = 1
}: EmblaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: false,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 1 },
      '(min-width: 1024px)': { slidesToScroll: 1 }
    }
  });
  
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const scrollToNext = useCallback(() => {
    if (emblaApi && isPlaying && !isHovered && !isTouched) {
      emblaApi.scrollNext();
    }
  }, [emblaApi, isPlaying, isHovered, isTouched]);

  const scrollToPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
    }
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    
    // Reset touch state when carousel reaches the end
    const selectedIndex = emblaApi.selectedScrollSnap();
    const slideNodes = emblaApi.slideNodes();
    if (selectedIndex === slideNodes.length - 1) {
      setTimeout(() => setIsTouched(false), 1000);
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-scroll effect
  useEffect(() => {
    if (!isPlaying || isHovered || isTouched) return;
    
    const interval = setInterval(scrollToNext, autoScrollInterval);
    return () => clearInterval(interval);
  }, [scrollToNext, autoScrollInterval, isPlaying, isHovered, isTouched]);

  // Handle touch events
  const handleTouchStart = useCallback(() => {
    setIsTouched(true);
    setIsPlaying(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Resume auto-scroll after touch interaction
    setTimeout(() => {
      setIsTouched(false);
      setIsPlaying(true);
    }, 2000);
  }, []);

  // Handle mouse events
  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) {
      setIsHovered(true);
      setIsPlaying(false);
    }
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) {
      setIsHovered(false);
      setIsPlaying(true);
    }
  }, [pauseOnHover]);

  return (
    <div 
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {React.Children.map(children, (child, index) => (
            <div key={index} className="flex-none min-w-0 pl-2 first:pl-4 last:pr-4">
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
