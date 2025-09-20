"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShoppingBag, Loader2, UserPlus } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { createOrder } from "@/lib/actions/checkoutActions";
import { formatPrice } from "@/lib/utils/price";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface FormData {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface FormErrors {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

function ShippingAddressForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<FormData>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.line1.trim()) {
      newErrors.line1 = "Address line 1 is required";
    }
    
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }
    
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-heading-3 text-dark-900 mb-6">Shipping Address</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="line1">Address Line 1 *</Label>
          <Input
            id="line1"
            name="line1"
            value={formData.line1}
            onChange={(e) => handleInputChange("line1", e.target.value)}
            placeholder="Street address"
            className={errors.line1 ? "border-red-500" : ""}
            disabled={isLoading}
          />
          {errors.line1 && (
            <p className="text-sm text-red-600 mt-1">{errors.line1}</p>
          )}
        </div>

        <div>
          <Label htmlFor="line2">Address Line 2</Label>
          <Input
            id="line2"
            name="line2"
            value={formData.line2}
            onChange={(e) => handleInputChange("line2", e.target.value)}
            placeholder="Apartment, suite, etc. (optional)"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="City"
              className={errors.city ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.city && (
              <p className="text-sm text-red-600 mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={(e) => handleInputChange("state", e.target.value)}
              placeholder="State"
              className={errors.state ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.state && (
              <p className="text-sm text-red-600 mt-1">{errors.state}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              name="country"
              value={formData.country}
              onChange={(e) => handleInputChange("country", e.target.value)}
              placeholder="Country"
              className={errors.country ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.country && (
              <p className="text-sm text-red-600 mt-1">{errors.country}</p>
            )}
          </div>

          <div>
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleInputChange("postalCode", e.target.value)}
              placeholder="Postal code"
              className={errors.postalCode ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.postalCode && (
              <p className="text-sm text-red-600 mt-1">{errors.postalCode}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing Order...
            </>
          ) : (
            "Complete Order"
          )}
        </Button>
        
        {/* Guest Account Creation Option */}
        <div className="mt-6 p-4 bg-light-100 rounded-lg border border-light-300">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-5 w-5 text-dark-700" />
            <h4 className="text-body-medium text-dark-900">Create an Account</h4>
          </div>
          <p className="text-caption text-dark-700 mb-3">
            Creating an account will let you track your order and save your information for future purchases.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <Link href="/sign-up">
              Create Account
            </Link>
          </Button>
        </div>
      </form>
    </Card>
  );
}

function OrderSummary({ cart, getTotal }: { cart: any; getTotal: () => number }) {
  const subtotal = getTotal();
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over LKR 100
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  return (
    <Card className="p-6">
      <h2 className="text-heading-3 text-dark-900 mb-6">Order Summary</h2>
      
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cart.items.map((item: any) => {
          const displayPrice = parseFloat(item.variant.salePrice || item.variant.price);
          const compareAtPrice = item.variant.salePrice ? parseFloat(item.variant.price) : null;
          
          return (
            <div key={item.id} className="flex gap-3">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-light-200">
                {item.variant.product.imageUrl ? (
                  <Image
                    src={item.variant.product.imageUrl}
                    alt={item.variant.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-dark-500">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-body-medium text-dark-900 truncate">
                  {item.variant.product.name}
                </h4>
                <p className="text-caption text-dark-700">SKU: {item.variant.sku}</p>
                
                {/* Display selected attributes */}
                {item.variant.attributes.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.variant.attributes.map((attr: any, index: number) => (
                      <span key={index} className="text-caption text-dark-600">
                        {attr.displayName}: {attr.value}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-body-medium text-dark-900">
                    Qty: {item.quantity}
                  </span>
                  <span className="text-body-medium text-dark-900">
                    {formatPrice(displayPrice * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Totals */}
      <div className="border-t border-light-300 pt-4 space-y-3">
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

      {subtotal < 100 && (
        <div className="mt-4 rounded-lg bg-light-200 p-3 text-center">
          <p className="text-caption text-dark-700">
            Add {formatPrice(100 - subtotal)} more for free shipping
          </p>
        </div>
      )}
    </Card>
  );
}

export default function CheckoutPage() {
  const { cart, isLoading, getTotal } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isLoading && (!cart || cart.items.length === 0)) {
      router.push("/cart");
    }
  }, [cart, isLoading, router]);

  const handleOrderSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });
      
      const result = await createOrder(formDataObj as any);

      if (result.success && result.orderId) {
        router.push(`/checkout/success/${result.orderId}`);
      } else {
        setError(result.error || "Failed to create order");
      }
    } catch (err) {
      console.error("Order submission error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-body text-dark-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading checkout...
          </div>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-body text-dark-700 hover:text-dark-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </nav>
        
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-heading-2 text-dark-900 mb-4">Your cart is empty</h1>
          <p className="text-body text-dark-700 mb-6">
            Please add items to your cart before proceeding to checkout.
          </p>
          <Link
            href="/products"
            className="inline-block rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-body text-dark-700 hover:text-dark-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>
      </nav>

      <div className="mb-8">
        <h1 className="text-heading-2 text-dark-900">Checkout</h1>
        <p className="mt-2 text-body text-dark-700">
          Complete your order with secure checkout
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-body text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column - Shipping Address Form */}
        <div>
          <ShippingAddressForm 
            onSubmit={handleOrderSubmit}
            isLoading={isSubmitting}
          />
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <OrderSummary cart={cart} getTotal={getTotal} />
        </div>
      </div>
    </main>
  );
}
