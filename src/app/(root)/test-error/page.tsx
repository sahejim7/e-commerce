"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestErrorPage() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("This is a test error to demonstrate the error boundary!");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-3xl font-bold">Error Boundary Test Page</h1>
        <p className="text-muted-foreground">
          This page is designed to test the global error boundary functionality.
        </p>
        <div className="space-y-4">
          <Button 
            onClick={() => setShouldThrow(true)}
            variant="destructive"
            className="w-full"
          >
            Trigger Error (Test Error Boundary)
          </Button>
          <p className="text-sm text-muted-foreground">
            Click the button above to trigger an error and see the error boundary in action.
          </p>
        </div>
      </div>
    </div>
  );
}
