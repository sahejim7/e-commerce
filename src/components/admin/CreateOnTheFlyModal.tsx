"use client";

import { useState } from "react";

interface CreateOnTheFlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  label: string;
  placeholder?: string;
  action: (formData: FormData) => Promise<{ success: boolean; error?: string; [key: string]: any }>;
  onSuccess: (newItem: any) => void;
}

export default function CreateOnTheFlyModal({
  isOpen,
  onClose,
  title,
  label,
  placeholder,
  action,
  onSuccess,
}: CreateOnTheFlyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Modal submit triggered with name:", formData.name);
    setIsSubmitting(true);
    setError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);

      console.log("Calling action with FormData:", formData.name);
      const result = await action(formDataObj);
      console.log("Action result:", result);

      if (result.success) {
        // Find the newly created item in the result
        const newItem = result.brand || result.category || result.attributeSet || result.attributeValue;
        
        if (newItem) {
          setSuccess(`${label} "${formData.name}" created successfully!`);
          
          // Call onSuccess with the newly created item
          onSuccess(newItem);
          
          // Close modal after a brief delay to show success message
          setTimeout(() => {
            setFormData({ name: "" });
            setSuccess(null);
            onClose();
          }, 1000);
        }
      } else {
        setError(result.error || "Failed to create item");
      }
    } catch (error) {
      console.error("Error creating item:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "" });
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">This will be added to your options immediately</p>
        </div>
        
                <div className="px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {label} *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitting && !success) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              required
              autoFocus
              disabled={isSubmitting || !!success}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !!success}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : success ? "Created!" : "Create & Add"}
            </button>
          </div>
                </div>
      </div>
    </div>
  );
}
