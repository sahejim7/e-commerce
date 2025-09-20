"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

export interface ProductGalleryProps {
  mainImage: string | null;
  allImages: string[];
  className?: string;
}

function isValidSrc(src: string | undefined | null) {
  return typeof src === "string" && src.trim().length > 0;
}

export default function ProductGallery({
  mainImage,
  allImages,
  className = "",
}: ProductGalleryProps) {
  const validImages = allImages.filter(isValidSrc);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Reset to first image when mainImage changes
  useEffect(() => {
    setActiveIndex(0);
    setIsZoomed(false);
  }, [mainImage]);

  // Handle zoom toggle
  const handleZoomToggle = useCallback(() => {
    setIsZoomed(prev => !prev);
  }, []);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (validImages.length === 0) return;
      setActiveIndex((i) => (i + dir + validImages.length) % validImages.length);
    },
    [validImages.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!mainRef.current) return;
      if (!document.activeElement) return;
      if (!mainRef.current.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <section className={`flex w-full flex-col gap-4 lg:flex-row min-w-0 ${className}`}>
      <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col">
        {validImages.map((src, i) => (
          <button
            key={`${src}-${i}`}
            aria-label={`Thumbnail ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-light-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] transition-transform duration-200 hover:scale-110 ${i === activeIndex ? "ring-[--color-dark-500]" : ""}`}
          >
            <Image 
              src={src} 
              alt={`Thumbnail ${i + 1}`} 
              fill 
              sizes="64px" 
              className="object-cover transition-transform duration-200 hover:scale-125" 
            />
          </button>
        ))}
      </div>

      <div ref={mainRef} className="order-1 relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-light-200 lg:order-2 isolate min-w-0">
        {validImages.length > 0 ? (
          <>
            <button
              onClick={handleZoomToggle}
              className="absolute inset-0 z-10 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
              aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            >
              <Image
                src={validImages[activeIndex]}
                alt="Product image"
                fill
                sizes="(min-width:1024px) 720px, 100vw"
                className={`object-cover transition-transform duration-300 origin-center ${
                  isZoomed ? "scale-125 cursor-zoom-out" : "scale-100"
                }`}
                priority
              />
            </button>

            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
              <button
                aria-label="Previous image"
                onClick={() => go(-1)}
                className="rounded-full bg-light-100/80 p-2 ring-1 ring-light-300 transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] pointer-events-auto"
              >
                <ChevronLeft className="h-5 w-5 text-dark-900" />
              </button>
              <button
                aria-label="Next image"
                onClick={() => go(1)}
                className="rounded-full bg-light-100/80 p-2 ring-1 ring-light-300 transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] pointer-events-auto"
              >
                <ChevronRight className="h-5 w-5 text-dark-900" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-dark-700">
            <div className="flex items-center gap-2 rounded-lg border border-light-300 bg-light-100 px-4 py-3">
              <ImageOff className="h-5 w-5" />
              <span className="text-body">No images available</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
