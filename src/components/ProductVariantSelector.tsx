"use client";

import { useMemo } from "react";
import { useVariantStore } from "@/store/variant";
import ColorSwatches from "@/components/ColorSwatches";
import SizePicker from "@/components/SizePicker";
import type { FullProduct } from "@/lib/actions/product";

type GalleryVariant = { color: string; images: string[] };

interface ProductVariantSelectorProps {
  productId: string;
  variants: FullProduct["variants"];
  images: FullProduct["images"];
  galleryVariants: GalleryVariant[];
  className?: string;
}

export default function ProductVariantSelector({
  productId,
  variants,
  images,
  galleryVariants,
  className = "",
}: ProductVariantSelectorProps) {
  const selectedColorIndex = useVariantStore((s) => s.getSelected(productId, 0));
  
  // Get the selected color from the gallery variants
  const selectedColor = galleryVariants[selectedColorIndex]?.color || "Default";
  
  // Find all variants that match the selected color
  const variantsForSelectedColor = useMemo(() => {
    return variants.filter((variant) => {
      const colorAttribute = variant.attributes.find(attr => attr.name === "color");
      return colorAttribute?.value === selectedColor;
    });
  }, [variants, selectedColor]);
  
  // Extract unique sizes from variants for the selected color
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    variantsForSelectedColor.forEach((variant) => {
      const sizeAttribute = variant.attributes.find(attr => 
        attr.name === "apparel_size" || attr.name === "waist_size" || attr.name === "Size"
      );
      if (sizeAttribute?.value) {
        sizes.add(sizeAttribute.value);
      }
    });
    return Array.from(sizes).sort();
  }, [variantsForSelectedColor]);

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <ColorSwatches productId={productId} variants={galleryVariants} />
      <SizePicker productId={productId} availableSizes={availableSizes} />
    </div>
  );
}
