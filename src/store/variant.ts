"use client";

import { create } from "zustand";

type State = {
  selectedByProduct: Record<string, number>;
  selectedSizesByProduct: Record<string, string | null>;
  setSelected: (productId: string, index: number) => void;
  getSelected: (productId: string, fallback?: number) => number;
  setSelectedSize: (productId: string, size: string | null) => void;
  getSelectedSize: (productId: string) => string | null;
};

export const useVariantStore = create<State>((set, get) => ({
  selectedByProduct: {},
  selectedSizesByProduct: {},
  setSelected: (productId, index) =>
    set((s) => ({
      selectedByProduct: { ...s.selectedByProduct, [productId]: index },
    })),
  getSelected: (productId, fallback = 0) => {
    const map = get().selectedByProduct;
    return map[productId] ?? fallback;
  },
  setSelectedSize: (productId, size) =>
    set((s) => ({
      selectedSizesByProduct: { ...s.selectedSizesByProduct, [productId]: size },
    })),
  getSelectedSize: (productId) => {
    const map = get().selectedSizesByProduct;
    return map[productId] ?? null;
  },
}));
