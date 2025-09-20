"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { 
  AdminProduct, 
  getGenders, 
  getAttributeValuesForProductType,
  getAllCollections
} from "@/lib/actions/admin/productActions";
import { getBrands, createBrandOnTheFly } from "@/lib/actions/admin/brandActions";
import { getCategories, createCategoryOnTheFly } from "@/lib/actions/admin/categoryActions";
import { getAttributeSets, createAttributeSet } from "@/lib/actions/admin/attributeSetActions";
import { uploadImages } from "@/lib/actions/uploadActions";
import DynamicSelect from "./DynamicSelect";
import AttributeValueSelect from "./AttributeValueSelect";
import VariantMatrix from "./VariantMatrix";
import VariantImageManager from "./VariantImageManager";
import EditVariantManager from "./EditVariantManager";
import ImageUpload from "./ImageUpload";
import LoadingButton from "@/components/ui/LoadingButton";
import MarkdownEditor from "./MarkdownEditor";

// ShadCN UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import type { 
  SelectGender, 
  SelectAttribute,
  SelectAttributeValue,
  SelectCollection
} from "@/lib/db/schema";
import type { BrandWithProductCount } from "@/lib/actions/admin/brandActions";
import type { CategoryWithProductCount } from "@/lib/actions/admin/categoryActions";
import type { AttributeSetWithProductCount } from "@/lib/actions/admin/attributeSetActions";

// Form validation schema
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  productCode: z.string().min(1, "Product code is required"),
  categoryId: z.string().optional(),
  genderId: z.string().optional(),
  brandId: z.string().optional(),
  attributeSetId: z.string().min(1, "Product type is required"),
  isPublished: z.boolean(),
  collectionIds: z.array(z.string()),
  variants: z.array(z.object({
    id: z.string().optional(),
    sku: z.string().min(1, "SKU is required"),
    price: z.string().min(1, "Price is required"),
    salePrice: z.string().optional(),
    attributeValueIds: z.array(z.string()).min(1, "At least one attribute value is required"),
    inStock: z.number().int().min(0, "Stock must be non-negative"),
    imageUrl: z.string().optional(),
  })).min(1, "At least one variant is required"),
  productImages: z.array(z.string()),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: AdminProduct | null;
  action: (formData: FormData) => Promise<{ success: boolean; errors?: any[]; error?: string; productId?: string; message?: string }>;
  isEditing?: boolean;
}

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

