"use client";

import { addCartItem as serverAddCartItem, updateCartItemQuantity as serverUpdateCartItemQuantity, removeCartItem as serverRemoveCartItem } from "./cartActions";

export async function addCartItem(variantId: string, quantity: number) {
  const formData = new FormData();
  formData.append('variantId', variantId);
  formData.append('quantity', quantity.toString());
  
  return await serverAddCartItem(formData);
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  return await serverUpdateCartItemQuantity(itemId, quantity);
}

export async function removeCartItem(itemId: string) {
  return await serverRemoveCartItem(itemId);
}



