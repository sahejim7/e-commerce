"use client";

export interface SizePickerProps {
  availableSizes: string[];
  selectedSize: string | null;
  onSizeSelect: (size: string | null) => void;
  className?: string;
}

export default function SizePicker({ 
  availableSizes, 
  selectedSize, 
  onSizeSelect, 
  className = "" 
}: SizePickerProps) {
  // If no sizes are available, don't render the component
  if (availableSizes.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-body-medium text-dark-900">Select Size</p>
        <button className="text-caption text-dark-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]">
          Size Guide
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {availableSizes.map((size) => {
          const isActive = selectedSize === size;
          return (
            <button
              key={size}
              onClick={() => onSizeSelect(isActive ? null : size)}
              className={`rounded-lg border px-3 py-3 text-center text-body transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] ${
                isActive ? "border-dark-900 text-dark-900" : "border-light-300 text-dark-700 hover:border-dark-500"
              }`}
              aria-pressed={isActive}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
