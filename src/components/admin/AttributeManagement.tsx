"use client";

import { useState, useEffect } from "react";
import { 
  getAttributes, 
  createAttribute, 
  deleteAttribute,
  getAttributeValues,
  addAttributeValue,
  deleteAttributeValue
} from "@/lib/actions/admin/attributeActions";
import type { AttributeWithValues, AttributeValueWithUsage } from "@/lib/actions/admin/attributeActions";

export default function AttributeManagement() {
  const [attributes, setAttributes] = useState<AttributeWithValues[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [expandedAttribute, setExpandedAttribute] = useState<string | null>(null);
  const [attributeFormData, setAttributeFormData] = useState({
    name: "",
    displayName: "",
  });
  const [valueFormData, setValueFormData] = useState({
    value: "",
    sortOrder: 0,
  });

  // Load attributes
  const loadAttributes = async () => {
    try {
      setIsLoading(true);
      const attributesData = await getAttributes();
      setAttributes(attributesData);
    } catch (error) {
      setError("Failed to load attributes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttributes();
  }, []);

  // Handle attribute form submission
  const handleAttributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", attributeFormData.name);
      formDataObj.append("displayName", attributeFormData.displayName);

      const result = await createAttribute(formDataObj);

      if (result.success) {
        setSuccess("Attribute created successfully");
        setAttributeFormData({ name: "", displayName: "" });
        setShowAttributeForm(false);
        loadAttributes();
      } else {
        setError(result.error || "Failed to create attribute");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle attribute value form submission
  const handleValueSubmit = async (e: React.FormEvent, attributeId: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("attributeId", attributeId);
      formDataObj.append("value", valueFormData.value);
      formDataObj.append("sortOrder", valueFormData.sortOrder.toString());

      const result = await addAttributeValue(formDataObj);

      if (result.success) {
        setSuccess("Attribute value added successfully");
        setValueFormData({ value: "", sortOrder: 0 });
        loadAttributes(); // Reload to get updated values
      } else {
        setError(result.error || "Failed to add attribute value");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle attribute delete
  const handleDeleteAttribute = async (attributeId: string, attributeName: string) => {
    if (!confirm(`Are you sure you want to delete the attribute "${attributeName}"? This will also delete all its values.`)) {
      return;
    }

    try {
      const result = await deleteAttribute(attributeId);

      if (result.success) {
        setSuccess("Attribute deleted successfully");
        loadAttributes();
      } else {
        setError(result.error || "Failed to delete attribute");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    }
  };

  // Handle attribute value delete
  const handleDeleteValue = async (valueId: string, valueName: string) => {
    if (!confirm(`Are you sure you want to delete the value "${valueName}"?`)) {
      return;
    }

    try {
      const result = await deleteAttributeValue(valueId);

      if (result.success) {
        setSuccess("Attribute value deleted successfully");
        loadAttributes();
      } else {
        setError(result.error || "Failed to delete attribute value");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    }
  };

  // Generate name from display name
  const generateName = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
  };

  const handleDisplayNameChange = (displayName: string) => {
    setAttributeFormData({
      ...attributeFormData,
      displayName,
      name: generateName(displayName),
    });
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading attributes...</div>;
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

      {/* Add Attribute Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Attributes ({attributes.length})
        </h3>
        <button
          onClick={() => setShowAttributeForm(!showAttributeForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showAttributeForm ? "Cancel" : "Add Attribute"}
        </button>
      </div>

      {/* Add Attribute Form */}
      {showAttributeForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Attribute</h4>
          <form onSubmit={handleAttributeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name *
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={attributeFormData.displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Apparel Size"
                  required
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Internal Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={attributeFormData.name}
                  onChange={(e) => setAttributeFormData({ ...attributeFormData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., apparel_size"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAttributeForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Attribute"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Attributes List */}
      {attributes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No attributes found. Create your first attribute to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="bg-white border border-gray-200 rounded-lg">
              {/* Attribute Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedAttribute(
                  expandedAttribute === attribute.id ? null : attribute.id
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{attribute.displayName}</h4>
                    <p className="text-sm text-gray-500">
                      {attribute.name} • {attribute.values.length} values • {attribute.variantCount} variants
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {expandedAttribute === attribute.id ? "▼" : "▶"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAttribute(attribute.id, attribute.displayName);
                      }}
                      className="text-red-600 hover:text-red-900 text-sm"
                      disabled={attribute.variantCount > 0}
                      title={attribute.variantCount > 0 ? "Cannot delete attribute with variants" : "Delete attribute"}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Attribute Values (Expandable) */}
              {expandedAttribute === attribute.id && (
                <div className="border-t border-gray-200 p-4">
                  <div className="space-y-4">
                    {/* Add Value Form */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-md font-medium text-gray-900 mb-3">Add New Value</h5>
                      <form onSubmit={(e) => handleValueSubmit(e, attribute.id)} className="flex gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={valueFormData.value}
                            onChange={(e) => setValueFormData({ ...valueFormData, value: e.target.value })}
                            className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter value (e.g., Small, Red, 32)"
                            required
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            value={valueFormData.sortOrder}
                            onChange={(e) => setValueFormData({ ...valueFormData, sortOrder: parseInt(e.target.value) || 0 })}
                            className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Order"
                            min="0"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </form>
                    </div>

                    {/* Values List */}
                    {attribute.values.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p>No values added yet. Add your first value above.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {attribute.values.map((value) => (
                          <div key={value.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{value.value}</span>
                              <span className="text-xs text-gray-500 ml-2">(Order: {value.sortOrder})</span>
                            </div>
                            <button
                              onClick={() => handleDeleteValue(value.id, value.value)}
                              className="text-red-600 hover:text-red-900 text-sm"
                              title="Delete value"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
