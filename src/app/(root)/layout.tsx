"use client";

import { Navbar, Footer, CartInitializer } from "@/components";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <CartInitializer />
      <Navbar />
      {children}
      {pathname !== '/' && <Footer />}
      <Toaster position="top-right" richColors />
    </>
  );
}
