"use client";

import { useState, useEffect } from "react";
import { getBrands, createBrand, deleteBrand } from "@/lib/actions/admin/brandActions";
import type { BrandWithProductCount } from "@/lib/actions/admin/brandActions";

export default function BrandManagement() {
  const [brands, setBrands] = useState<BrandWithProductCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logoUrl: "",
  });

  // Load brands
  const loadBrands = async () => {
    try {
      setIsLoading(true);
      const brandsData = await getBrands();
      setBrands(brandsData);
    } catch (error) {
      setError("Failed to load brands");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("slug", formData.slug);
      formDataObj.append("logoUrl", formData.logoUrl);

      const result = await createBrand(formDataObj);

      if (result.success) {
        setSuccess("Brand created successfully");
        setFormData({ name: "", slug: "", logoUrl: "" });
        setShowForm(false);
        loadBrands();
      } else {
        setError(result.error || "Failed to create brand");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (brandId: string, brandName: string) => {
    if (!confirm(`Are you sure you want to delete the brand "${brandName}"?`)) {
      return;
    }

    try {
      const result = await deleteBrand(brandId);

      if (result.success) {
        setSuccess("Brand deleted successfully");
        loadBrands();
      } else {
        setError(result.error || "Failed to delete brand");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    }
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading brands...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Add Brand Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Brands ({brands.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showForm ? "Cancel" : "Add Brand"}
        </button>
      </div>

      {/* Add Brand Form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Brand</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Brand Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter brand name"
                  required
                />
              </div>
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="brand-slug"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                Logo URL
              </label>
              <input
                type="url"
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Brand"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brands List */}
      {brands.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No brands found. Create your first brand to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {brand.logoUrl && (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="h-8 w-8 rounded-full object-cover mr-3"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brand.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brand.productCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(brand.id, brand.name)}
                      className="text-red-600 hover:text-red-900"
                      disabled={brand.productCount > 0}
                      title={brand.productCount > 0 ? "Cannot delete brand with products" : "Delete brand"}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
