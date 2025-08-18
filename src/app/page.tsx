import React from "react";
import { Card } from "@/components";

const products = [
  {
    id: 1,
    title: "Air Max Pulse",
    price: 149.99,
    imageSrc: "/shoes/shoe-1.jpg",
    badge: { label: "New", tone: "orange" as const },
  },
  {
    id: 2,
    title: "Air Zoom Pegasus",
    price: 129.99,
    imageSrc: "/shoes/shoe-2.webp",
    badge: { label: "Hot", tone: "red" as const },
  },
  {
    id: 3,
    title: "InfinityRN 4",
    price: 159.99,
    imageSrc: "/shoes/shoe-3.webp",
    badge: { label: "Trending", tone: "green" as const },
  },
  {
    id: 4,
    title: "Metcon 9",
    price: 139.99,
    imageSrc: "/shoes/shoe-4.webp",
  },
];

const Home = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="py-8">
        <h1 className="text-heading-1 font-jost">Nike</h1>
      </section>

      <section aria-labelledby="latest" className="pb-12">
        <h2 id="latest" className="mb-6 text-heading-3 text-[--color-dark-900]">
          Latest shoes
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} title={p.title} imageSrc={p.imageSrc} price={p.price} badge={p.badge} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;
