import { Card } from "@/components";
import { getProductsByCollectionSlug } from "@/lib/actions/collectionActions";
import { formatPrice, formatPriceRange } from "@/lib/utils/price";
import { notFound } from "next/navigation";
import Image from "next/image";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  
  // Fetch collection data and products
  const collectionData = await getProductsByCollectionSlug(slug);
  
  // If collection not found, show 404
  if (!collectionData) {
    notFound();
  }
  
  const { collection, products, totalCount } = collectionData;
  
  return (
    <main>
      {/* Retro Hero Banner Section */}
      {collection.imageUrl && (
        <section className="relative w-full">
          {/* Main hero container with retro styling */}
          <div className="relative mx-4 sm:mx-6 lg:mx-8 mt-6 sm:mt-8">
            {/* Black border frame for retro look */}
            <div className="relative border-2 border-black shadow-2xl">
              {/* Image container with aspect ratio */}
              <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] overflow-hidden">
                <Image
                  src={collection.imageUrl}
                  alt={collection.name}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 80vw"
                />
                {/* Vintage overlay with gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
                
                {/* Retro text overlay */}
                <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8 lg:p-12">
                  <div className="text-center text-white max-w-4xl">
                    {/* Collection name with retro typography */}
                    <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 lg:mb-6 tracking-wide">
                      <span className="inline-block bg-black/60 px-3 py-1 sm:px-4 sm:py-2 border-2 border-white/30">
                        {collection.name}
                      </span>
                    </h1>
                    
                    {/* Description with vintage styling */}
                    {collection.description && (
                      <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/95 max-w-2xl mx-auto mb-4 sm:mb-6 font-medium leading-relaxed">
                        <span className="inline-block bg-black/50 px-2 py-1 border border-white/20">
                          {collection.description}
                        </span>
                      </p>
                    )}
                    
                    {/* Product count with retro badge */}
                    <div className="inline-flex items-center bg-black/70 border-2 border-white/40 px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider uppercase">
                      <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                      {totalCount} {totalCount === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
        {/* Fallback header for collections without images - Retro styled */}
        {!collection.imageUrl && (
          <header className="py-8 sm:py-12">
            <div className="relative mx-4 sm:mx-6 lg:mx-8">
              {/* Retro frame for text-only header */}
              <div className="relative border-2 border-black shadow-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-8 sm:p-12">
                <div className="text-center">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4 tracking-wide">
                    <span className="inline-block bg-black text-white px-4 py-2 border-2 border-black">
                      {collection.name}
                    </span>
                  </h1>
                  <div className="inline-flex items-center bg-black text-white px-4 py-2 text-sm font-semibold tracking-wider uppercase border-2 border-black">
                    <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                    {totalCount} {totalCount === 1 ? 'item' : 'items'}
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

      <section className="min-h-[60vh]">
        {products.length === 0 ? (
          <div className="rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-700">No products found in this collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const price =
                product.minPrice !== null && product.maxPrice !== null && product.minPrice !== product.maxPrice
                  ? formatPriceRange(product.minPrice, product.maxPrice)
                  : product.minPrice !== null
                  ? formatPrice(product.minPrice)
                  : undefined;
              
              return (
                <Card
                  key={product.id}
                  title={product.name}
                  subtitle={product.subtitle ?? undefined}
                  imageSrc={product.imageUrl ?? "/shoes/shoe-1.jpg"}
                  imageUrls={product.imageUrls}
                  price={price}
                  href={`/products/${product.id}`}
                  className="w-full"
                />
              );
            })}
          </div>
        )}
      </section>
      </div>
    </main>
  );
}
