import { Card } from "@/components";
import Filters from "@/components/Filters";
import Sort from "@/components/Sort";

type SearchParams = Record<string, string | string[] | undefined>;

type Product = {
  id: string;
  name: string;
  subtitle: string;
  meta?: string | string[];
  gender: "men" | "women" | "unisex";
  sizes: string[];
  colors: string[];
  price: number;
  image: string;
  createdAt: string;
  badge?: { label: string; tone?: "red" | "green" | "orange" };
};

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Nike Air Max Pulse",
    subtitle: "Men's Shoes",
    gender: "men",
    sizes: ["M", "L", "XL"],
    colors: ["white", "black"],
    price: 149.99,
    meta: "6 Colour",
    image: "/shoes/shoe-1.jpg",
    createdAt: "2025-08-01T00:00:00.000Z",
    badge: { label: "Best Seller", tone: "orange" },
  },
  {
    id: "2",
    name: "Nike Air Zoom Pegasus",
    subtitle: "Women's Shoes",
    gender: "women",
    sizes: ["S", "M", "L"],
    colors: ["red", "white"],
    price: 129.99,
    meta: "4 Colour",
    image: "/shoes/shoe-2.webp",
    createdAt: "2025-07-20T00:00:00.000Z",
    badge: { label: "Extra 20% off", tone: "green" },
  },
  {
    id: "3",
    name: "Nike InfinityRN 4",
    subtitle: "Unisex Shoes",
    gender: "unisex",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["black", "green"],
    price: 159.99,
    meta: "6 Colour",
    image: "/shoes/shoe-3.webp",
    createdAt: "2025-07-28T00:00:00.000Z",
    badge: { label: "Sustainable Materials", tone: "green" },
  },
  {
    id: "4",
    name: "Nike Metcon 9",
    subtitle: "Men's Training Shoes",
    gender: "men",
    sizes: ["M", "L", "XL"],
    colors: ["grey", "black"],
    price: 139.99,
    meta: "3 Colour",
    image: "/shoes/shoe-4.webp",
    createdAt: "2025-06-10T00:00:00.000Z",
    badge: { label: "New", tone: "orange" },
  },
  {
    id: "5",
    name: "Nike Blazer Low '77 Jumbo",
    subtitle: "Women's Shoes",
    gender: "women",
    sizes: ["S", "M", "L"],
    colors: ["white", "blue"],
    price: 98.3,
    meta: "1 Colour",
    image: "/shoes/shoe-3.webp",
    createdAt: "2025-08-10T00:00:00.000Z",
    badge: { label: "Best Seller", tone: "red" },
  },
];

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function getParamArray(sp: SearchParams, key: string): string[] {
  const v = (sp[key] as string | string[] | undefined) ?? (sp[`${key}[]`] as string | string[] | undefined);
  return toArray(v);
}

function matchesRange(price: number, ranges: string[]): boolean {
  if (ranges.length === 0) return true;
  return ranges.some((r) => {
    const [minStr, maxStr] = r.split("-");
    const min = minStr ? Number(minStr) : 0;
    const max = maxStr ? Number(maxStr) : Infinity;
    return price >= min && price <= max;
  });
}

function applyFilters(data: Product[], params: SearchParams): Product[] {
  const genders = getParamArray(params as SearchParams, "gender") as Product["gender"][];
  const sizes = getParamArray(params as SearchParams, "size");
  const colors = getParamArray(params as SearchParams, "color");
  const priceRanges = getParamArray(params as SearchParams, "price");

  return data.filter((p) => {
    const genderOk = genders.length ? genders.includes(p.gender) : true;
    const sizeOk = sizes.length ? sizes.some((s) => p.sizes.includes(s)) : true;
    const colorOk = colors.length ? colors.some((c) => p.colors.includes(c)) : true;
    const priceOk = matchesRange(p.price, priceRanges);
    return genderOk && sizeOk && colorOk && priceOk;
  });
}

function applySort(data: Product[], sort?: string): Product[] {
  const list = [...data];
  switch (sort) {
    case "price_desc":
      return list.sort((a, b) => b.price - a.price);
    case "price_asc":
      return list.sort((a, b) => a.price - b.price);
    case "newest":
      return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    case "featured":
    default:
      return list;
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const filtered = applyFilters(MOCK_PRODUCTS, sp);
  const sorted = applySort(filtered, (sp.sort as string) || "featured");

  const activeBadges: string[] = [];
  getParamArray(sp, "gender").forEach((g) => activeBadges.push(g[0].toUpperCase() + g.slice(1)));
  getParamArray(sp, "size").forEach((s) => activeBadges.push(`Size: ${s}`));
  getParamArray(sp, "color").forEach((c) => activeBadges.push(c[0].toUpperCase() + c.slice(1)));
  getParamArray(sp, "price").forEach((p) => {
    const [min, max] = String(p).split("-");
    const label =
      min && max ? `$${min} - $${max}` : min && !max ? `Over $${min}` : `$0 - $${max}`;
    activeBadges.push(label);
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between py-6">
        <h1 className="text-heading-3 text-dark-900">New ({sorted.length})</h1>
        <Sort />
      </header>

      {activeBadges.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeBadges.map((b, i) => (
            <span
              key={`${b}-${i}`}
              className="rounded-full border border-light-300 px-3 py-1 text-caption text-dark-900"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <Filters />
        <div>
          {sorted.length === 0 ? (
            <div className="rounded-lg border border-light-300 p-8 text-center">
              <p className="text-body text-dark-700">No products match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-6">
              {sorted.map((p) => (
                <Card
                  key={p.id}
                  title={p.name}
                  subtitle={p.subtitle}
                  meta={p.meta}
                  imageSrc={p.image}
                  price={p.price}
                  badge={p.badge}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
