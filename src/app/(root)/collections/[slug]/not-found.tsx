import Link from "next/link";

export default function CollectionNotFound() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-heading-2 text-dark-900 mb-4">Collection Not Found</h1>
        <p className="text-body text-dark-700 mb-8 max-w-md">
          The collection you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/products"
          className="rounded-lg bg-dark-900 px-6 py-3 text-body text-white transition-colors hover:bg-dark-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500"
        >
          Browse All Products
        </Link>
      </div>
    </main>
  );
}
