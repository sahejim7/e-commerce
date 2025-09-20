"use client";

import { useState, useEffect } from "react";
import { SelectAttribute, SelectAttributeValue } from "@/lib/db/schema";

interface AttributeValue {
  attributeId: string;
  attributeName: string;
  attributeDisplayName: string;
  attributeValueId: string;
  attributeValue: string;
  attributeValueSortOrder: number;
}

interface VariantMatrixProps {
  attributes: SelectAttribute[];
  attributeValues: AttributeValue[];
  onVariantsChange: (variants: any[]) => void;
  productCode?: string;
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

export default function VariantMatrix({
  attributes,
  attributeValues,
  onVariantsChange,
  productCode = "PROD"
}: VariantMatrixProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<{ [attributeId: string]: string[] }>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [bulkStock, setBulkStock] = useState<number>(0);

  // Generate all possible combinations when attributes/values change
  useEffect(() => {
    if (selectedAttributes.length === 0) {
      setVariants([]);
      return;
    }

    const combinations = generateCombinations();
    const newVariants = combinations.map((combo, index) => {
      const sku = generateSKU(combo, index);
      const attributeValueIds = Object.values(combo);
      
      // Try to find existing variant with same attribute value combination to preserve data
      const existingVariant = variants.find(v => 
        v.attributeValueIds.length === attributeValueIds.length &&
        v.attributeValueIds.every(id => attributeValueIds.includes(id))
      );
      
      return {
        sku,
        price: existingVariant?.price || (bulkPrice > 0 ? bulkPrice.toString() : "0"),
        salePrice: existingVariant?.salePrice || "",
        attributeValueIds,
        inStock: existingVariant?.inStock || (bulkStock || 0),
        imageUrl: existingVariant?.imageUrl || undefined
      };
    });

    setVariants(newVariants);
  }, [selectedAttributes, selectedValues, bulkPrice, bulkStock, productCode]);

  // Separate useEffect to call onVariantsChange after state update
  useEffect(() => {
    onVariantsChange(variants);
  }, [variants, onVariantsChange]);

  const generateCombinations = () => {
    if (selectedAttributes.length === 0) return [];

    const combinations: { [key: string]: string }[] = [];
    
    const generateRecursive = (currentCombo: { [key: string]: string }, remainingAttrs: string[]) => {
      if (remainingAttrs.length === 0) {
        combinations.push({ ...currentCombo });
        return;
      }

      const currentAttr = remainingAttrs[0];
      const values = selectedValues[currentAttr] || [];
      
      values.forEach(valueId => {
        generateRecursive(
          { ...currentCombo, [currentAttr]: valueId },
          remainingAttrs.slice(1)
        );
      });
    };

    generateRecursive({}, selectedAttributes);
    return combinations;
  };

  const generateSKU = (combo: { [key: string]: string }, index: number) => {
    const parts = [productCode];
    
    selectedAttributes.forEach(attrId => {
      const valueId = combo[attrId];
      const attribute = attributes.find(a => a.id === attrId);
      const value = attributeValues.find(v => v.attributeValueId === valueId);
      
      if (attribute && value) {
        // Create short code from attribute and value
        const attrCode = attribute.name.toUpperCase().substring(0, 3);
        const valueCode = value.attributeValue.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
        parts.push(`${attrCode}-${valueCode}`);
      }
    });

    // Add timestamp and index to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
    parts.push(`${timestamp}-${index + 1}`);

    return parts.join('-');
  };

  const handleAttributeToggle = (attributeId: string) => {
    setSelectedAttributes(prev => {
      if (prev.includes(attributeId)) {
        // Remove attribute and its values
        const newAttrs = prev.filter(id => id !== attributeId);
        setSelectedValues(prevValues => {
          const newValues = { ...prevValues };
          delete newValues[attributeId];
          return newValues;
        });
        return newAttrs;
      } else {
        return [...prev, attributeId];
      }
    });
  };

  const handleValueToggle = (attributeId: string, valueId: string) => {
    setSelectedValues(prev => {
      const currentValues = prev[attributeId] || [];
      if (currentValues.includes(valueId)) {
        return {
          ...prev,
          [attributeId]: currentValues.filter(id => id !== valueId)
        };
      } else {
        return {
          ...prev,
          [attributeId]: [...currentValues, valueId]
        };
      }
    });
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return newVariants;
    });
  };

  const applyBulkPrice = () => {
    if (bulkPrice > 0) {
      setVariants(prev => {
        const newVariants = prev.map(v => ({ ...v, price: bulkPrice.toString() }));
        return newVariants;
      });
    }
  };

  const applyBulkStock = () => {
    setVariants(prev => {
      const newVariants = prev.map(v => ({ ...v, inStock: bulkStock }));
      return newVariants;
    });
  };

  const getAttributeName = (attributeId: string) => {
    return attributes.find(a => a.id === attributeId)?.displayName || attributeId;
  };

  const getValueName = (valueId: string) => {
    return attributeValues.find(v => v.attributeValueId === valueId)?.attributeValue || valueId;
  };

  return (
    <div className="space-y-6">
      {/* Attribute Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Attributes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attributes.map(attribute => (
            <div key={attribute.id} className="border rounded-lg p-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={selectedAttributes.includes(attribute.id)}
                  onChange={() => handleAttributeToggle(attribute.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">{attribute.displayName}</span>
              </label>
              
              {selectedAttributes.includes(attribute.id) && (
                <div className="space-y-2">
                  {attributeValues
                    .filter(value => value.attributeId === attribute.id)
                    .map(value => (
                      <label key={value.attributeValueId} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedValues[attribute.id]?.includes(value.attributeValueId) || false}
                          onChange={() => handleValueToggle(attribute.id, value.attributeValueId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{value.attributeValue}</span>
                      </label>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {variants.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Price:</label>
              <input
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 w-24"
                placeholder="0.00"
              />
              <button
                type="button"
                onClick={applyBulkPrice}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Apply to All
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Stock:</label>
              <input
                type="number"
                value={bulkStock}
                onChange={(e) => setBulkStock(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 w-24"
                placeholder="0"
              />
              <button
                type="button"
                onClick={applyBulkStock}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Apply to All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Matrix */}
      {variants.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Generated Variants ({variants.length} total)
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  {selectedAttributes.map(attrId => (
                    <th key={attrId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getAttributeName(attrId)}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {variants.map((variant, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {variant.sku}
                    </td>
                    {selectedAttributes.map(attrId => {
                      const valueId = variant.attributeValueIds.find(id => {
                        const value = attributeValues.find(v => v.attributeValueId === id);
                        return value && value.attributeId === attrId;
                      });
                      return (
                        <td key={attrId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {valueId ? getValueName(valueId) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-20 text-sm"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={variant.salePrice}
                        onChange={(e) => updateVariant(index, 'salePrice', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-20 text-sm"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={variant.inStock}
                        onChange={(e) => updateVariant(index, 'inStock', Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 w-16 text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
