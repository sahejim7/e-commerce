"use client";

import { useState, useEffect } from "react";
import { getCategories, createCategory, deleteCategory } from "@/lib/actions/admin/categoryActions";
import type { CategoryWithProductCount } from "@/lib/actions/admin/categoryActions";

export default function CategoryManagement() {
  const [categories, setCategories] = useState<CategoryWithProductCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentId: "",
  });

  // Load categories
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
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
      formDataObj.append("parentId", formData.parentId || "");

      const result = await createCategory(formDataObj);

      if (result.success) {
        setSuccess("Category created successfully");
        setFormData({ name: "", slug: "", parentId: "" });
        setShowForm(false);
        loadCategories();
      } else {
        setError(result.error || "Failed to create category");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }

    try {
      const result = await deleteCategory(categoryId);

      if (result.success) {
        setSuccess("Category deleted successfully");
        loadCategories();
      } else {
        setError(result.error || "Failed to delete category");
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

  // Get root categories for parent selection
  const rootCategories = categories.filter(cat => !cat.parentId);

  if (isLoading) {
    return <div className="text-gray-500">Loading categories...</div>;
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

      {/* Add Category Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Categories ({categories.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {/* Add Category Form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Category</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
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
                  placeholder="category-slug"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
                Parent Category
              </label>
              <select
                id="parentId"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No parent (root category)</option>
                {rootCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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
                {isSubmitting ? "Creating..." : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No categories found. Create your first category to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent
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
              {categories.map((category) => {
                const parentCategory = categories.find(cat => cat.id === category.parentId);
                return (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parentCategory ? parentCategory.name : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.productCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="text-red-600 hover:text-red-900"
                        disabled={category.productCount > 0}
                        title={category.productCount > 0 ? "Cannot delete category with products" : "Delete category"}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
