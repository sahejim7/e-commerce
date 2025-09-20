"use client";

import { useState, useEffect } from "react";
import CreateOnTheFlyModal from "./CreateOnTheFlyModal";

interface DynamicSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
  createAction: (formData: FormData) => Promise<{ success: boolean; error?: string; [key: string]: any }>;
  modalTitle: string;
  modalLabel: string;
  modalPlaceholder?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  onRefresh?: () => void;
}

export default function DynamicSelect({
  value,
  onChange,
  options,
  createAction,
  modalTitle,
  modalLabel,
  modalPlaceholder,
  label,
  placeholder = "Select an option",
  required = false,
  error,
  className = "",
  onRefresh,
}: DynamicSelectProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === "create_new") {
      setIsModalOpen(true);
    } else {
      onChange(selectedValue);
    }
  };

  const handleModalSuccess = async (newItem: any) => {
    // Select the newly created item first
    if (newItem && newItem.id) {
      onChange(newItem.id);
    }
    
    // Then refresh options from parent component
    if (onRefresh) {
      await onRefresh();
    }
  };

  const selectClassName = `mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
    error ? 'border-red-300' : 'border-gray-300'
  } ${className}`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && "*"}
      </label>
      
      <select
        value={value}
        onChange={handleSelectChange}
        className={selectClassName}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
        <option value="create_new" className="text-blue-600 font-medium bg-blue-50">
          ➕ Create new {label.toLowerCase()}...
        </option>
      </select>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      <CreateOnTheFlyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        label={modalLabel}
        placeholder={modalPlaceholder}
        action={createAction}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
