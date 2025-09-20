"use client";

import ErrorDisplay from "@/components/ErrorDisplay";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return <ErrorDisplay error={error} reset={reset} />;
}
