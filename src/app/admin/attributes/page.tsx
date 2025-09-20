import { Suspense } from "react";
import { getBrands } from "@/lib/actions/admin/brandActions";
import { getCategories } from "@/lib/actions/admin/categoryActions";
import { getAttributes } from "@/lib/actions/admin/attributeActions";
import { getAttributeSets } from "@/lib/actions/admin/attributeSetActions";
import BrandManagement from "@/components/admin/BrandManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import AttributeManagement from "@/components/admin/AttributeManagement";
import AttributeSetManagement from "@/components/admin/AttributeSetManagement";
import CollectionManagement from "@/components/admin/CollectionManagement";

export default function AdminAttributesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Product Attributes & Classification</h1>
        <p className="text-gray-600 mt-2">
          Manage all product classification entities including brands, categories, attributes, and product types.
        </p>
      </div>

      <div className="space-y-8">
        {/* Product Types Section */}
        <section className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Product Types</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage product types that define the structure of your products (e.g., T-Shirt, Pants, Jacket).
            </p>
          </div>
          <div className="p-6">
            <Suspense fallback={<div className="text-gray-500">Loading product types...</div>}>
              <AttributeSetManagement />
            </Suspense>
          </div>
        </section>

        {/* Brands Section */}
        <section className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Brands</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage product brands. Brands help customers identify and filter products.
            </p>
          </div>
          <div className="p-6">
            <Suspense fallback={<div className="text-gray-500">Loading brands...</div>}>
              <BrandManagement />
            </Suspense>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
            <p className="text-sm text-gray-600 mt-1">
              Organize products into hierarchical categories for better navigation and filtering.
            </p>
          </div>
          <div className="p-6">
            <Suspense fallback={<div className="text-gray-500">Loading categories...</div>}>
              <CategoryManagement />
            </Suspense>
          </div>
        </section>

        {/* Collections Section */}
        <section className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Collections</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage product collections for marketing campaigns and featured product groupings.
            </p>
          </div>
          <div className="p-6">
            <Suspense fallback={<div className="text-gray-500">Loading collections...</div>}>
              <CollectionManagement />
            </Suspense>
          </div>
        </section>

        {/* Attributes Section */}
        <section className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Attributes & Values</h2>
            <p className="text-sm text-gray-600 mt-1">
              Define product attributes (Color, Size, etc.) and their possible values. These are used to create product variants.
            </p>
          </div>
          <div className="p-6">
            <Suspense fallback={<div className="text-gray-500">Loading attributes...</div>}>
              <AttributeManagement />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}
