"use client";

import { Suspense } from "react";
import { Card } from "@/components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNewArrivalsPrice } from "@/lib/utils/price";
import type { ProductListItem, HierarchicalCategory, AttributeFilterOption, FilterOption } from "@/lib/actions/productActions";
import { HorizontalCategoryBar } from "./HorizontalCategoryBar";
import { FilterSidebar } from "./FilterSidebar";
import { ActiveFilters } from "./ActiveFilters";

interface ProductListingPageProps {
  products: ProductListItem[];
  totalCount: number;
  hierarchicalCategories: HierarchicalCategory[];
  availableAttributes: AttributeFilterOption[];
  availableBrands: FilterOption[];
  searchParams: Record<string, string | string[] | undefined>;
}

export default function ProductListingPage({
  products,
  totalCount,
  hierarchicalCategories,
  availableAttributes,
  availableBrands,
  searchParams,
}: ProductListingPageProps) {
  // Get all available categories for the current gender context
  // The hierarchicalCategories are already filtered by gender context from the server
  // We need to show ALL subcategories, not just those from parent categories with children
  
  // First, get all subcategories from parent categories that have children
  const parentCategoriesWithChildren = hierarchicalCategories.filter(cat => cat.children.length > 0);
  const subcategoriesFromParents = parentCategoriesWithChildren.flatMap(parent => 
    parent.children.map(child => ({
      ...child,
      parentSlug: parent.slug,
      parentName: parent.name
    }))
  );
  
  // Also get all categories that are not root categories (parentId is not null)
  // These are the subcategories that should be shown in the horizontal bar
  const allSubcategories = hierarchicalCategories.flatMap(cat => {
    if (cat.children.length > 0) {
      // If this category has children, return the children
      return cat.children.map(child => ({
        ...child,
        parentSlug: cat.slug,
        parentName: cat.name
      }));
    } else if (cat.parentId) {
      // If this is a subcategory (has parentId), return it
      return [{
        ...cat,
        parentSlug: 'unknown', // We'll need to find the parent
        parentName: 'Unknown Parent'
      }];
    }
    return [];
  });

  // Debug logging to see what's happening
  console.log('ProductListingPage Debug:', {
    hierarchicalCategoriesLength: hierarchicalCategories.length,
    parentCategoriesWithChildren: parentCategoriesWithChildren.map(cat => ({
      slug: cat.slug,
      name: cat.name,
      childrenCount: cat.children.length,
      children: cat.children.map(child => ({ slug: child.slug, name: child.name }))
    })),
    allSubcategories: allSubcategories.map(sub => ({
      slug: sub.slug,
      name: sub.name,
      parentSlug: sub.parentSlug,
      parentName: sub.parentName
    }))
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex gap-8">
        {/* Left Sidebar - Desktop Only */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Suspense fallback={
            <div className="sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide rounded-lg border border-gray-200 bg-white p-6">
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-6 w-20 mb-3" />
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }>
            <FilterSidebar
              availableBrands={availableBrands}
              availableAttributes={availableAttributes}
            />
          </Suspense>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Active Filter Badges */}
          <Suspense fallback={<div className="h-16" />}>
            <ActiveFilters
              availableAttributes={availableAttributes}
            />
          </Suspense>

          {/* Horizontal Category Bar */}
          <Suspense fallback={<div className="h-20 mb-6 border-b border-gray-200" />}>
            <HorizontalCategoryBar
              subcategories={allSubcategories}
            />
          </Suspense>

          {/* Mobile Filter Button - This will be handled by the FilterSidebar component */}
          <div className="mb-8 block lg:hidden">
            <FilterSidebar
              availableBrands={availableBrands}
              availableAttributes={availableAttributes}
              isMobile={true}
            />
          </div>

          {/* Product Grid */}
          <div>
            {products.length === 0 ? (
              <div className="rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-700">No products match your filters.</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/products'} 
                  className="mt-4"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                {/* Results count */}
                <div className="mb-6 text-sm text-gray-600">
                  Showing {products.length} of {totalCount} products
                </div>
                
                {/* Product Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => {
                    const price = formatNewArrivalsPrice(
                      product.minPrice,
                      product.maxPrice,
                      product.minSalePrice,
                      product.maxSalePrice
                    );
                    
                    return (
                      <Card
                        key={product.id}
                        title={product.name}
                        imageSrc={product.imageUrl ?? "/shoes/shoe-1.jpg"}
                        imageUrls={product.imageUrls}
                        price={price}
                        href={`/products/${product.id}`}
                        className="w-full"
                      />
                    );
                  })}
                </div>

                {/* Pagination could be added here if needed */}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
