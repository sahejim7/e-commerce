"use client";

import { useState } from "react";
import { bulkDeleteProducts } from "@/lib/actions/admin/productActions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
// Using native confirm dialog for simplicity

interface BulkProductActionsProps {
  selectedProductIds: string[];
  onSelectionChange: (productIds: string[]) => void;
  onBulkActionComplete: () => void;
  totalProducts: number;
}

export default function BulkProductActions({
  selectedProductIds,
  onSelectionChange,
  onBulkActionComplete,
  totalProducts,
}: BulkProductActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selectedProductIds.length;
  const isAllSelected = selectedCount === totalProducts && totalProducts > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalProducts;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // We need to get all product IDs from the current page
      // This will be handled by the parent component
      onSelectionChange([]); // Clear selection, parent will handle select all
    } else {
      onSelectionChange([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} product${selectedProductIds.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await bulkDeleteProducts(selectedProductIds);

      if (result.success) {
        onSelectionChange([]);
        onBulkActionComplete();
      } else {
        setError(result.error || "Failed to delete products");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Error bulk deleting products:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (totalProducts === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium text-gray-900">
              {isAllSelected ? "Deselect All" : "Select All"}
            </label>
          </div>
          
          {selectedCount > 0 && (
            <div className="text-sm text-gray-600">
              {selectedCount} of {totalProducts} selected
            </div>
          )}
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : `Delete Selected (${selectedCount})`}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}
    </>
  );
}