export default function ProductForm({ product, action, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  
  // Reference data
  const [brands, setBrands] = useState<BrandWithProductCount[]>([]);
  const [categories, setCategories] = useState<CategoryWithProductCount[]>([]);
  const [genders, setGenders] = useState<SelectGender[]>([]);
  const [attributeSets, setAttributeSets] = useState<AttributeSetWithProductCount[]>([]);
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [collections, setCollections] = useState<SelectCollection[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      productCode: product?.productCode || "",
      categoryId: product?.categoryId || "",
      genderId: product?.genderId || "",
      brandId: product?.brandId || "",
      attributeSetId: product?.productTypeId || "",
      isPublished: product?.isPublished || false,
      collectionIds: product?.collections?.map(c => c.id) || [],
      variants: [],
      productImages: product?.productImages || [],
    },
  });

  const watchedAttributeSetId = watch("attributeSetId");

  // Load reference data
  const loadReferenceData = async () => {
    try {
      const [brandsData, categoriesData, gendersData, attributeSetsData, collectionsData] = await Promise.all([
        getBrands(),
        getCategories(),
        getGenders(),
        getAttributeSets(),
        getAllCollections(),
      ]);
      
      setBrands(brandsData);
      setCategories(categoriesData);
      setGenders(gendersData);
      setAttributeSets(attributeSetsData);
      setCollections(collectionsData);
    } catch (error) {
      console.error("Error loading reference data:", error);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  // Load attribute values when attribute set changes
  useEffect(() => {
    const loadAttributeValues = async () => {
      if (watchedAttributeSetId) {
        try {
          const attributeValuesData = await getAttributeValuesForProductType(watchedAttributeSetId);
          setAttributeValues(attributeValuesData);
        } catch (error) {
          console.error("Error loading attribute values:", error);
          setAttributeValues([]);
        }
      } else {
        setAttributeValues([]);
      }
    };

    loadAttributeValues();
  }, [watchedAttributeSetId]);

  // Initialize variants from product data
  useEffect(() => {
    if (product?.variants && isEditing && variants.length === 0) {
      const initialVariants = product.variants.map(variant => ({
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        salePrice: variant.salePrice || "",
        attributeValueIds: variant.attributeValueIds || variant.attributeValues?.map(av => av.id) || [],
        inStock: variant.inStock || 0,
        imageUrl: variant.imageUrl || undefined,
      }));
      setVariants(initialVariants);
      setValue("variants", initialVariants);
    }
  }, [product?.variants, isEditing, setValue]);

  // Initialize product images from product data
  useEffect(() => {
    if (product?.productImages) {
      setProductImages(product.productImages);
      setValue("productImages", product.productImages);
    }
  }, [product, setValue]);

  // Handle new product variant creation
  useEffect(() => {
    if (!isEditing && variants.length === 0 && watchedAttributeSetId) {
      // Add one empty variant for new products when attribute set is selected
      addVariant();
    }
  }, [watchedAttributeSetId, isEditing]);

  const addVariant = () => {
    const newVariant = {
      sku: "",
      price: "",
      salePrice: "",
      attributeValueIds: [],
      inStock: 0,
    };
    const updatedVariants = [...variants, newVariant];
    setVariants(updatedVariants);
    setValue("variants", updatedVariants);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      const updatedVariants = variants.filter((_, i) => i !== index);
      setVariants(updatedVariants);
      setValue("variants", updatedVariants);
    }
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | string[]) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
    setValue("variants", updatedVariants);
  };

  const updateVariantAttributeValue = (variantIndex: number, attributeId: string, attributeValueId: string) => {
    const variant = variants[variantIndex];
    const currentAttributeValueIds = variant.attributeValueIds.filter(id => {
      // Remove any existing value for this attribute
      const existingValue = attributeValues.find(av => av.attributeValueId === id);
      return !existingValue || existingValue.attributeId !== attributeId;
    });
    
    // Add the new attribute value
    const newAttributeValueIds = [...currentAttributeValueIds, attributeValueId];
    updateVariant(variantIndex, 'attributeValueIds', newAttributeValueIds);
  };

  const generateSKU = (index: number) => {
    const productName = watch("name").replace(/\s+/g, '').toUpperCase().substring(0, 3);
    const variant = variants[index];
    
    // Get attribute values for this variant
    const variantAttributeValues = attributeValues.filter(av => 
      variant.attributeValueIds.includes(av.attributeValueId)
    );
    
    if (variantAttributeValues.length > 0) {
      const attributeParts = variantAttributeValues
        .sort((a, b) => a.attributeDisplayName.localeCompare(b.attributeDisplayName))
        .map(av => av.attributeValue.toUpperCase());
      
      const sku = `${productName}-${attributeParts.join('-')}`;
      updateVariant(index, 'sku', sku);
    }
  };

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

  // Get unique attributes for the selected product type
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

  const handleProductImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploadingImages(true);
    try {
      // Create FormData with the selected files
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      // Upload images to Cloudinary
      const result = await uploadImages(formData);
      
      if (result.success && result.urls) {
        const updatedImages = [...productImages, ...result.urls];
        setProductImages(updatedImages);
        setValue("productImages", updatedImages);
        toast.success(`${result.urls.length} image(s) uploaded successfully`);
      } else {
        toast.error(result.error || "Failed to upload images");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images. Please try again.");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleProductImageRemove = (index: number) => {
    const updatedImages = productImages.filter((_, i) => i !== index);
    setProductImages(updatedImages);
    setValue("productImages", updatedImages);
  };

  const handleVariantsChange = useCallback((newVariants: Variant[]) => {
    if (isEditing) {
      return;
    }
    
    setVariants(newVariants);
    setValue("variants", newVariants);
  }, [isEditing, setValue]);

  const handleVariantUpdate = useCallback((index: number, updatedVariant: Variant) => {
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[index] = updatedVariant;
      setValue("variants", newVariants);
      return newVariants;
    });
  }, [setValue]);

  const handleVariantAdd = useCallback((newVariant: Variant) => {
    setVariants(prev => {
      const newVariants = [...prev, newVariant];
      setValue("variants", newVariants);
      return newVariants;
    });
  }, [setValue]);

  const handleVariantRemove = useCallback((index: number) => {
    setVariants(prev => {
      const newVariants = prev.filter((_, i) => i !== index);
      setValue("variants", newVariants);
      return newVariants;
    });
  }, [setValue]);

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      // Validate variants before submission
      const invalidVariants = data.variants.filter(variant => 
        !variant.price || 
        isNaN(parseFloat(variant.price)) || 
        parseFloat(variant.price) <= 0
      );

      if (invalidVariants.length > 0) {
        toast.error("Please set valid prices for all variants before creating the product");
        setIsSubmitting(false);
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append("name", data.name);
      formDataObj.append("description", data.description);
      formDataObj.append("productCode", data.productCode);
      formDataObj.append("categoryId", data.categoryId || "");
      formDataObj.append("genderId", data.genderId || "");
      formDataObj.append("brandId", data.brandId || "");
      formDataObj.append("productTypeId", data.attributeSetId);
      formDataObj.append("isPublished", data.isPublished.toString());
      formDataObj.append("collectionIds", JSON.stringify(data.collectionIds || []));
      
      // Ensure all prices are strings before sending
      const variantsWithStringPrices = data.variants.map(variant => ({
        ...variant,
        price: String(variant.price),
        salePrice: String(variant.salePrice || "")
      }));
      formDataObj.append("variants", JSON.stringify(variantsWithStringPrices));
      formDataObj.append("productImages", JSON.stringify(data.productImages));

      const result = await action(formDataObj);

      if (result.success) {
        toast.success(result.message || (isEditing ? "Product updated successfully!" : "Product created successfully!"));
        if (isEditing) {
          router.push("/admin/products");
        } else {
          router.push(`/admin/products/${result.productId}/edit`);
        }
      } else {
        if (result.errors) {
          toast.error("Please fix the errors below");
        } else {
          toast.error(result.error || "An error occurred");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Product Information */}
        <Card className="retro-card">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <DynamicSelect
                label="Product Type"
                value={watchedAttributeSetId || ""}
                onChange={(value) => {
                  setValue("attributeSetId", value);
                  if (!isEditing) {
                    setVariants([]);
                    setValue("variants", []);
                  }
                }}
                options={attributeSets}
                createAction={createAttributeSet}
                modalTitle="Create New Product Type"
                modalLabel="Product Type Name"
                modalPlaceholder="e.g., Standard Apparel, Waist-Sized Apparel, Accessories"
                placeholder="Select a product type"
                required
                error={errors.attributeSetId?.message}
                onRefresh={loadReferenceData}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter product name"
                className={`retro-input ${errors.name ? "border-red-300" : ""}`}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productCode">Product Code *</Label>
              <Input
                id="productCode"
                {...register("productCode")}
                placeholder="e.g., JAK, TSH, PAN"
                className={`font-mono ${errors.productCode ? "border-red-300" : ""}`}
                onChange={(e) => {
                  setValue("productCode", e.target.value.toUpperCase());
                }}
              />
              <p className="text-sm text-gray-500">
                Used for SKU generation (e.g., JAK-S-RED for Jacket Size Small Red)
              </p>
              {errors.productCode && (
                <p className="text-sm text-red-600">{errors.productCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <MarkdownEditor
                value={watch("description")}
                onChange={(value) => setValue("description", value)}
                placeholder="Enter product description using Markdown formatting..."
                rows={6}
                error={errors.description?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <DynamicSelect
                  label="Category"
                  value={watch("categoryId") || ""}
                  onChange={(value) => setValue("categoryId", value)}
                  options={categories}
                  createAction={createCategoryOnTheFly}
                  modalTitle="Create New Category"
                  modalLabel="Category Name"
                  modalPlaceholder="e.g., T-Shirts, Jeans, Shoes"
                  placeholder="Select a category"
                  onRefresh={loadReferenceData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genderId">Gender</Label>
                <Select
                  value={watch("genderId") || "none"}
                  onValueChange={(value: string) => setValue("genderId", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a gender</SelectItem>
                    {genders.map((gender) => (
                      <SelectItem key={gender.id} value={gender.id}>
                        {gender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <DynamicSelect
                  label="Brand"
                  value={watch("brandId") || ""}
                  onChange={(value) => setValue("brandId", value)}
                  options={brands}
                  createAction={createBrandOnTheFly}
                  modalTitle="Create New Brand"
                  modalLabel="Brand Name"
                  modalPlaceholder="e.g., Nike, Adidas, Puma"
                  placeholder="Select a brand"
                  onRefresh={loadReferenceData}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Collections</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {collections.map((collection) => (
                  <div key={collection.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`collection-${collection.id}`}
                      checked={watch("collectionIds")?.includes(collection.id) || false}
                      onCheckedChange={(checked: boolean) => {
                        const currentIds = watch("collectionIds") || [];
                        if (checked) {
                          setValue("collectionIds", [...currentIds, collection.id]);
                        } else {
                          setValue("collectionIds", currentIds.filter(id => id !== collection.id));
                        }
                      }}
                    />
                    <Label htmlFor={`collection-${collection.id}`} className="text-sm">
                      {collection.name}
                    </Label>
                  </div>
                ))}
              </div>
              {collections.length === 0 && (
                <p className="text-sm text-gray-500">No collections available. Create collections in the admin panel.</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={watch("isPublished")}
                onCheckedChange={(checked: boolean) => setValue("isPublished", checked)}
              />
              <Label htmlFor="isPublished">Publish this product</Label>
            </div>
          </CardContent>
        </Card>

        {/* Product Variants */}
        {watchedAttributeSetId && (
          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                // Edit mode: Show comprehensive variant management
                <EditVariantManager
                  variants={variants}
                  attributeValues={attributeValues}
                  onVariantUpdate={handleVariantUpdate}
                  onVariantAdd={handleVariantAdd}
                  onVariantRemove={handleVariantRemove}
                  productImages={productImages}
                />
              ) : (
                // New product mode: Show variant matrix for creation
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    New product mode: Creating variants with matrix
                  </p>
                  {!isEditing && (
                    <VariantMatrix
                      attributes={getUniqueAttributes().map(attr => ({
                        id: attr.attributeId,
                        name: attr.attributeName,
                        displayName: attr.attributeDisplayName
                      }))}
                      attributeValues={attributeValues}
                      onVariantsChange={handleVariantsChange}
                      productCode={watch("productCode")}
                    />
                  )}
                  
                  {variants.length > 0 && (
                    <div className="mt-6">
                      <VariantImageManager
                        variants={variants}
                        onVariantUpdate={handleVariantUpdate}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!watchedAttributeSetId && (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              <p>Please select a product type to configure variants</p>
            </CardContent>
          </Card>
        )}

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              onImageUpload={handleProductImageUpload}
              onImageRemove={handleProductImageRemove}
              images={productImages}
              title="Product Images"
              description="Upload main product images that will be shown in the product gallery"
              maxImages={10}
              isLoading={isUploadingImages}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Saving..."
          >
            {isEditing ? "Update Product" : "Create Product"}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}