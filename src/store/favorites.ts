"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favoriteProducts: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteProducts: [],
      
      toggleFavorite: (productId: string) => {
        const { favoriteProducts } = get();
        const isCurrentlyFavorite = favoriteProducts.includes(productId);
        
        if (isCurrentlyFavorite) {
          set({
            favoriteProducts: favoriteProducts.filter(id => id !== productId)
          });
        } else {
          set({
            favoriteProducts: [...favoriteProducts, productId]
          });
        }
      },
      
      isFavorite: (productId: string) => {
        return get().favoriteProducts.includes(productId);
      },
    }),
    {
      name: 'favorites-storage',
    }
  )
);



