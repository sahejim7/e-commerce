"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { type ProductVariant } from "@/lib/actions/product";

export interface ColorSwatchesProps {
  availableColors: string[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  variants: ProductVariant[];
  className?: string;
}

export default function ColorSwatches({ 
  availableColors, 
  selectedColor, 
  onColorSelect, 
  variants, 
  className = "" 
}: ColorSwatchesProps) {
  // Get the variant image for each color
  const getColorImage = (color: string) => {
    const variant = variants.find(v => {
      const colorAttr = v.attributes.find(attr => attr.name === "color");
      return colorAttr?.value === color;
    });
    return variant?.imageUrl || null;
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`} role="listbox" aria-label="Choose color">
      {availableColors.map((color) => {
        const imageUrl = getColorImage(color);
        const isActive = selectedColor === color;
        
        return (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            aria-label={`Color ${color}`}
            aria-selected={isActive}
            role="option"
            className={`relative h-[72px] w-[120px] overflow-hidden rounded-lg ring-1 ring-light-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] ${
              isActive ? "ring-[--color-dark-500]" : "hover:ring-dark-500"
            }`}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt={color} fill sizes="120px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-light-200 text-dark-700">
                <span className="text-caption">{color}</span>
              </div>
            )}
            {isActive && (
              <span className="absolute right-1 top-1 rounded-full bg-light-100 p-1">
                <Check className="h-4 w-4 text-dark-900" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
