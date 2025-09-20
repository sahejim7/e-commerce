import { getProductsAndFilters } from "@/lib/actions/productActions";
import ProductListingPage from "@/components/ProductListingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse the full collection of fashion at SecretLace. Shop for tops, bottoms, outerwear, and more. The best fashion is only here - discover our complete range of premium clothing and apparel.",
  keywords: ["all products", "fashion collection", "clothing", "apparel", "tops", "bottoms", "outerwear", "SecretLace"],
  openGraph: {
    title: "All Products - SecretLace",
    description: "Browse the full collection of fashion at SecretLace. Shop for tops, bottoms, outerwear, and more. The best fashion is only here.",
    url: "https://secretlace.shop/products",
    siteName: "SecretLace",
    images: [
      {
        url: "https://secretlace.shop/products-collection.jpg",
        width: 1200,
        height: 630,
        alt: "SecretLace - All Products Collection",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Products - SecretLace",
    description: "Browse the full collection of fashion at SecretLace. Shop for tops, bottoms, outerwear, and more.",
    images: ["https://secretlace.shop/products-collection.jpg"],
  },
};

type SearchParams = Record<string, string | string[] | undefined>;


export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  
  // Call the single comprehensive server action
  const result = await getProductsAndFilters(sp);

  return (
    <ProductListingPage
      products={result.products}
      totalCount={result.totalCount}
      hierarchicalCategories={result.hierarchicalCategories}
      availableAttributes={result.availableAttributes}
      availableBrands={result.availableBrands}
      searchParams={sp}
    />
  );
}
