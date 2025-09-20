"use client";

import { useState, useEffect } from "react";
import { uploadImages } from "@/lib/actions/uploadActions";
import ImageUpload from "./ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Variant {
  id?: string;
  sku: string;
  price: string;
  salePrice: string;
  attributeValueIds: string[];
  inStock: number;
  imageUrl?: string;
}

interface AttributeValue {
  attributeId: string;
  attributeName: string;
  attributeDisplayName: string;
  attributeValueId: string;
  attributeValue: string;
  attributeValueSortOrder: number;
}

interface EditVariantManagerProps {
  variants: Variant[];
  attributeValues: AttributeValue[];
  onVariantUpdate: (index: number, variant: Variant) => void;
  onVariantAdd: (variant: Variant) => void;
  onVariantRemove: (index: number) => void;
  productImages: string[];
}

export default function EditVariantManager({
  variants,
  attributeValues,
  onVariantUpdate,
  onVariantAdd,
  onVariantRemove,
  productImages
}: EditVariantManagerProps) {
  const [editingVariant, setEditingVariant] = useState<number | null>(null);
  const [uploadingVariant, setUploadingVariant] = useState<number | null>(null);
  const [newVariant, setNewVariant] = useState<Partial<Variant> & { attributeValueIds: string[] }>({
    sku: "",
    price: "",
    salePrice: "",
    attributeValueIds: [],
    inStock: 0,
  });

  // Group attribute values by attribute
  const getAttributeValuesByAttribute = () => {
    const grouped: Record<string, AttributeValue[]> = {};
    attributeValues.forEach(av => {
      if (!grouped[av.attributeId]) {
        grouped[av.attributeId] = [];
      }
      grouped[av.attributeId].push(av);
    });
    return grouped;
  };

  // Get unique attributes
  const getUniqueAttributes = () => {
    const seen = new Set<string>();
    return attributeValues.filter(av => {
      if (seen.has(av.attributeId)) {
        return false;
      }
      seen.add(av.attributeId);
      return true;
    });
  };

  // Get attribute value display name
  const getAttributeValueDisplayName = (attributeValueId: string) => {
    const av = attributeValues.find(a => a.attributeValueId === attributeValueId);
    return av ? `${av.attributeDisplayName}: ${av.attributeValue}` : attributeValueId;
  };

  // Get variant display name
  const getVariantDisplayName = (variant: Variant) => {
    if (variant.attributeValueIds.length === 0) {
      return variant.sku || "No attributes";
    }
    
    const attributeNames = variant.attributeValueIds.map(id => getAttributeValueDisplayName(id));
    return `${variant.sku} (${attributeNames.join(", ")})`;
  };

  // Handle variant image upload
  const handleVariantImageUpload = async (index: number, files: FileList) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingVariant(index);
    try {
      // Create FormData with the selected file
      const formData = new FormData();
      formData.append('images', file);

      // Upload image to Cloudinary
      const result = await uploadImages(formData);
      
      if (result.success && result.urls && result.urls.length > 0) {
        const imageUrl = result.urls[0];
        const updatedVariant = { ...variants[index], imageUrl };
        onVariantUpdate(index, updatedVariant);
        toast.success("Image uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingVariant(null);
    }
  };

  // Handle variant image remove
  const handleVariantImageRemove = (index: number) => {
    const updatedVariant = { ...variants[index], imageUrl: undefined };
    onVariantUpdate(index, updatedVariant);
  };

  // Handle attribute value selection
  const handleAttributeValueToggle = (variantIndex: number, attributeId: string, attributeValueId: string) => {
    const variant = variants[variantIndex];
    const currentAttributeValueIds = variant.attributeValueIds.filter(id => {
      // Remove any existing value for this attribute
      const existingValue = attributeValues.find(av => av.attributeValueId === id && av.attributeId === attributeId);
      return !existingValue;
    });
    
    // Check if this value is already selected
    const isSelected = variant.attributeValueIds.includes(attributeValueId);
    
    let newAttributeValueIds;
    if (isSelected) {
      newAttributeValueIds = currentAttributeValueIds;
    } else {
      newAttributeValueIds = [...currentAttributeValueIds, attributeValueId];
    }
    
    const updatedVariant = { ...variant, attributeValueIds: newAttributeValueIds };
    onVariantUpdate(variantIndex, updatedVariant);
  };

  // Handle variant field update
  const handleVariantFieldUpdate = (index: number, field: keyof Variant, value: string | number) => {
    const updatedVariant = { ...variants[index], [field]: value };
    onVariantUpdate(index, updatedVariant);
  };

  // Add new variant
  const handleAddVariant = () => {
    if (!newVariant.sku || !newVariant.price || newVariant.attributeValueIds.length === 0) {
      toast.error("Please fill in all required fields for the new variant");
      return;
    }

    const variantToAdd: Variant = {
      sku: newVariant.sku,
      price: newVariant.price,
      salePrice: newVariant.salePrice || "",
      attributeValueIds: newVariant.attributeValueIds,
      inStock: newVariant.inStock || 0,
      imageUrl: newVariant.imageUrl,
    };

    onVariantAdd(variantToAdd);
    
    // Reset new variant form
    setNewVariant({
      sku: "",
      price: "",
      salePrice: "",
      attributeValueIds: [],
      inStock: 0,
    });
    
    toast.success("New variant added successfully");
  };

  // Handle new variant attribute value toggle
  const handleNewVariantAttributeValueToggle = (attributeId: string, attributeValueId: string) => {
    const currentIds = newVariant.attributeValueIds;
    const currentAttributeValueIds = currentIds.filter(id => {
      const existingValue = attributeValues.find(av => av.attributeValueId === id && av.attributeId === attributeId);
      return !existingValue;
    });
    
    const isSelected = currentIds.includes(attributeValueId);
    
    let newAttributeValueIds: string[];
    if (isSelected) {
      newAttributeValueIds = currentAttributeValueIds;
    } else {
      newAttributeValueIds = [...currentAttributeValueIds, attributeValueId];
    }
    
    setNewVariant(prev => ({ ...prev, attributeValueIds: newAttributeValueIds }));
  };

  const groupedAttributes = getAttributeValuesByAttribute();
  const uniqueAttributes = getUniqueAttributes();

  return (
    <div className="space-y-6">
      {/* Existing Variants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Existing Variants</h3>
          <span className="text-sm text-gray-500">{variants.length} variant(s)</span>
        </div>
        
        {variants.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {variants.map((variant, index) => (
              <Card key={variant.id || index} className="border-2 border-foreground/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {getVariantDisplayName(variant)}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {variant.inStock} in stock
                      </Badge>
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onVariantRemove(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Variant Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`sku-${index}`} className="text-xs">SKU</Label>
                      <Input
                        id={`sku-${index}`}
                        value={variant.sku}
                        onChange={(e) => handleVariantFieldUpdate(index, 'sku', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`price-${index}`} className="text-xs">Price</Label>
                      <Input
                        id={`price-${index}`}
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => handleVariantFieldUpdate(index, 'price', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`salePrice-${index}`} className="text-xs">Sale Price</Label>
                      <Input
                        id={`salePrice-${index}`}
                        type="number"
                        step="0.01"
                        value={variant.salePrice || ""}
                        onChange={(e) => handleVariantFieldUpdate(index, 'salePrice', e.target.value)}
                        className="text-sm"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`stock-${index}`} className="text-xs">Stock</Label>
                      <Input
                        id={`stock-${index}`}
                        type="number"
                        value={variant.inStock}
                        onChange={(e) => handleVariantFieldUpdate(index, 'inStock', Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Attribute Values */}
                  <div>
                    <Label className="text-xs mb-2 block">Attributes</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {uniqueAttributes.map(attribute => (
                        <div key={attribute.attributeId} className="space-y-1">
                          <div className="text-xs font-medium text-gray-600">
                            {attribute.attributeDisplayName}:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {groupedAttributes[attribute.attributeId]?.map(av => (
                              <button
                                key={av.attributeValueId}
                                type="button"
                                onClick={() => handleAttributeValueToggle(index, attribute.attributeId, av.attributeValueId)}
                                className={`px-2 py-1 text-xs rounded border ${
                                  variant.attributeValueIds.includes(av.attributeValueId)
                                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {av.attributeValue}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Variant Image */}
                  <div>
                    <Label className="text-xs mb-2 block">Variant Image</Label>
                    <ImageUpload
                      title=""
                      description=""
                      maxImages={1}
                      images={variant.imageUrl ? [variant.imageUrl] : []}
                      onImageUpload={(files) => handleVariantImageUpload(index, files)}
                      onImageRemove={() => handleVariantImageRemove(index)}
                      variantImages={true}
                      isLoading={uploadingVariant === index}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No variants found for this product.</p>
          </div>
        )}
      </div>

      {/* Add New Variant */}
      <Card className="border-2 border-dashed border-foreground/30">
        <CardHeader>
          <CardTitle className="text-base">Add New Variant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Variant Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="new-sku" className="text-xs">SKU *</Label>
              <Input
                id="new-sku"
                value={newVariant.sku || ""}
                onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g., TSH-S-RED"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="new-price" className="text-xs">Price *</Label>
              <Input
                id="new-price"
                type="number"
                step="0.01"
                value={newVariant.price || ""}
                onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="new-salePrice" className="text-xs">Sale Price</Label>
              <Input
                id="new-salePrice"
                type="number"
                step="0.01"
                value={newVariant.salePrice || ""}
                onChange={(e) => setNewVariant(prev => ({ ...prev, salePrice: e.target.value }))}
                placeholder="Optional"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="new-stock" className="text-xs">Stock</Label>
              <Input
                id="new-stock"
                type="number"
                value={newVariant.inStock || 0}
                onChange={(e) => setNewVariant(prev => ({ ...prev, inStock: Number(e.target.value) }))}
                className="text-sm"
              />
            </div>
          </div>

          {/* Attribute Selection */}
          <div>
            <Label className="text-xs mb-2 block">Select Attributes *</Label>
            <div className="space-y-3">
              {uniqueAttributes.map(attribute => (
                <div key={attribute.attributeId} className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">
                    {attribute.attributeDisplayName}:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {groupedAttributes[attribute.attributeId]?.map(av => (
                      <button
                        key={av.attributeValueId}
                        type="button"
                        onClick={() => handleNewVariantAttributeValueToggle(attribute.attributeId, av.attributeValueId)}
                        className={`px-2 py-1 text-xs rounded border ${
                          newVariant.attributeValueIds?.includes(av.attributeValueId)
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {av.attributeValue}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Variant Image */}
          <div>
            <Label className="text-xs mb-2 block">Variant Image (Optional)</Label>
            <ImageUpload
              title=""
              description=""
              maxImages={1}
              images={newVariant.imageUrl ? [newVariant.imageUrl] : []}
              onImageUpload={async (files) => {
                if (!files || files.length === 0) return;
                const file = files[0];
                if (!file.type.startsWith('image/')) {
                  toast.error('Please select an image file');
                  return;
                }
                try {
                  // Create FormData with the selected file
                  const formData = new FormData();
                  formData.append('images', file);

                  // Upload image to Cloudinary
                  const result = await uploadImages(formData);
                  
                  if (result.success && result.urls && result.urls.length > 0) {
                    const imageUrl = result.urls[0];
                    setNewVariant(prev => ({ ...prev, imageUrl }));
                    toast.success("Image uploaded successfully");
                  } else {
                    toast.error(result.error || "Failed to upload image");
                  }
                } catch (error) {
                  toast.error("Error uploading image");
                }
              }}
              onImageRemove={() => setNewVariant(prev => ({ ...prev, imageUrl: undefined }))}
              variantImages={true}
            />
          </div>

          {/* Add Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAddVariant}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add New Variant
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
