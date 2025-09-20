"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart";
import LoadingButton from "@/components/ui/LoadingButton";
import type { ProductVariant } from "@/lib/actions/product";

interface AddToBagButtonProps {
  productId: string;
  selectedVariant: ProductVariant | null;
  hasSizeAttributes: boolean;
  selectedColor: string | null;
  selectedSize: string | null;
  className?: string;
}

export default function AddToBagButton({
  productId,
  selectedVariant,
  hasSizeAttributes,
  selectedColor,
  selectedSize,
  className = "",
}: AddToBagButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToBag = async () => {
    if (!selectedColor) {
      setError("Please select a color");
      return;
    }

    if (hasSizeAttributes && !selectedSize) {
      setError("Please select a size");
      return;
    }

    if (!selectedVariant) {
      setError("Please make your selections");
      return;
    }

    if (!selectedVariant.inStock) {
      setError("This item is out of stock");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const success = await addItem(selectedVariant.id, 1);
      if (success) {
        toast.success("Item added to cart!");
      } else {
        toast.error("Failed to add item to cart");
        setError("Failed to add item to cart");
      }
    } catch (err) {
      toast.error("Failed to add item to cart");
      setError("Failed to add item to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const isDisabled = !selectedVariant || !selectedVariant.inStock || isAdding;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Error Message */}
      {error && (
        <p className="text-caption text-red-600">{error}</p>
      )}

      {/* Add to Bag Button */}
      <LoadingButton
        onClick={handleAddToBag}
        disabled={isDisabled}
        isLoading={isAdding}
        loadingText="Adding..."
        className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dark-900 px-6 py-4 text-body-medium font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] ${
          isDisabled
            ? "bg-light-300 text-dark-500 cursor-not-allowed border-light-300"
            : "bg-dark-900 text-light-100 hover:bg-light-100 hover:text-dark-900 hover:border-dark-900"
        }`}
      >
        <ShoppingBag className="h-5 w-5" />
        Add to Bag
      </LoadingButton>
    </div>
  );
}


