"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { AttributeFilterOption } from "@/lib/actions/productActions";

interface ActiveFiltersProps {
  availableAttributes: AttributeFilterOption[];
}

export function ActiveFilters({ availableAttributes }: ActiveFiltersProps) {
  const router = useRouter();
  const searchParamsObj = useSearchParams();

  const clearAllFilters = () => {
    const keys = ['gender', 'brand', 'category', 'price'];
    availableAttributes.forEach(attr => keys.push(attr.name));
    
    const current = new URLSearchParams(searchParamsObj.toString());
    keys.forEach(key => current.delete(key));
    
    router.push(`/products?${current.toString()}`);
  };

  const removeFilter = (key: string, value: string) => {
    const current = new URLSearchParams(searchParamsObj.toString());
    const values = current.getAll(key);
    current.delete(key);
    values.forEach(v => {
      if (v !== value) current.append(key, v);
    });
    
    router.push(`/products?${current.toString()}`);
  };

  const getActiveBadges = () => {
    const badges: Array<{ key: string; value: string; display: string }> = [];
    
    searchParamsObj.getAll('gender').forEach(g => 
      badges.push({ 
        key: 'gender', 
        value: g, 
        display: String(g)[0].toUpperCase() + String(g).slice(1) 
      })
    );
    searchParamsObj.getAll('brand').forEach(b => 
      badges.push({ 
        key: 'brand', 
        value: b, 
        display: String(b)[0].toUpperCase() + String(b).slice(1) 
      })
    );
    searchParamsObj.getAll('category').forEach(c => 
      badges.push({ 
        key: 'category', 
        value: c, 
        display: String(c)[0].toUpperCase() + String(c).slice(1) 
      })
    );
    
    availableAttributes.forEach(attr => {
      searchParamsObj.getAll(attr.name).forEach(v => 
        badges.push({ 
          key: attr.name, 
          value: v, 
          display: `${attr.displayName}: ${String(v)[0].toUpperCase() + String(v).slice(1)}` 
        })
      );
    });

    return badges;
  };

  const activeBadges = getActiveBadges();

  if (activeBadges.length === 0) {
    return null;
  }

  return (
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
              <Badge key={`${badge.key}-${badge.value}-${i}`} variant="secondary" className="text-xs px-2 py-1">
                {badge.display.length > 12 ? `${badge.display.substring(0, 12)}...` : badge.display}
                <button
                  onClick={() => removeFilter(badge.key, badge.value)}
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
          <Badge key={`${badge.key}-${badge.value}-${i}`} variant="secondary" className="text-sm">
            {badge.display}
            <button
              onClick={() => removeFilter(badge.key, badge.value)}
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
  );
}
