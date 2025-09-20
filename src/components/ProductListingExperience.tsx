"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, X, Filter } from "lucide-react";
import { getFilteredProducts } from "@/lib/actions/productActions";
import { parseFilterParams, toggleArrayParam, setParam, removeParams, getArrayParam } from "@/lib/utils/query";
import { formatPrice, formatPriceRange, formatNewArrivalsPrice } from "@/lib/utils/price";
import type { FilterOptions, ProductListItem } from "@/lib/actions/productActions";

interface ProductListingExperienceProps {
  initialProducts: ProductListItem[];
  totalCount: number;
  hierarchicalCategories: Array<{
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    imageUrl: string | null;
    isFeatured: boolean;
    children: Array<{
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      imageUrl: string | null;
      isFeatured: boolean;
      children: any[];
    }>;
  }>;
  availableAttributes: Array<{
    name: string;
    displayName: string;
    values: Array<{
      value: string;
      slug: string;
    }>;
  }>;
  availableBrands: Array<{
    name: string;
    slug: string;
  }>;
  initialSearchParams: Record<string, string | string[] | undefined>;
}

export default function ProductListingExperience({
  initialProducts,
  totalCount,
  hierarchicalCategories,
  availableAttributes,
  availableBrands,
  initialSearchParams,
}: ProductListingExperienceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
  const [currentTotalCount, setCurrentTotalCount] = useState<number>(totalCount);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get current parent category from hierarchical categories
  const currentParentCategory = hierarchicalCategories.find(cat => 
    cat.children.some(child => 
      searchParams.get("category") === child.slug
    )
  );
  
  // Price range state for the slider
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [minInput, setMinInput] = useState<string>("0");
  const [maxInput, setMaxInput] = useState<string>("50000");
  const PRICE_MIN = 0;
  const PRICE_MAX = 50000;

  // Parse current filters from URL
  const currentFilters = useMemo(() => {
    const sp = Object.fromEntries(searchParams.entries());
    return parseFilterParams(sp);
  }, [searchParams]);

  // Parse current price range from URL
  useEffect(() => {
    const priceParam = searchParams.get("price");
    if (priceParam) {
      const [minStr, maxStr] = priceParam.split("-");
      const min = minStr ? Math.max(PRICE_MIN, parseInt(minStr, 10)) : PRICE_MIN;
      const max = maxStr ? Math.min(PRICE_MAX, parseInt(maxStr, 10)) : PRICE_MAX;
      setPriceRange([min, max]);
      setMinInput(min.toString());
      setMaxInput(max.toString());
    } else {
      setPriceRange([PRICE_MIN, PRICE_MAX]);
      setMinInput(PRICE_MIN.toString());
      setMaxInput(PRICE_MAX.toString());
    }
  }, [searchParams]);

  // Client-side filtering effect - THE KEY TO INSTANT UPDATES
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setIsLoading(true);
      try {
        const sp = Object.fromEntries(searchParams.entries());
        const filters = parseFilterParams(sp);
        const result = await getFilteredProducts(filters);
        setProducts(result.products);
      } catch (error) {
        console.error("Error fetching filtered products:", error);
        // Keep existing products on error
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if search params have changed from initial
    const currentSearchString = searchParams.toString();
    const initialSearchString = new URLSearchParams(initialSearchParams as Record<string, string>).toString();
    
    if (currentSearchString !== initialSearchString) {
      fetchFilteredProducts();
    }
  }, [searchParams, initialSearchParams]);

  // Filter toggle handlers
  const handleFilterToggle = useCallback((key: string, value: string) => {
    const currentSearch = `?${searchParams.toString()}`;
    const newUrl = toggleArrayParam("/products", currentSearch, key, value);
    router.push(newUrl, { scroll: false });
  }, [router, searchParams]);

  // Price range handlers
  const updatePriceInURL = useCallback((min: number, max: number) => {
    const currentSearch = `?${searchParams.toString()}`;
    const priceParam = `${min}-${max}`;
    const newUrl = setParam("/products", currentSearch, "price", priceParam);
    router.push(newUrl, { scroll: false });
  }, [router, searchParams]);

  const handlePriceRangeChange = useCallback((newRange: number[]) => {
    const [min, max] = newRange as [number, number];
    setPriceRange([min, max]);
    setMinInput(min.toString());
    setMaxInput(max.toString());
  }, []);

  const handlePriceRangeCommit = useCallback((newRange: number[]) => {
    const [min, max] = newRange as [number, number];
    updatePriceInURL(min, max);
  }, [updatePriceInURL]);

  const handleMinInputChange = useCallback((value: string) => {
    setMinInput(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= PRICE_MIN && numValue <= PRICE_MAX && numValue <= priceRange[1]) {
      const newRange: [number, number] = [numValue, priceRange[1]];
      setPriceRange(newRange);
      updatePriceInURL(newRange[0], newRange[1]);
    }
  }, [priceRange, updatePriceInURL]);

  const handleMaxInputChange = useCallback((value: string) => {
    setMaxInput(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= PRICE_MIN && numValue <= PRICE_MAX && numValue >= priceRange[0]) {
      const newRange: [number, number] = [priceRange[0], numValue];
      setPriceRange(newRange);
      updatePriceInURL(newRange[0], newRange[1]);
    }
  }, [priceRange, updatePriceInURL]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const allKeys = ["gender", "brand", "category", "price", "page"];
    availableAttributes.forEach(attr => {
      allKeys.push(attr.name);
    });
    const currentSearch = `?${searchParams.toString()}`;
    const newUrl = removeParams("/products", currentSearch, allKeys);
    router.push(newUrl, { scroll: false });
  }, [router, searchParams, availableAttributes]);

  // Get active filter counts
  const activeCounts = useMemo(() => {
    const currentSearch = `?${searchParams.toString()}`;
    const counts: Record<string, number> = {
      gender: getArrayParam(currentSearch, "gender").length,
      brand: getArrayParam(currentSearch, "brand").length,
      category: getArrayParam(currentSearch, "category").length,
      price: searchParams.get("price") ? 1 : 0,
    };

    availableAttributes.forEach(attr => {
      counts[attr.name] = getArrayParam(currentSearch, attr.name).length;
    });

    return counts;
  }, [searchParams, availableAttributes]);

  // Get active badges for display
  const activeBadges = useMemo(() => {
    const badges: string[] = [];
    const currentSearch = `?${searchParams.toString()}`;
    
    getArrayParam(currentSearch, "gender").forEach(g => 
      badges.push(String(g)[0].toUpperCase() + String(g).slice(1))
    );
    getArrayParam(currentSearch, "brand").forEach(b => 
      badges.push(String(b)[0].toUpperCase() + String(b).slice(1))
    );
    getArrayParam(currentSearch, "category").forEach(c => 
      badges.push(String(c)[0].toUpperCase() + String(c).slice(1))
    );
    
    availableAttributes.forEach(attr => {
      getArrayParam(currentSearch, attr.name).forEach(v => 
        badges.push(`${attr.displayName}: ${String(v)[0].toUpperCase() + String(v).slice(1)}`)
      );
    });

    return badges;
  }, [searchParams, availableAttributes]);

  // Check if a filter option is active
  const isFilterActive = useCallback((key: string, value: string) => {
    const currentSearch = `?${searchParams.toString()}`;
    return getArrayParam(currentSearch, key).includes(value);
  }, [searchParams]);

  // Get context-aware attributes based on selected category
  const contextAwareAttributes = useMemo(() => {
    const currentSearch = `?${searchParams.toString()}`;
    const selectedCategories = getArrayParam(currentSearch, "category");
    
    // If no categories selected, show all attributes
    if (selectedCategories.length === 0) {
      return availableAttributes;
    }
    
    // Filter attributes based on category context
    return availableAttributes.filter(attr => {
      // For standard apparel categories, hide waist-related attributes
      const isStandardApparel = selectedCategories.some(cat => 
        ['tops', 'dresses', 'skirts', 'shorts', 'trousers'].includes(cat.toLowerCase())
      );
      
      if (isStandardApparel && attr.name.toLowerCase().includes('waist')) {
        return false;
      }
      
      return true;
    });
  }, [searchParams, availableAttributes]);

  // State for mobile/desktop filter drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get total active filter count
  const totalActiveFilters = useMemo(() => {
    return Object.values(activeCounts).reduce((sum, count) => sum + count, 0);
  }, [activeCounts]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex gap-8">
        {/* Persistent Left Sidebar - Desktop Only */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            </div>

            <div className="space-y-6">
              {/* Gender Filter - Note: Genders are now handled by the hierarchical system */}

              {/* Brand Filter */}
              {availableBrands.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
                    Brand
                    {activeCounts.brand > 0 && (
                      <span className="text-xs text-gray-500">({activeCounts.brand})</span>
                    )}
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                    {availableBrands.map((brand) => (
                      <div key={brand.slug} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand.slug}`}
                          checked={isFilterActive("brand", brand.slug)}
                          onCheckedChange={() => handleFilterToggle("brand", brand.slug)}
                        />
                        <Label htmlFor={`brand-${brand.slug}`} className="text-sm cursor-pointer">
                          {brand.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Context-Aware Attribute Filters */}
              {contextAwareAttributes.map((attribute) => {
                const activeCount = activeCounts[attribute.name] || 0;
                const isSizeAttribute = attribute.name.toLowerCase().includes('size') || attribute.name.toLowerCase().includes('waist');
                const useGridLayout = isSizeAttribute && attribute.values.length > 6;
                
                return (
                  <div key={attribute.name}>
                    <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
                      {attribute.displayName}
                      {activeCount > 0 && (
                        <span className="text-xs text-gray-500">({activeCount})</span>
                      )}
                    </h4>
                    
                    {useGridLayout ? (
                      <div className="grid grid-cols-4 gap-2">
                        {attribute.values.map((value: { value: string; slug: string }) => (
                          <div key={`${attribute.name}-${value.slug}`} className="flex items-center space-x-1">
                            <Checkbox
                              id={`${attribute.name}-${value.slug}`}
                              checked={isFilterActive(attribute.name, value.slug)}
                              onCheckedChange={() => handleFilterToggle(attribute.name, value.slug)}
                            />
                            <Label htmlFor={`${attribute.name}-${value.slug}`} className="text-xs cursor-pointer">
                              {value.value}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                        {attribute.values.map((value: { value: string; slug: string }) => (
                          <div key={`${attribute.name}-${value.slug}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${attribute.name}-${value.slug}`}
                              checked={isFilterActive(attribute.name, value.slug)}
                              onCheckedChange={() => handleFilterToggle(attribute.name, value.slug)}
                            />
                            <Label htmlFor={`${attribute.name}-${value.slug}`} className="text-sm cursor-pointer">
                              {value.value}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Price Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
                  Price
                  {activeCounts.price > 0 && (
                    <span className="text-xs text-gray-500">({activeCounts.price})</span>
                  )}
                </h4>
                <div className="space-y-4">
                  <div className="text-center text-sm font-medium">
                    {formatPriceRange(priceRange[0], priceRange[1])}
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                    onValueCommit={handlePriceRangeCommit}
                    min={0}
                    max={50000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatPrice(0)}</span>
                    <span>{formatPrice(50000)}</span>
                  </div>
                  
                  {/* Manual price input fields */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={minInput}
                        onChange={(e) => handleMinInputChange(e.target.value)}
                        min={0}
                        max={50000}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                        placeholder="Min"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={maxInput}
                        onChange={(e) => handleMaxInputChange(e.target.value)}
                        min={0}
                        max={50000}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Active Filter Badges - Mobile Optimized */}
          {activeBadges.length > 0 && (
            <div className="mb-4 lg:mb-6">
              {/* Mobile: Collapsible filter section */}
              <div className="lg:hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    {activeBadges.length} filter{activeBadges.length > 1 ? 's' : ''} applied
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="max-h-20 overflow-y-auto scrollbar-hide">
                  <div className="flex flex-wrap gap-1">
                    {activeBadges.slice(0, 6).map((badge, i) => (
                      <Badge key={`${badge}-${i}`} variant="secondary" className="text-xs px-2 py-1">
                        {badge.length > 12 ? `${badge.substring(0, 12)}...` : badge}
                        <button
                          onClick={() => {
                            const parts = badge.split(": ");
                            if (parts.length === 2) {
                              const [key, value] = parts;
                              const filterKey = key.toLowerCase().replace(/\s+/g, "");
                              handleFilterToggle(filterKey, value.toLowerCase().replace(/\s+/g, "-"));
                            }
                          }}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </Badge>
                    ))}
                    {activeBadges.length > 6 && (
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        +{activeBadges.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Desktop: Full filter display */}
              <div className="hidden lg:flex flex-wrap gap-2">
                {activeBadges.map((badge, i) => (
                  <Badge key={`${badge}-${i}`} variant="secondary" className="text-sm">
                    {badge}
                    <button
                      onClick={() => {
                        const parts = badge.split(": ");
                        if (parts.length === 2) {
                          const [key, value] = parts;
                          const filterKey = key.toLowerCase().replace(/\s+/g, "");
                          handleFilterToggle(filterKey, value.toLowerCase().replace(/\s+/g, "-"));
                        }
                      }}
                      className="ml-2 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}

          {/* Horizontal Sub-Category Bar - Mobile Optimized */}
          <div className="mb-6 lg:mb-8 border-b border-gray-200 pb-4 lg:pb-6">
            <div className="flex flex-col gap-3 lg:gap-4">
              {/* Mobile: Horizontal scroll */}
              <div className="lg:hidden overflow-x-auto scrollbar-hide">
                <div className="flex gap-6 min-w-max pb-2">
                  {currentParentCategory?.children.map((category) => (
                    <button
                      key={category.slug}
                      onClick={() => handleFilterToggle("category", category.slug)}
                      className={`whitespace-nowrap text-sm font-medium transition-colors hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 pb-1 ${
                        isFilterActive("category", category.slug) ? "text-black font-semibold border-black" : "text-gray-700"
                      }`}
                    >
                      {category.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Desktop: Two rows */}
              <div className="hidden lg:flex flex-col gap-4">
                {/* Primary Categories Row */}
                <div className="flex flex-wrap gap-8 text-sm font-medium text-gray-900">
                    {currentParentCategory?.children.slice(0, 9).map((category) => (
                    <button
                      key={category.slug}
                      onClick={() => handleFilterToggle("category", category.slug)}
                      className={`transition-colors hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 pb-1 ${
                        isFilterActive("category", category.slug) ? "text-black font-semibold border-black" : ""
                      }`}
                    >
                      {category.name.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                {/* Secondary Categories Row */}
                {currentParentCategory && currentParentCategory.children.length > 9 && (
                  <div className="flex flex-wrap gap-8 text-sm font-medium text-gray-700">
                    {currentParentCategory.children.slice(9).map((category) => (
                      <button
                        key={category.slug}
                        onClick={() => handleFilterToggle("category", category.slug)}
                        className={`transition-colors hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 pb-1 ${
                          isFilterActive("category", category.slug) ? "text-black font-semibold border-black" : ""
                        }`}
                      >
                        {category.name.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="mb-8 block lg:hidden">
            <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 w-full">
                  <Filter className="h-4 w-4" />
                  Filters
                  {totalActiveFilters > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      {totalActiveFilters}
                    </Badge>
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[80vh]">
                <DrawerHeader>
                  <DrawerTitle>Filters</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-4 overflow-y-auto">
                  <FilterContent
                    availableBrands={availableBrands}
                    activeCounts={activeCounts}
                    contextAwareAttributes={contextAwareAttributes}
                    priceRange={priceRange}
                    minInput={minInput}
                    maxInput={maxInput}
                    isFilterActive={isFilterActive}
                    handleFilterToggle={handleFilterToggle}
                    handlePriceRangeChange={handlePriceRangeChange}
                    handlePriceRangeCommit={handlePriceRangeCommit}
                    handleMinInputChange={handleMinInputChange}
                    handleMaxInputChange={handleMaxInputChange}
                    clearAllFilters={clearAllFilters}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </div>

      {/* Product Grid */}
      <div>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-700">No products match your filters.</p>
            <Button variant="outline" onClick={clearAllFilters} className="mt-4">
              Clear all filters
            </Button>
          </div>
        ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              // Use exact same logic as NewArrivals section
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
        )}
      </div>
    </main>
      </div>
    </div>
  );
}

// Reusable FilterContent component for mobile drawer
interface FilterContentProps {
  availableBrands: Array<{
    name: string;
    slug: string;
  }>;
  activeCounts: Record<string, number>;
  contextAwareAttributes: Array<{
    name: string;
    displayName: string;
    values: Array<{ value: string; slug: string }>;
  }>;
  priceRange: [number, number];
  minInput: string;
  maxInput: string;
  isFilterActive: (key: string, value: string) => boolean;
  handleFilterToggle: (key: string, value: string) => void;
  handlePriceRangeChange: (newRange: number[]) => void;
  handlePriceRangeCommit: (newRange: number[]) => void;
  handleMinInputChange: (value: string) => void;
  handleMaxInputChange: (value: string) => void;
  clearAllFilters: () => void;
}

function FilterContent({
  availableBrands,
  activeCounts,
  contextAwareAttributes,
  priceRange,
  minInput,
  maxInput,
  isFilterActive,
  handleFilterToggle,
  handlePriceRangeChange,
  handlePriceRangeCommit,
  handleMinInputChange,
  handleMaxInputChange,
  clearAllFilters,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Gender Filter - Note: Genders are now handled by the hierarchical system */}

      {/* Brand Filter */}
      {availableBrands.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
            Brand
            {activeCounts.brand > 0 && (
              <span className="text-xs text-gray-500">({activeCounts.brand})</span>
            )}
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
            {availableBrands.map((brand: { name: string; slug: string }) => (
              <div key={brand.slug} className="flex items-center space-x-2">
                <Checkbox
                  id={`mobile-brand-${brand.slug}`}
                  checked={isFilterActive("brand", brand.slug)}
                  onCheckedChange={() => handleFilterToggle("brand", brand.slug)}
                />
                <Label htmlFor={`mobile-brand-${brand.slug}`} className="text-sm cursor-pointer">
                  {brand.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context-Aware Attribute Filters */}
      {contextAwareAttributes.map((attribute) => {
        const activeCount = activeCounts[attribute.name] || 0;
        const isSizeAttribute = attribute.name.toLowerCase().includes('size') || attribute.name.toLowerCase().includes('waist');
        const useGridLayout = isSizeAttribute && attribute.values.length > 6;
        
        return (
          <div key={attribute.name}>
            <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
              {attribute.displayName}
              {activeCount > 0 && (
                <span className="text-xs text-gray-500">({activeCount})</span>
              )}
            </h4>
            
            {useGridLayout ? (
              <div className="grid grid-cols-4 gap-2">
                {attribute.values.map((value: { value: string; slug: string }) => (
                  <div key={`${attribute.name}-${value.slug}`} className="flex items-center space-x-1">
                    <Checkbox
                      id={`mobile-${attribute.name}-${value.slug}`}
                      checked={isFilterActive(attribute.name, value.slug)}
                      onCheckedChange={() => handleFilterToggle(attribute.name, value.slug)}
                    />
                    <Label htmlFor={`mobile-${attribute.name}-${value.slug}`} className="text-xs cursor-pointer">
                      {value.value}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {attribute.values.map((value: { value: string; slug: string }) => (
                  <div key={`${attribute.name}-${value.slug}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mobile-${attribute.name}-${value.slug}`}
                      checked={isFilterActive(attribute.name, value.slug)}
                      onCheckedChange={() => handleFilterToggle(attribute.name, value.slug)}
                    />
                    <Label htmlFor={`mobile-${attribute.name}-${value.slug}`} className="text-sm cursor-pointer">
                      {value.value}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Price Filter */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
          Price
          {activeCounts.price > 0 && (
            <span className="text-xs text-gray-500">({activeCounts.price})</span>
          )}
        </h4>
        <div className="space-y-4">
          <div className="text-center text-sm font-medium">
            {formatPriceRange(priceRange[0], priceRange[1])}
          </div>
          <Slider
            value={priceRange}
            onValueChange={handlePriceRangeChange}
            onValueCommit={handlePriceRangeCommit}
            min={0}
            max={50000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatPrice(0)}</span>
            <span>{formatPrice(50000)}</span>
          </div>
          
          {/* Manual price input fields */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={minInput}
                onChange={(e) => handleMinInputChange(e.target.value)}
                min={0}
                max={50000}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Min"
              />
            </div>
            <div className="flex-1">
              <input
                type="number"
                value={maxInput}
                onChange={(e) => handleMaxInputChange(e.target.value)}
                min={0}
                max={50000}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Max"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
