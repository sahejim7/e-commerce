"use client";

import { useState, useEffect } from "react";
import CreateOnTheFlyModal from "./CreateOnTheFlyModal";
import { getAttributeValues, createAttributeValueOnTheFly } from "@/lib/actions/admin/attributeActions";

interface AttributeValueSelectProps {
  attributeId: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export default function AttributeValueSelect({
  attributeId,
  value,
  onChange,
  label,
  placeholder = "Select a value",
  required = false,
  error,
  className = "",
}: AttributeValueSelectProps) {
  const [options, setOptions] = useState<Array<{ id: string; value: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load attribute values
  const loadOptions = async () => {
    if (!attributeId) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const fetchedOptions = await getAttributeValues(attributeId);
      setOptions(fetchedOptions.map(option => ({ id: option.id, value: option.value })));
    } catch (error) {
      console.error("Error loading attribute values:", error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, [attributeId]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === "create_new") {
      setIsModalOpen(true);
    } else {
      onChange(selectedValue);
    }
  };

  const handleModalSuccess = (newItem: any) => {
    // Reload options to include the new item
    loadOptions();
    
    // Select the newly created item
    if (newItem && newItem.id) {
      onChange(newItem.id);
    }
  };

  const createAttributeValueAction = async (formData: FormData) => {
    // Add the attributeId to the form data
    formData.append("attributeId", attributeId);
    return await createAttributeValueOnTheFly(formData);
  };

  const selectClassName = `mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
    error ? 'border-red-300' : 'border-gray-300'
  } ${className}`;

  if (!attributeId) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && "*"}
        </label>
        <div className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500">
          Select an attribute set first
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && "*"}
      </label>
      
      {isLoading ? (
        <div className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500">
          Loading values...
        </div>
      ) : (
        <select
          value={value}
          onChange={handleSelectChange}
          className={selectClassName}
          required={required}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.value}
            </option>
          ))}
          <option value="create_new" className="text-blue-600 font-medium">
            + Create new...
          </option>
        </select>
      )}
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      <CreateOnTheFlyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Create New ${label}`}
        label={label}
        placeholder={`Enter ${label.toLowerCase()}`}
        action={createAttributeValueAction}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}







