import React from "react";
import { HeroSection, NewArrivals, CategoryGrid, NewsletterSignUp } from "@/components/landing";
import { LandingFooter, Footer } from "@/components";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover the Latest Trends in Fashion",
  description: "The best fashion is only here - Explore SecretLace's curated collection of premium clothing and apparel. Discover the latest trends in fashion with our exclusive designs.",
  keywords: ["fashion trends", "latest fashion", "premium clothing", "style", "apparel", "SecretLace"],
  openGraph: {
    title: "Discover the Latest Trends in Fashion",
    description: "The best fashion is only here - Explore SecretLace's curated collection of premium clothing and apparel. Discover the latest trends in fashion with our exclusive designs.",
    url: "https://secretlace.shop",
    siteName: "SecretLace",
    images: [
      {
        url: "https://secretlace.shop/hero-image.jpg",
        width: 1200,
        height: 630,
        alt: "SecretLace - Discover the Latest Trends in Fashion",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover the Latest Trends in Fashion",
    description: "The best fashion is only here - Explore SecretLace's curated collection of premium clothing and apparel.",
    images: ["https://secretlace.shop/hero-image.jpg"],
  },
};

const Home = async () => {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <HeroSection />
      
      {/* New Arrivals Section */}
      <NewArrivals />
      
      {/* Category Grid Section */}
      <CategoryGrid />
      
      {/* Newsletter Sign-up Section */}
      <NewsletterSignUp />
      
      {/* Landing Page Footer */}
      <LandingFooter />
      
      {/* Global Footer */}
      <Footer />
    </main>
  );
};

export default Home;
