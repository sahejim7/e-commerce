"use client";

import { useState } from "react";
import { uploadImages } from "@/lib/actions/uploadActions";
import ImageUpload from "./ImageUpload";

interface Variant {
  id?: string;
  sku: string;
  price: string;
  salePrice: string;
  attributeValueIds: string[];
  inStock: number;
  imageUrl?: string;
}

interface VariantImageManagerProps {
  variants: Variant[];
  onVariantUpdate: (index: number, variant: Variant) => void;
}

export default function VariantImageManager({
  variants,
  onVariantUpdate
}: VariantImageManagerProps) {
  const [uploadingVariant, setUploadingVariant] = useState<number | null>(null);

  const handleVariantImageUpload = async (index: number, files: FileList) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
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
      } else {
        alert(result.error || "Failed to upload image. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setUploadingVariant(null);
    }
  };

  const handleVariantImageRemove = (index: number) => {
    console.log("Removing image for variant", index);
    const updatedVariant = { ...variants[index], imageUrl: undefined };
    onVariantUpdate(index, updatedVariant);
  };

  const getVariantDisplayName = (variant: Variant) => {
    // For now, just show the SKU. In a real implementation, you'd want to 
    // resolve the attribute value names from the attributeValueIds
    return variant.sku;
  };

  return (
    <div className="retro-card">
      <div className="px-6 py-4 border-b-2 border-foreground/20">
        <h3 className="text-lg font-medium text-foreground">Variant Images</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload images for each variant. Each variant can have its own image.
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variants.map((variant, index) => (
            <div key={index} className="retro-card border-2 border-foreground/20 p-4">
              <div className="mb-3">
                <h4 className="font-medium text-foreground text-sm">
                  {getVariantDisplayName(variant)}
                </h4>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">Variant Image</div>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
