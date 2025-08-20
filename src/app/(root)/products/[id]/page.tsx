import Image from "next/image";
import Link from "next/link";
import { Card, CollapsibleSection, ProductGallery, SizePicker } from "@/components";
import { Heart, ShoppingBag, Star } from "lucide-react";

type Product = {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  compareAt?: number;
  description: string;
  variants: { color: string; images: string[] }[];
};

const MOCK_PRODUCTS: Record<string, Product> = {
  "1": {
    id: "1",
    title: "Nike Air Max 90 SE",
    subtitle: "Women's Shoes",
    price: 140,
    description:
      "The Air Max 90 stays true to its running roots with the iconic Waffle sole. Plus, stitched overlays and textured accents create the '90s look you love. Complete with romantic hues, its visible Air cushioning adds comfort to your journey.",
    variants: [
      {
        color: "Dark Team Red",
        images: ["/shoes/shoe-1.jpg", "/shoes/shoe-2.webp", "/shoes/shoe-3.webp"],
      },
      {
        color: "Pure Platinum",
        images: ["/shoes/shoe-4.webp", "/shoes/shoe-5.avif"],
      },
      {
        color: "Platinum Tint",
        images: ["/shoes/shoe-6.avif", "/shoes/shoe-7.avif"],
      },
    ],
  },
  "2": {
    id: "2",
    title: "Nike Dunk Low Retro",
    subtitle: "Men's Shoes",
    price: 98.3,
    description:
      "Classic hoops style with modern comfort. The Dunk Low delivers iconic design and everyday wearability.",
    variants: [
      { color: "Black/White", images: ["/shoes/shoe-8.avif", "/shoes/shoe-9.avif"] },
      { color: "Green/Yellow", images: ["/shoes/shoe-10.avif"] },
    ],
  },
};

const RECS: Product[] = [
  {
    id: "3",
    title: "Nike Air Force 1 Mid '07",
    subtitle: "Men's Shoes",
    price: 98.3,
    description: "",
    variants: [{ color: "White/Black", images: ["/shoes/shoe-11.avif"] }],
  },
  {
    id: "4",
    title: "Nike Court Vision Low Next Nature",
    subtitle: "Men's Shoes",
    price: 98.3,
    description: "",
    variants: [{ color: "Gray/Blue", images: ["/shoes/shoe-12.avif"] }],
  },
  {
    id: "5",
    title: "Nike Dunk Low Retro",
    subtitle: "Men's Shoes",
    price: 98.3,
    description: "",
    variants: [{ color: "Green/Yellow", images: ["/shoes/shoe-13.avif"] }],
  },
];

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = MOCK_PRODUCTS[id] ?? Object.values(MOCK_PRODUCTS)[0];

  const discount =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : null;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav className="py-4 text-caption text-dark-700">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/products" className="hover:underline">Products</Link> /{" "}
        <span className="text-dark-900">{product.title}</span>
      </nav>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_480px]">
        <ProductGallery variants={product.variants} className="lg:sticky lg:top-6" />

        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-heading-2 text-dark-900">{product.title}</h1>
            {product.subtitle && <p className="text-body text-dark-700">{product.subtitle}</p>}
          </header>

          <div className="flex items-center gap-3">
            <p className="text-lead text-dark-900">${product.price.toFixed(2)}</p>
            {product.compareAt && (
              <>
                <span className="text-body text-dark-700 line-through">${product.compareAt.toFixed(2)}</span>
                {discount !== null && (
                  <span className="rounded-full border border-light-300 px-2 py-1 text-caption text-[--color-green]">
                    {discount}% off
                  </span>
                )}
              </>
            )}
          </div>

          <SizePicker />

          <div className="flex flex-col gap-3">
            <button className="flex items-center justify-center gap-2 rounded-full bg-dark-900 px-6 py-4 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]">
              <ShoppingBag className="h-5 w-5" />
              Add to Bag
            </button>
            <button className="flex items-center justify-center gap-2 rounded-full border border-light-300 px-6 py-4 text-body-medium text-dark-900 transition hover:border-dark-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]">
              <Heart className="h-5 w-5" />
              Favorite
            </button>
          </div>

          <CollapsibleSection title="Product Details" defaultOpen>
            <p>{product.description}</p>
            <ul className="mt-4 list-disc space-y-1 pl-5">
              <li>Padded collar</li>
              <li>Foam midsole</li>
              <li>Shown: Multiple colors</li>
              <li>Style: HM9451-600</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Shipping & Returns">
            <p>Free standard shipping and free 30-day returns for Nike Members.</p>
          </CollapsibleSection>

          <CollapsibleSection
            title="Reviews (10)"
            rightMeta={
              <span className="flex items-center gap-1 text-dark-900">
                <Star className="h-4 w-4 fill-[--color-dark-900]" />
                <Star className="h-4 w-4 fill-[--color-dark-900]" />
                <Star className="h-4 w-4 fill-[--color-dark-900]" />
                <Star className="h-4 w-4 fill-[--color-dark-900]" />
                <Star className="h-4 w-4" />
              </span>
            }
          >
            <p>No reviews yet.</p>
          </CollapsibleSection>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-6 text-heading-3 text-dark-900">You Might Also Like</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RECS.map((p) => {
            const firstImg = p.variants.flatMap((v) => v.images)[0] ?? "/shoes/shoe-1.jpg";
            return (
              <Card
                key={p.id}
                title={p.title}
                subtitle={p.subtitle}
                imageSrc={firstImg}
                price={p.price}
                href={`/products/${p.id}`}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
