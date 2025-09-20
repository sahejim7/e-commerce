/**
 * Formats a price value as LKR currency
 * @param amount - The price value to format (number, string, null, or undefined)
 * @returns Formatted price string (e.g., "LKR 5,000.00")
 */
export function formatPrice(amount: number | string | null | undefined): string {
  const numberAmount = Number(amount);
  if (amount === null || amount === undefined || isNaN(numberAmount)) {
    return "LKR 0.00";
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberAmount);
}

/**
 * Formats a price range as LKR currency
 * @param min - The minimum price value
 * @param max - The maximum price value
 * @returns Formatted price range string (e.g., "LKR 5,000.00 - LKR 15,000.00")
 */
export function formatPriceRange(min: number | string | null | undefined, max: number | string | null | undefined): string {
  const minFormatted = formatPrice(min);
  const maxFormatted = formatPrice(max);
  
  if (min === null || min === undefined) return maxFormatted;
  if (max === null || max === undefined) return minFormatted;
  
  return `${minFormatted} - ${maxFormatted}`;
}

/**
 * Formats product price with sale price if available
 * @param minPrice - The minimum base price
 * @param maxPrice - The maximum base price  
 * @param minSalePrice - The minimum sale price
 * @param maxSalePrice - The maximum sale price
 * @returns Object with formatted prices for display
 */
export function formatProductPrice(
  minPrice: number | string | null | undefined,
  maxPrice: number | string | null | undefined,
  minSalePrice: number | string | null | undefined,
  maxSalePrice: number | string | null | undefined
): { basePrice: string; salePrice: string | null; hasSale: boolean } {
  const hasSale = (minSalePrice !== null && minSalePrice !== undefined) || 
                  (maxSalePrice !== null && maxSalePrice !== undefined);
  
  let basePrice: string;
  let salePrice: string | null = null;
  
  if (minPrice === maxPrice) {
    // Single price
    basePrice = formatPrice(minPrice);
    if (hasSale && minSalePrice === maxSalePrice) {
      salePrice = formatPrice(minSalePrice);
    } else if (hasSale && minSalePrice !== null && maxSalePrice !== null) {
      salePrice = formatPriceRange(minSalePrice, maxSalePrice);
    }
  } else {
    // Price range
    basePrice = formatPriceRange(minPrice, maxPrice);
    if (hasSale) {
      salePrice = formatPriceRange(minSalePrice, maxSalePrice);
    }
  }
  
  return { basePrice, salePrice, hasSale };
}

/**
 * Formats product price for NewArrivals - shows only single prices, no ranges
 * @param minPrice - The minimum base price
 * @param maxPrice - The maximum base price  
 * @param minSalePrice - The minimum sale price
 * @param maxSalePrice - The maximum sale price
 * @returns Object with formatted prices for display
 */
export function formatNewArrivalsPrice(
  minPrice: number | string | null | undefined,
  maxPrice: number | string | null | undefined,
  minSalePrice: number | string | null | undefined,
  maxSalePrice: number | string | null | undefined
): { basePrice: string; salePrice: string | null; hasSale: boolean } {
  const hasSale = (minSalePrice !== null && minSalePrice !== undefined) || 
                  (maxSalePrice !== null && maxSalePrice !== undefined);
  
  // Always use the minimum price for NewArrivals (no ranges)
  const basePrice = formatPrice(minPrice);
  const salePrice = hasSale ? formatPrice(minSalePrice) : null;
  
  return { basePrice, salePrice, hasSale };
}
