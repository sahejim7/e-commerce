"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/price";
import { useState, useEffect } from "react";

export type BadgeTone = "red" | "green" | "orange";

export interface CardProps {
  title: string;
  description?: string;
  subtitle?: string;
  meta?: string | string[];
  imageSrc: string;
  imageUrls?: string[];
  imageAlt?: string;
  price?: string | number | { basePrice: string; salePrice: string | null; hasSale: boolean };
  href?: string;
  badge?: { label: string; tone?: BadgeTone };
  className?: string;
}

const toneToBg: Record<BadgeTone, string> = {
  red: "text-[--color-red]",
  green: "text-[--color-green]",
  orange: "text-[--color-orange]",
};

export default function Card({
  title,
  description,
  subtitle,
  meta,
  imageSrc,
  imageUrls = [],
  imageAlt = title,
  price,
  href,
  badge,
  className = "",
}: CardProps) {
  const displayPrice = (() => {
    if (price === undefined) return undefined;
    if (typeof price === "number") return formatPrice(price);
    if (typeof price === "string") return price;
    if (typeof price === "object" && price !== null) {
      return price;
    }
    return undefined;
  })();
  
  // Hover logic - show second image on hover, revert on leave
  const [isHovering, setIsHovering] = useState(false);
  
  // Create array of all images (primary + additional), removing duplicates
  const allImages = [imageSrc, ...imageUrls].filter((url, index, arr) => arr.indexOf(url) === index);
  
  // For hover effect, we only need the second image (index 1)
  const hoverImage = allImages.length > 1 ? allImages[1] : imageSrc;
  
  const handleMouseEnter = () => {
    setIsHovering(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovering(false);
  };
  
  const content = (
    <article
      className={`group relative bg-white border-2 border-black shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      
      {/* Image container with retro styling */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 border-b-2 border-black">
        <Image
          src={isHovering ? hoverImage : imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1280px) 360px, (min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-opacity duration-300"
        />
        {/* Retro overlay for vintage feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10"></div>
      </div>
      
      {/* Content area with retro styling */}
      <div className="p-4 bg-gradient-to-b from-white to-gray-50">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="text-body-medium text-black flex-1 line-clamp-1 leading-tight font-semibold tracking-wide">
            {title}
          </h3>
          {displayPrice && (
            <div className="flex-shrink-0">
              {typeof displayPrice === "object" && displayPrice.hasSale ? (
                <div className="flex flex-col items-end">
                  <span className="text-body text-green-600 font-bold bg-green-100 px-2 py-1 border border-green-300">
                    {displayPrice.salePrice}
                  </span>
                  <span className="text-caption text-gray-500 line-through">
                    {displayPrice.basePrice}
                  </span>
                </div>
              ) : (
                <span className="text-body text-black font-bold bg-yellow-100 px-2 py-1 border border-yellow-300">
                  {typeof displayPrice === "object" ? displayPrice.basePrice : displayPrice}
                </span>
              )}
            </div>
          )}
        </div>
        {description && (
          <p className="text-body text-gray-700 mb-2 bg-gray-100 px-2 py-1 border border-gray-300">
            {description}
          </p>
        )}
        {subtitle && (
          <p className="text-body text-gray-700 mb-2 bg-gray-100 px-2 py-1 border border-gray-300">
            {subtitle}
          </p>
        )}
        {meta && (
          <p className="mt-2 text-caption text-gray-600 bg-gray-200 px-2 py-1 border border-gray-400 font-medium">
            {Array.isArray(meta) ? meta.join(" • ") : meta}
          </p>
        )}
      </div>
    </article>
  );

  return href ? (
    <Link
      href={href}
      aria-label={title}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  ) : (
    content
  );
}
