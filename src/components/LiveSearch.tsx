"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getLiveSearchResults, type LiveSearchResult } from "@/lib/actions/product";

export default function LiveSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LiveSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const router = useRouter();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await getLiveSearchResults(query);
        setResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setResults([]);
        setShowResults(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query]);

  // Handle form submission (Enter key)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
      setQuery("");
    }
  };

  // Handle result click
  const handleResultClick = (productId: string) => {
    setShowResults(false);
    setQuery("");
    router.push(`/products/${productId}`);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsFocused(true);
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay hiding results to allow for clicks on results
    setTimeout(() => {
      setShowResults(false);
    }, 150);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-72">
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full h-11 bg-gray-50 border border-gray-300 rounded-lg pl-4 pr-12 text-sm focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
          <Search className="w-4 h-4 text-gray-500" />
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (isFocused || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                >
                  {result.imageUrl ? (
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <Image
                        src={result.imageUrl}
                        alt={result.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
