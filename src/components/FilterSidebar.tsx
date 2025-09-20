"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Filter } from "lucide-react";
import type { AttributeFilterOption, FilterOption } from "@/lib/actions/productActions";

interface FilterSidebarProps {
  availableBrands: FilterOption[];
  availableAttributes: AttributeFilterOption[];
  isMobile?: boolean;
}

export function FilterSidebar({ 
  availableBrands, 
  availableAttributes, 
  isMobile = false 
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);



  // Helper functions
  const buildFilterLink = (key: string, value: string, remove = false) => {
    const current = new URLSearchParams(searchParamsObj.toString());
    
    if (remove) {
      const values = current.getAll(key);
      current.delete(key);
      values.forEach(v => {
        if (v !== value) current.append(key, v);
      });
    } else {
      // Toggle - if already selected, remove it; otherwise add it
      const values = current.getAll(key);
      if (values.includes(value)) {
        current.delete(key);
        values.forEach(v => {
          if (v !== value) current.append(key, v);
        });
      } else {
        current.append(key, value);
      }
    }
    
    return `/products?${current.toString()}`;
  };


  const isFilterActive = (key: string, value: string) => {
    return searchParamsObj.getAll(key).includes(value);
  };

  const clearAllFilters = () => {
    const keys = ['gender', 'brand', 'category', 'price'];
    availableAttributes.forEach(attr => keys.push(attr.name));
    
    const current = new URLSearchParams(searchParamsObj.toString());
    keys.forEach(key => current.delete(key));
    
    router.push(`/products?${current.toString()}`);
  };

  const getActiveCount = (key: string) => {
    return searchParamsObj.getAll(key).length;
  };


  const totalActiveFilters = Object.values({
    gender: getActiveCount('gender'),
    brand: getActiveCount('brand'),
    category: getActiveCount('category'),
    price: searchParamsObj.get('price') ? 1 : 0,
    ...availableAttributes.reduce((acc, attr) => {
      acc[attr.name] = getActiveCount(attr.name);
      return acc;
    }, {} as Record<string, number>)
  }).reduce((sum, count) => sum + count, 0);


  const FilterContent = () => (
    <div className="space-y-6">
      {/* Brand Filter */}
      {availableBrands.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
            Brand
            {getActiveCount('brand') > 0 && (
              <span className="text-xs text-gray-500">({getActiveCount('brand')})</span>
            )}
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
            {availableBrands.map((brand) => (
              <div key={brand.slug} className="flex items-center space-x-2">
                <Checkbox
                  id={`${isMobile ? 'mobile-' : ''}brand-${brand.slug}`}
                  checked={isFilterActive("brand", brand.slug)}
                  onCheckedChange={() => router.push(buildFilterLink("brand", brand.slug))}
                />
                <Label 
                  htmlFor={`${isMobile ? 'mobile-' : ''}brand-${brand.slug}`} 
                  className="text-sm cursor-pointer"
                >
                  {brand.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attribute Filters */}
      {availableAttributes.map((attribute) => {
        const activeCount = getActiveCount(attribute.name);
        const isSizeAttribute = attribute.name.toLowerCase().includes('size') || 
                               attribute.name.toLowerCase().includes('waist');
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
                {attribute.values.map((value) => (
                  <div key={`${attribute.name}-${value.slug}`} className="flex items-center space-x-1">
                    <Checkbox
                      id={`${isMobile ? 'mobile-' : ''}${attribute.name}-${value.slug}`}
                      checked={isFilterActive(attribute.name, value.value)}
                      onCheckedChange={() => router.push(buildFilterLink(attribute.name, value.value))}
                    />
                    <Label 
                      htmlFor={`${isMobile ? 'mobile-' : ''}${attribute.name}-${value.slug}`} 
                      className="text-xs cursor-pointer"
                    >
                      {value.value}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {attribute.values.map((value) => (
                  <div key={`${attribute.name}-${value.slug}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${isMobile ? 'mobile-' : ''}${attribute.name}-${value.slug}`}
                      checked={isFilterActive(attribute.name, value.value)}
                      onCheckedChange={() => router.push(buildFilterLink(attribute.name, value.value))}
                    />
                    <Label 
                      htmlFor={`${isMobile ? 'mobile-' : ''}${attribute.name}-${value.slug}`} 
                      className="text-sm cursor-pointer"
                    >
                      {value.value}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );

  // Mobile version with drawer
  if (isMobile) {
    return (
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
            <FilterContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop version
  return (
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

      <FilterContent />
    </div>
  );
}
