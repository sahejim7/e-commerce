"use client";

import { useState, useEffect } from "react";
import { getAttributes } from "@/lib/actions/admin/attributeActions";
import { getAttributesForAttributeSet, updateAttributesForSet } from "@/lib/actions/admin/attributeSetActions";
import type { AttributeWithValues } from "@/lib/actions/admin/attributeActions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface AttributeSet {
  id: string;
  name: string;
}

interface ManageAttributeSetAttributesDialogProps {
  attributeSet: AttributeSet | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageAttributeSetAttributesDialog({
  attributeSet,
  isOpen,
  onClose,
}: ManageAttributeSetAttributesDialogProps) {
  const [allAttributes, setAllAttributes] = useState<AttributeWithValues[]>([]);
  const [linkedAttributeIds, setLinkedAttributeIds] = useState<string[]>([]);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen && attributeSet) {
      loadData();
    }
  }, [isOpen, attributeSet]);

  const loadData = async () => {
    if (!attributeSet) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Load all attributes and linked attributes in parallel
      const [attributesData, linkedAttributeIdsData] = await Promise.all([
        getAttributes(),
        getAttributesForAttributeSet(attributeSet.id),
      ]);

      setAllAttributes(attributesData);
      setLinkedAttributeIds(linkedAttributeIdsData);
      setSelectedAttributeIds(linkedAttributeIdsData);
    } catch (error) {
      setError("Failed to load attributes data");
      console.error("Error loading attributes data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttributeToggle = (attributeId: string, checked: boolean) => {
    if (checked) {
      setSelectedAttributeIds(prev => [...prev, attributeId]);
    } else {
      setSelectedAttributeIds(prev => prev.filter(id => id !== attributeId));
    }
  };

  const handleSave = async () => {
    if (!attributeSet) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateAttributesForSet(attributeSet.id, selectedAttributeIds);

      if (result.success) {
        setSuccess("Attributes updated successfully");
        setLinkedAttributeIds(selectedAttributeIds);
        // Close dialog after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError(result.error || "Failed to update attributes");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Error updating attributes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setSelectedAttributeIds(linkedAttributeIds); // Reset to original state
    onClose();
  };

  if (!attributeSet) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Attributes for "{attributeSet.name}"</DialogTitle>
          <DialogDescription>
            Select which attributes should be available for products using this attribute set.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading attributes...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          ) : (
            <div className="space-y-4">
              {allAttributes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No attributes found. Create some attributes first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allAttributes.map((attribute) => (
                    <div
                      key={attribute.id}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={attribute.id}
                        checked={selectedAttributeIds.includes(attribute.id)}
                        onCheckedChange={(checked) =>
                          handleAttributeToggle(attribute.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={attribute.id}
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {attribute.displayName}
                        </label>
                        <p className="text-xs text-gray-500">
                          {attribute.name} • {attribute.values.length} values
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
