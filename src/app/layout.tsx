import type { Metadata } from "next";
import { Jost, Turret_Road } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const turretRoad = Turret_Road({
  variable: "--font-turret-road",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | SecretLace',
    default: 'SecretLace - The best fashion is only here'
  },
  description: "The best fashion is only here - Discover premium clothing and apparel at SecretLace. Shop the latest trends in fashion with our curated collection.",
  keywords: ["fashion", "clothing", "apparel", "style", "trends", "SecretLace"],
  authors: [{ name: "SecretLace" }],
  creator: "SecretLace",
  publisher: "SecretLace",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://secretlace.shop',
    siteName: 'SecretLace',
    title: 'SecretLace - The best fashion is only here',
    description: 'The best fashion is only here - Discover premium clothing and apparel at SecretLace. Shop the latest trends in fashion with our curated collection.',
    images: [
      {
        url: 'https://secretlace.shop/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SecretLace - The best fashion is only here',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecretLace - The best fashion is only here',
    description: 'The best fashion is only here - Discover premium clothing and apparel at SecretLace.',
    images: ['https://secretlace.shop/og-image.jpg'],
  },
  verification: {
    google: 'your-google-verification-code',
  },
  icons: {
    icon: '/assets/favicon.ico',
    shortcut: '/assets/favicon.ico',
    apple: '/assets/favicon.ico',
  },
};

export default function RootShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jost.variable} ${turretRoad.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
