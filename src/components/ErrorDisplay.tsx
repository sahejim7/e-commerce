"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorDisplay({ error, reset }: ErrorDisplayProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Something went wrong!
          </h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try again or return to the homepage.
          </p>
        </div>

        {/* Development Error Details */}
        {isDevelopment && error.message && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 text-left">
            <h3 className="text-sm font-medium text-foreground mb-2">Error Details:</h3>
            <p className="text-sm text-muted-foreground font-mono break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-sm text-muted-foreground">
          <p>
            If this problem persists, please{" "}
            <Link href="/contact" className="text-primary hover:underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
