import Image from "next/image";

// Mock data for testing the retro hero banner
const mockCollection = {
  id: "test-collection",
  name: "Best Sellers",
  slug: "best-sellers",
  description: "Discover our most popular and highly-rated products that customers love.",
  imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
  isFeatured: true,
};

const mockProducts = [
  {
    id: "1",
    name: "Classic White T-Shirt",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    imageUrls: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"],
    minPrice: 29.99,
    maxPrice: 29.99,
    createdAt: new Date(),
    subtitle: "Men's Apparel"
  },
  {
    id: "2", 
    name: "Denim Jeans",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    imageUrls: ["https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"],
    minPrice: 79.99,
    maxPrice: 89.99,
    createdAt: new Date(),
    subtitle: "Men's Apparel"
  },
  {
    id: "3",
    name: "Summer Dress",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    imageUrls: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"],
    minPrice: 59.99,
    maxPrice: 59.99,
    createdAt: new Date(),
    subtitle: "Women's Apparel"
  }
];

export default function TestHeroPage() {
  const collection = mockCollection;
  const products = mockProducts;
  const totalCount = products.length;
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Retro Hero Banner Section */}
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
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/95 max-w-2xl mx-auto mb-4 sm:mb-6 font-medium leading-relaxed">
                    <span className="inline-block bg-black/50 px-2 py-1 border border-white/20">
                      {collection.description}
                    </span>
                  </p>
                  
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

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-gray-600">
            This is a test page to demonstrate the new retro hero banner design.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-black">
              <div className="aspect-square relative">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{product.subtitle}</p>
                <p className="font-bold text-lg">
                  ${product.minPrice?.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
