"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  parentSlug: string;
  parentName: string;
}

interface HorizontalCategoryBarProps {
  subcategories: Subcategory[];
}

export function HorizontalCategoryBar({ 
  subcategories
}: HorizontalCategoryBarProps) {
  const searchParamsObj = useSearchParams();

  // Helper function to build category link
  const buildCategoryLink = (categorySlug: string) => {
    const current = new URLSearchParams(searchParamsObj.toString());
    
    // Toggle category - if already selected, remove it; otherwise add it
    const currentCategories = current.getAll('category');
    if (currentCategories.includes(categorySlug)) {
      current.delete('category', categorySlug);
    } else {
      current.append('category', categorySlug);
    }
    
    return `/products?${current.toString()}`;
  };

  // Helper function to check if category is active
  const isCategoryActive = (categorySlug: string) => {
    const currentCategories = searchParamsObj.getAll('category');
    return currentCategories.includes(categorySlug);
  };

  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 lg:mb-8 border-b border-gray-200 pb-4 lg:pb-6">
      <div className="flex flex-col gap-3 lg:gap-4">
        {/* Mobile: Horizontal scroll */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max pb-2">
            {subcategories.map((category) => (
              <Link key={category.slug} href={buildCategoryLink(category.slug)}>
                <Button
                  variant={isCategoryActive(category.slug) ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {category.name.toUpperCase()}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Desktop: Grid layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-6 gap-4">
            {subcategories.map((category) => (
              <Link key={category.slug} href={buildCategoryLink(category.slug)}>
                <Button
                  variant={isCategoryActive(category.slug) ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-center"
                >
                  {category.name.toUpperCase()}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
