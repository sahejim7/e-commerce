"use client";

import { useState, useEffect } from "react";
import { getAttributeSets, createAttributeSet, deleteAttributeSet } from "@/lib/actions/admin/attributeSetActions";
import type { AttributeSetWithProductCount } from "@/lib/actions/admin/attributeSetActions";

export default function ProductTypeManagement() {
  const [attributeSets, setAttributeSets] = useState<AttributeSetWithProductCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });

  // Load attribute sets
  const loadAttributeSets = async () => {
    try {
      setIsLoading(true);
      const attributeSetsData = await getAttributeSets();
      setAttributeSets(attributeSetsData);
    } catch (error) {
      setError("Failed to load attribute sets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttributeSets();
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

      const result = await createAttributeSet(formDataObj);

      if (result.success) {
        setSuccess("Attribute set created successfully");
        setFormData({ name: "" });
        setShowForm(false);
        loadAttributeSets();
      } else {
        setError(result.error || "Failed to create attribute set");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (attributeSetId: string, attributeSetName: string) => {
    if (!confirm(`Are you sure you want to delete the attribute set "${attributeSetName}"?`)) {
      return;
    }

    try {
      const result = await deleteAttributeSet(attributeSetId);

      if (result.success) {
        setSuccess("Attribute set deleted successfully");
        loadAttributeSets();
      } else {
        setError(result.error || "Failed to delete attribute set");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading attribute sets...</div>;
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

      {/* Add Attribute Set Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Attribute Sets ({attributeSets.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showForm ? "Cancel" : "Add Attribute Set"}
        </button>
      </div>

      {/* Add Attribute Set Form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Attribute Set</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Attribute Set Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Standard Apparel, Waist-Sized Apparel, Accessories"
                required
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
                {isSubmitting ? "Creating..." : "Create Attribute Set"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Attribute Sets List */}
      {attributeSets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No attribute sets found. Create your first attribute set to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attribute Set
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attributeSets.map((attributeSet) => (
                <tr key={attributeSet.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{attributeSet.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attributeSet.productCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(attributeSet.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(attributeSet.id, attributeSet.name)}
                      className="text-red-600 hover:text-red-900"
                      disabled={attributeSet.productCount > 0}
                      title={attributeSet.productCount > 0 ? "Cannot delete attribute set with products" : "Delete attribute set"}
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
