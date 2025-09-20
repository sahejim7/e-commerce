"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

export default function CartInitializer() {
  const { initializeCart } = useCartStore();

  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  return null;
}


