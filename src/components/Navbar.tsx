"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Search, ShoppingBag, Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import { getCollections, type CollectionOption } from "@/lib/actions/collectionActions";
import { getFilterOptions } from "@/lib/actions/filterActions";
import LiveSearch from "./LiveSearch";
import UserMenu from "./UserMenu";

// Categories will be fetched dynamically from the database

const NAV_LINKS = [
  { label: "MEN", href: "/products?gender=men" },
  { label: "WOMEN", href: "/products?gender=women" },
  { label: "KIDS", href: "/products?gender=unisex" },
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [categories, setCategories] = useState<Array<{name: string, slug: string}>>([]);
  const [expandedSections, setExpandedSections] = useState<{
    categories: boolean;
    collections: boolean;
  }>({
    categories: false,
    collections: false,
  });
  const { getItemCount } = useCartStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collectionsData, filterOptions] = await Promise.all([
          getCollections(),
          getFilterOptions()
        ]);
        setCollections(collectionsData);
        setCategories(filterOptions.categories);
      } catch (error) {
        console.error("Failed to fetch navigation data:", error);
      }
    };
    
    fetchData();
  }, []);

  const toggleSection = (section: 'categories' | 'collections') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const closeMobileMenu = () => {
    setOpen(false);
    // Reset expanded sections when closing mobile menu
    setExpandedSections({
      categories: false,
      collections: false,
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo and Brand - Left (Integrated) */}
          <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
            <div className="relative w-12 h-12">
              <Image 
                src="/assets/logo.png" 
                alt="SECRETLACE Logo" 
                width={48} 
                height={48} 
                priority 
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 border-2 border-gray-800 rounded-sm"></div>
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-wide font-serif">
              SECRETLACE
            </span>
          </Link>

          {/* Desktop Navigation - Center (Hidden on mobile) */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Navigation Links */}
            <NavigationMenu className="ml-8 relative z-50">
              <NavigationMenuList>
                {NAV_LINKS.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={link.href}
                        className="bg-transparent hover:bg-gray-50 text-gray-900 font-semibold text-base px-4 py-2 rounded-md transition-colors hover:underline"
                      >
                        {link.label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Collections Dropdown - Separate NavigationMenu */}
            <NavigationMenu className="ml-2 relative z-50">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-gray-50 text-gray-900 font-semibold text-base px-4 py-2">
                    COLLECTIONS
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-2 p-4">
                      {collections.map((collection) => (
                        <li key={collection.slug}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={`/collections/${collection.slug}`}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900"
                            >
                              <div className="text-sm font-medium leading-none">
                                {collection.name}
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Live Search */}
            <div className="w-72">
              <LiveSearch />
            </div>
          </div>

          {/* Desktop: Cart, User Menu and Mobile Menu - Right */}
          <div className="hidden lg:flex items-center space-x-6 ml-8">
            <Link 
              href="/cart" 
              className="relative p-2 text-gray-900 hover:text-gray-600 transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Link>
            
            <UserMenu />
          </div>

          {/* Mobile: Cart and Menu Button - Right */}
          <div className="flex lg:hidden items-center space-x-4">
            <Link 
              href="/cart" 
              className="relative p-2 text-gray-900 hover:text-gray-600 transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="p-2 text-gray-900 hover:text-gray-600 transition-colors"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`border-t border-gray-200 lg:hidden transition-all duration-300 ${
          open ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-4 py-4 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {/* Mobile Search */}
          <div className="w-full">
            <LiveSearch />
          </div>


          {/* Mobile Collections */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('collections')}
              className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <span>COLLECTIONS</span>
              {expandedSections.collections ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {expandedSections.collections && (
              <div className="space-y-1 ml-2">
                {collections.map((collection) => (
                  <Link
                    key={collection.slug}
                    href={`/collections/${collection.slug}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    {collection.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Navigation Links */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900 px-2">SHOP</div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile User Menu and Cart Links */}
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <div className="px-4 py-2">
              <UserMenu />
            </div>
            <Link 
              href="/cart" 
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setOpen(false)}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              My Cart ({getItemCount()})
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
