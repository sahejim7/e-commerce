"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ isLoading, loadingText = "Loading...", children, disabled, className = "", ...props }, ref) => {
    const { pending } = useFormStatus();
    
    const isPending = isLoading || pending;
    const isDisabled = disabled || isPending;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? loadingText : children}
      </button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export default LoadingButton;
