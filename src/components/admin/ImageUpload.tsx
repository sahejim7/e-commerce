"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  onImageUpload: (files: FileList) => void;
  onImageRemove?: (index: number) => void;
  images?: string[];
  maxImages?: number;
  title?: string;
  description?: string;
  variantImages?: boolean;
  isLoading?: boolean;
}

export default function ImageUpload({
  onImageUpload,
  onImageRemove,
  images = [],
  maxImages = 10,
  title = "Product Images",
  description = "Upload images for your product",
  variantImages = false,
  isLoading = false
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log("File input triggered, files:", files);
    console.log("Files length:", files?.length);
    if (files && files.length > 0) {
      console.log("Calling handleFileUpload with files:", files);
      handleFileUpload(files);
    } else {
      console.log("No files selected or files is null");
    }
  };

  const handleFileUpload = async (files: FileList) => {
    console.log("handleFileUpload called with files:", files);
    console.log("Files type:", typeof files);
    console.log("Files constructor:", files.constructor.name);
    
    // Validate files
    const validFiles = Array.from(files).filter(file => {
      console.log("Validating file:", file.name, file.type, file.size);
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    console.log("Valid files:", validFiles);
    console.log("Valid files length:", validFiles.length);

    if (validFiles.length > 0) {
      // Create a new FileList-like object
      const dataTransfer = new DataTransfer();
      validFiles.forEach(file => dataTransfer.items.add(file));
      console.log("Calling onImageUpload with:", dataTransfer.files);
      console.log("onImageUpload function:", typeof onImageUpload);
      onImageUpload(dataTransfer.files);
    } else {
      console.log("No valid files to upload");
    }
    
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    if (onImageRemove) {
      onImageRemove(index);
    }
  };

  return (
    <div className={variantImages ? "retro-card" : "bg-white rounded-lg shadow"}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      )}
      
      <div className="p-6">
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : variantImages 
                ? 'border-foreground/30 hover:border-foreground/50 retro-border'
                : 'border-gray-300 hover:border-gray-400'
          } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            
            <div className="text-sm text-gray-600">
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">
                  Click to upload
                </span>
                <span className="text-gray-500"> or drag and drop</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
            
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 10MB each
              {variantImages && " • Assign to specific variants after upload"}
            </p>
            
            {isLoading && (
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Uploading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Uploaded Images ({images.length}/{maxImages})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
