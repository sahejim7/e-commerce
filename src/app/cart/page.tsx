"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils/price";


function CartItem({ item }: { item: any }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateItemQuantity, removeItem } = useCartStore();

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(true);
    setQuantity(newQuantity);
    
    const success = await updateItemQuantity(item.id, newQuantity);
    if (!success) {
      // Revert on failure
      setQuantity(item.quantity);
    }
    
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    await removeItem(item.id);
    setIsUpdating(false);
  };

  const displayPrice = parseFloat(item.variant.salePrice || item.variant.price);
  const compareAtPrice = item.variant.salePrice ? parseFloat(item.variant.price) : null;

  return (
    <div className="flex gap-4 border-b border-light-300 pb-6">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-light-200">
        {item.variant.product.imageUrl ? (
          <Image
            src={item.variant.product.imageUrl}
            alt={item.variant.product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-dark-500">
            <ShoppingBag className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-body-medium text-dark-900">
              <Link 
                href={`/products/${item.variant.product.id}`}
                className="hover:underline"
              >
                {item.variant.product.name}
              </Link>
            </h3>
            <p className="text-caption text-dark-700">SKU: {item.variant.sku}</p>
            
            {/* Display selected attributes */}
            {item.variant.attributes.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {item.variant.attributes.map((attr: any, index: number) => (
                  <span key={index} className="text-caption text-dark-600">
                    {attr.displayName}: {attr.value}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={handleRemove}
            disabled={isUpdating}
            className="text-dark-500 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isUpdating || quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-light-300 text-dark-700 hover:border-dark-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-3 w-3" />
            </button>
            
            <span className="min-w-[2rem] text-center text-body-medium">
              {isUpdating ? "..." : quantity}
            </span>
            
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isUpdating}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-light-300 text-dark-700 hover:border-dark-500 disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-body-medium text-dark-900">
              {formatPrice(displayPrice * quantity)}
            </p>
            {compareAtPrice && (
              <p className="text-caption text-dark-700 line-through">
                {formatPrice(compareAtPrice * quantity)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-light-200">
          <ShoppingBag className="h-12 w-12 text-dark-500" />
        </div>
      </div>
      
      <h1 className="mb-2 text-heading-3 text-dark-900">Your cart is empty</h1>
      <p className="mb-6 text-body text-dark-700">
        Looks like you haven't added any items to your cart yet.
      </p>
      
      <Link
        href="/products"
        className="inline-block rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

export default function CartPage() {
  const { cart, isLoading, getTotal } = useCartStore();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-body text-dark-700">Loading cart...</div>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-body text-dark-700 hover:text-dark-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </nav>
        
        <EmptyCart />
      </main>
    );
  }

  const subtotal = getTotal();
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over LKR 100
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-body text-dark-700 hover:text-dark-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </nav>

      <div className="mb-8">
        <h1 className="text-heading-2 text-dark-900">Shopping Cart</h1>
        <p className="mt-2 text-body text-dark-700">
          {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {cart.items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-xl border border-light-300 bg-light-100 p-6">
            <h2 className="mb-4 text-heading-4 text-dark-900">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-body text-dark-700">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-body text-dark-700">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              
              <div className="flex justify-between text-body text-dark-700">
                <span>Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              
              <div className="border-t border-light-300 pt-3">
                <div className="flex justify-between text-body-medium text-dark-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/checkout"
                className="block w-full rounded-full bg-dark-900 px-6 py-4 text-center text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
              >
                Proceed to Checkout
              </Link>
              
              <Link
                href="/products"
                className="block w-full rounded-full border border-light-300 px-6 py-4 text-center text-body-medium text-dark-900 transition hover:border-dark-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
              >
                Continue Shopping
              </Link>
            </div>

            {subtotal < 100 && (
              <div className="mt-4 rounded-lg bg-light-200 p-3 text-center">
                <p className="text-caption text-dark-700">
                  Add {formatPrice(100 - subtotal)} more for free shipping
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
