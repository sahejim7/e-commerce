"use client";

import { useState, useEffect, useMemo } from "react";
import { Suspense } from "react";
import { Star } from "lucide-react";
import Link from "next/link";
import { Card, CollapsibleSection, ProductGallery, MarkdownContent } from "@/components";
import AddToBagButton from "@/components/AddToBagButton";
import FavoriteButton from "@/components/FavoriteButton";
import ColorSwatches from "@/components/ColorSwatches";
import SizePicker from "@/components/SizePicker";
import ReviewForm from "@/components/ReviewForm";
import { formatPrice } from "@/lib/utils/price";
import { type FullProduct, type ProductVariant, type Review, type RecommendedProduct } from "@/lib/actions/product";

interface ProductExperienceProps {
  initialData: FullProduct;
  productId: string;
  reviews: Review[];
  recommendedProducts: RecommendedProduct[];
}

function NotFoundBlock() {
  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-light-300 bg-light-100 p-8 text-center">
      <h1 className="text-heading-3 text-dark-900">Product not found</h1>
      <p className="mt-2 text-body text-dark-700">The product you're looking for doesn't exist or may have been removed.</p>
      <div className="mt-6">
        <Link
          href="/products"
          className="inline-block rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
        >
          Browse Products
        </Link>
      </div>
    </section>
  );
}

function ReviewsSection({ reviews, productId, onReviewAdded }: { reviews: Review[]; productId: string; onReviewAdded: () => void }) {
  const count = reviews.length;
  const avg =
    count > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / count) : 0;

  return (
    <CollapsibleSection
      title={`Reviews (${count})`}
      rightMeta={
        <span className="flex items-center gap-1 text-dark-900">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`h-4 w-4 ${i <= Math.round(avg) ? "fill-[--color-dark-900]" : ""}`} />
          ))}
          {avg > 0 && <span className="ml-1 text-body text-dark-700">({avg.toFixed(1)})</span>}
        </span>
      }
    >
      <div className="space-y-6">
        {/* Review Form */}
        <div className="border-b border-light-300 pb-6">
          <h3 className="text-body-medium text-dark-900 mb-4">Write a Review</h3>
          <ReviewForm productId={productId} onReviewAdded={onReviewAdded} />
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-body text-dark-700">No reviews yet. Be the first to review this product!</p>
        ) : (
          <ul className="space-y-4">
            {reviews.slice(0, 10).map((r) => (
              <li key={r.id} className="rounded-lg border border-light-300 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-body-medium text-dark-900">{r.author}</p>
                  <span className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-[--color-dark-900]" : ""}`} />
                    ))}
                  </span>
                </div>
                {r.title && <p className="text-body-medium text-dark-900">{r.title}</p>}
                {r.content && <p className="mt-1 line-clamp-[8] text-body text-dark-700">{r.content}</p>}
                <p className="mt-2 text-caption text-dark-700">{new Date(r.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CollapsibleSection>
  );
}

function AlsoLikeSection({ recommendedProducts }: { recommendedProducts: RecommendedProduct[] }) {
  if (!recommendedProducts.length) return null;
  return (
    <section className="mt-16">
      <h2 className="mb-6 text-heading-3 text-dark-900">You Might Also Like</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recommendedProducts.map((p) => (
          <Card
            key={p.id}
            title={p.title}
            imageSrc={p.imageUrl}
            imageUrls={p.imageUrls}
            price={p.price ?? undefined}
            href={`/products/${p.id}`}
          />
        ))}
      </div>
    </section>
  );
}

