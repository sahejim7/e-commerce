"use client";

import { Heart } from "lucide-react";
import { useFavoritesStore } from "@/store/favorites";

interface FavoriteButtonProps {
  productId: string;
  className?: string;
}

export default function FavoriteButton({ productId, className = "" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const isFavorited = isFavorite(productId);

  const handleToggle = () => {
    toggleFavorite(productId);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center gap-2 rounded-lg border-2 border-light-300 px-6 py-4 text-body-medium font-medium text-dark-900 transition-all duration-200 hover:border-dark-900 hover:bg-dark-900 hover:text-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] ${className}`}
    >
      <Heart 
        className={`h-5 w-5 transition-colors ${
          isFavorited ? "fill-red-500 text-red-500" : ""
        }`} 
      />
      {isFavorited ? "Favorited" : "Favorite"}
    </button>
  );
}



