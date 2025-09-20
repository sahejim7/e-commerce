import React from 'react';
import { Card } from '@/components';
import { getAllProducts } from '@/lib/actions/product';
import { EmblaCarousel } from '@/components/ui/embla-carousel';
import { formatNewArrivalsPrice } from '@/lib/utils/price';

export default async function NewArrivals() {
  // Fetch the 9 most recent products
  const { products } = await getAllProducts({ 
    search: '', 
    genderSlugs: [], 
    brandSlugs: [], 
    categorySlugs: [], 
    sizeSlugs: [], 
    colorSlugs: [], 
    priceMin: undefined, 
    priceMax: undefined, 
    priceRanges: [], 
    sort: 'newest', 
    page: 1, 
    limit: 9 
  });

  return (
    <section className="w-full bg-white py-12 px-4 lg:px-12">
      <div className="max-w-[1344px] mx-auto">
        {/* Section Header */}
        <div className="mb-9">
          <h2 className="text-[20px] font-medium text-[#111111] leading-[1.25]">
            NEW ARRIVALS
          </h2>
        </div>
        
        {/* Product Carousel - All devices: Horizontal scroll with auto-scroll */}
        <EmblaCarousel 
          autoScrollInterval={4000}
          pauseOnHover={true}
          loop={true}
          className="w-full"
        >
          {products.map((product, index) => {
            const price = formatNewArrivalsPrice(
              product.minPrice,
              product.maxPrice,
              product.minSalePrice,
              product.maxSalePrice
            );
            
            return (
              <Card
                key={product.id}
                title={product.name}
                imageSrc={product.imageUrl ?? "/shoes/shoe-1.jpg"}
                imageUrls={product.imageUrls}
                price={price}
                href={`/products/${product.id}`}
                badge={{ label: "New", tone: "red" }}
                className="w-[240px] sm:w-[260px] lg:w-[320px]"
              />
            );
          })}
        </EmblaCarousel>
      </div>
    </section>
  );
}

