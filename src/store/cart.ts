"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCart, type Cart, type CartItem } from '@/lib/actions/cartActions';
import { addCartItem, updateCartItemQuantity, removeCartItem } from '@/lib/actions/cartClientActions';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => void;
  
  // Computed values
  getItemCount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,

      initializeCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const cart = await getCart();
          set({ cart, isLoading: false });
        } catch (error) {
          console.error('Failed to initialize cart:', error);
          set({ error: 'Failed to load cart', isLoading: false });
        }
      },

      addItem: async (variantId: string, quantity = 1) => {
        set({ isLoading: true, error: null });
        try {
          const result = await addCartItem(variantId, quantity);
          
          if (result.success) {
            // Refresh cart data
            const cart = await getCart();
            set({ cart, isLoading: false });
            return true;
          } else {
            set({ error: result.error || 'Failed to add item', isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Failed to add item to cart:', error);
          set({ error: 'Failed to add item to cart', isLoading: false });
          return false;
        }
      },

      removeItem: async (itemId: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await removeCartItem(itemId);
          
          if (result.success) {
            // Refresh cart data
            const cart = await getCart();
            set({ cart, isLoading: false });
            return true;
          } else {
            set({ error: result.error || 'Failed to remove item', isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Failed to remove item from cart:', error);
          set({ error: 'Failed to remove item from cart', isLoading: false });
          return false;
        }
      },

      updateItemQuantity: async (itemId: string, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
          const result = await updateCartItemQuantity(itemId, quantity);
          
          if (result.success) {
            // Refresh cart data
            const cart = await getCart();
            set({ cart, isLoading: false });
            return true;
          } else {
            set({ error: result.error || 'Failed to update quantity', isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Failed to update item quantity:', error);
          set({ error: 'Failed to update quantity', isLoading: false });
          return false;
        }
      },

      clearCart: () => {
        set({ cart: null, error: null });
      },

      getItemCount: () => {
        const cart = get().cart;
        return cart?.itemCount || 0;
      },

      getTotal: () => {
        const cart = get().cart;
        return cart?.total || 0;
      },
    }),
    {
      name: 'cart-storage',
      // Only persist the cart data, not the loading states
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);