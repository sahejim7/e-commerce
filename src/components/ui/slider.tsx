"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  // Determine the number of thumbs based on the value or defaultValue
  const thumbCount = React.useMemo(() => {
    if (Array.isArray(value)) return value.length;
    if (Array.isArray(defaultValue)) return defaultValue.length;
    return 1; // Default to single thumb
  }, [value, defaultValue]);

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        "data-[disabled]:opacity-50",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-slate-200 relative grow overflow-hidden rounded-full",
          "data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-slate-900 absolute rounded-full transition-all duration-75",
            "data-[orientation=horizontal]:h-full",
            "data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "block size-5 shrink-0 rounded-full border-2 border-slate-900 bg-white",
            "shadow-md transition-transform duration-75 ease-out",
            "hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