export default function ProductExperience({ initialData, productId, reviews, recommendedProducts }: ProductExperienceProps) {
  const { product, variants, galleryImages } = initialData;
  
  // State management for the entire product experience
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentReviews, setCurrentReviews] = useState<Review[]>(reviews);

  // Handle review addition
  const handleReviewAdded = async () => {
    // Refresh reviews by fetching them again
    try {
      const { getProductReviews } = await import("@/lib/actions/product");
      const updatedReviews = await getProductReviews(productId);
      setCurrentReviews(updatedReviews);
    } catch (error) {
      console.error("Failed to refresh reviews:", error);
    }
  };

  // Get available colors from variants
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    variants.forEach(variant => {
      const colorAttr = variant.attributes.find(attr => attr.name === "color");
      if (colorAttr?.value) {
        colors.add(colorAttr.value);
      }
    });
    return Array.from(colors);
  }, [variants]);

  // Get available sizes for the selected color
  const availableSizes = useMemo(() => {
    if (!selectedColor) return [];
    
    const sizes = new Set<string>();
    variants.forEach(variant => {
      const colorAttr = variant.attributes.find(attr => attr.name === "color");
      const sizeAttr = variant.attributes.find(attr => 
        attr.name === "apparel_size" || attr.name === "waist_size" || attr.name === "Size"
      );
      
      if (colorAttr?.value === selectedColor && sizeAttr?.value) {
        sizes.add(sizeAttr.value);
      }
    });
    return Array.from(sizes).sort();
  }, [variants, selectedColor]);

  // Check if this product has size attributes
  const hasSizeAttributes = useMemo(() => {
    return variants.some(variant => {
      return variant.attributes.some(attr => 
        attr.name === "apparel_size" || attr.name === "waist_size" || attr.name === "Size"
      );
    });
  }, [variants]);

  // Find the matching variant based on selected attributes
  useEffect(() => {
    if (selectedColor) {
      let matchingVariant = null;
      
      if (hasSizeAttributes) {
        // For products with size attributes, BOTH color and size must be selected
        if (selectedSize) {
          matchingVariant = variants.find(variant => {
            const colorAttr = variant.attributes.find(attr => attr.name === "color");
            const sizeAttr = variant.attributes.find(attr => 
              attr.name === "apparel_size" || attr.name === "waist_size" || attr.name === "Size"
            );
            
            return colorAttr?.value === selectedColor && sizeAttr?.value === selectedSize;
          });
        }
        // If size is required but not selected, no variant is matched
      } else {
        // For products without size attributes (accessories), only color is needed
        matchingVariant = variants.find(variant => {
          const colorAttr = variant.attributes.find(attr => attr.name === "color");
          return colorAttr?.value === selectedColor;
        });
      }
      
      setSelectedVariant(matchingVariant || null);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedColor, selectedSize, variants, hasSizeAttributes]);

  // Initialize with first available color if none selected
  useEffect(() => {
    if (!selectedColor && availableColors.length > 0) {
      setSelectedColor(availableColors[0]);
    }
  }, [selectedColor, availableColors]);

  // Reset size when color changes
  useEffect(() => {
    setSelectedSize(null);
  }, [selectedColor]);

  // Get the main image to display (variant image or first gallery image)
  const mainImage = useMemo(() => {
    if (selectedVariant?.imageUrl) {
      return selectedVariant.imageUrl;
    }
    return galleryImages[0] || null;
  }, [selectedVariant, galleryImages]);

  // Get all images for the gallery (variant images + gallery images)
  const allImages = useMemo(() => {
    const images = [...galleryImages];
    if (selectedVariant?.imageUrl && !images.includes(selectedVariant.imageUrl)) {
      images.unshift(selectedVariant.imageUrl);
    }
    return images;
  }, [selectedVariant, galleryImages]);

  // Calculate display price based on selected variant
  const displayPrice = selectedVariant ? 
    (selectedVariant.salePrice !== null ? selectedVariant.salePrice : selectedVariant.price) : 
    (variants[0] ? (variants[0].salePrice !== null ? variants[0].salePrice : variants[0].price) : 0);
  
  const compareAt = selectedVariant ? 
    (selectedVariant.salePrice !== null ? selectedVariant.price : null) : 
    (variants[0]?.salePrice !== null ? variants[0].price : null);

  const discount = compareAt && displayPrice && compareAt > displayPrice
    ? Math.round(((compareAt - displayPrice) / compareAt) * 100)
    : null;

  const subtitle = product.gender?.label ? `${product.gender.label} Apparel` : undefined;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav className="py-4 text-caption text-dark-700">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/products" className="hover:underline">Products</Link> /{" "}
        <span className="text-dark-900">{product.name}</span>
      </nav>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_480px] lg:min-h-0">
        <ProductGallery 
          mainImage={mainImage}
          allImages={allImages}
          className="lg:sticky lg:top-6" 
        />

        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-heading-3 text-dark-900">{product.name}</h1>
          </header>

          <div className="flex items-center gap-3">
            <p className="text-lead text-dark-900">{formatPrice(displayPrice)}</p>
            {compareAt && (
              <>
                <span className="text-body text-dark-700 line-through">{formatPrice(compareAt)}</span>
                {discount !== null && (
                  <span className="rounded-full border border-light-300 px-2 py-1 text-caption text-[--color-green]">
                    {discount}% off
                  </span>
                )}
              </>
            )}
          </div>

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-body-medium text-dark-900">Select Color</p>
              <ColorSwatches 
                availableColors={availableColors}
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
                variants={variants}
              />
            </div>
          )}

          {/* Size Selection - only show if there are sizes available */}
          {availableSizes.length > 0 && (
            <SizePicker 
              availableSizes={availableSizes}
              selectedSize={selectedSize}
              onSizeSelect={setSelectedSize}
            />
          )}

          {/* Stock Status */}
          {selectedVariant && (
            <div className="text-body text-dark-700">
              {selectedVariant.inStock ? (
                <span className="text-[--color-green]">In Stock</span>
              ) : (
                <span className="text-red-500">Out of Stock</span>
              )}
            </div>
          )}

          {/* SKU Display */}
          {selectedVariant && (
            <div className="text-caption text-dark-700">
              SKU: {selectedVariant.sku}
            </div>
          )}

          <AddToBagButton
            productId={product.id}
            selectedVariant={selectedVariant}
            hasSizeAttributes={hasSizeAttributes}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
          />

          <FavoriteButton productId={product.id} />

          <CollapsibleSection title="Product Details" defaultOpen>
            <MarkdownContent content={product.description} />
          </CollapsibleSection>

          <CollapsibleSection title="Shipping & Returns">
            <MarkdownContent content="Free standard shipping and free 30-day returns for Brand Members." />
          </CollapsibleSection>

          <ReviewsSection reviews={currentReviews} productId={productId} onReviewAdded={handleReviewAdded} />
        </div>
      </section>

      <AlsoLikeSection recommendedProducts={recommendedProducts} />
    </main>
  );
}
