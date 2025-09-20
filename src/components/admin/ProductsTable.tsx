"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAdminProducts, deleteProduct, bulkDeleteProducts } from "@/lib/actions/admin/productActions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/utils/price";
import BulkProductActions from "./BulkProductActions";
import type { AdminProductListItem, PaginatedProducts } from "@/lib/actions/admin/productActions";

interface ProductsTableProps {
  initialData: PaginatedProducts;
  search: string;
}

export default function ProductsTable({ initialData, search }: ProductsTableProps) {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProductListItem[]>(initialData.products);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalProducts = initialData.totalCount;
  const currentPage = initialData.currentPage;
  const totalPages = initialData.totalPages;

  // Handle individual product selection
  const handleProductSelect = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds(prev => [...prev, productId]);
    } else {
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  // Handle select all products on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allProductIds = products.map(product => product.id);
      setSelectedProductIds(allProductIds);
    } else {
      setSelectedProductIds([]);
    }
  };

  // Handle individual product delete
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      const result = await deleteProduct(productId);
      
      if (result.success) {
        setSuccess("Product deleted successfully");
        // Remove from local state
        setProducts(prev => prev.filter(p => p.id !== productId));
        // Remove from selection if it was selected
        setSelectedProductIds(prev => prev.filter(id => id !== productId));
        // Refresh the page data
        router.refresh();
      } else {
        setError(result.error || "Failed to delete product");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Error deleting product:", error);
    }
  };

  // Handle bulk action completion
  const handleBulkActionComplete = () => {
    setSuccess("Bulk action completed successfully");
    // Refresh the page data
    router.refresh();
  };

  // Clear messages after a delay
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const selectedCount = selectedProductIds.length;
  const isAllSelected = selectedCount === products.length && products.length > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < products.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-2">
            Manage your product catalog
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            Create New Product
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card className="retro-card">
        <CardContent className="pt-6">
          <form method="GET" className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                name="search"
                placeholder="Search products..."
                defaultValue={search}
                className="retro-input"
              />
            </div>
            <Button type="submit" variant="secondary" className="retro-button">
              Search
            </Button>
            {search && (
              <Button asChild variant="outline" className="retro-button">
                <Link href="/admin/products">
                  Clear
                </Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Products Table */}
      <Card className="retro-card">
        {products.length === 0 ? (
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? "Try adjusting your search criteria." : "Get started by creating a new product."}
              </p>
              {!search && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/admin/products/new">
                      Create New Product
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        ) : (
          <>
            {/* Bulk Actions */}
            <BulkProductActions
              selectedProductIds={selectedProductIds}
              onSelectionChange={setSelectedProductIds}
              onBulkActionComplete={handleBulkActionComplete}
              totalProducts={products.length}
            />

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        id="select-all"
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={selectedProductIds.includes(product.id)}
                          onCheckedChange={(checked) => 
                            handleProductSelect(product.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.category?.name || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.brand?.name || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.variantCount} variant{product.variantCount !== 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.totalStock} units
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.minPrice && product.maxPrice ? (
                            Number(product.minPrice) === Number(product.maxPrice) ? (
                              formatPrice(product.minPrice)
                            ) : (
                              `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`
                            )
                          ) : (
                            "—"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isPublished ? "default" : "secondary"}>
                          {product.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {product.createdAt.toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/products/${product.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <CardContent className="flex items-center justify-between border-t">
                <div className="flex-1 flex justify-between sm:hidden">
                  {currentPage > 1 && (
                    <Button asChild variant="outline">
                      <Link href={`/admin/products?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}>
                        Previous
                      </Link>
                    </Button>
                  )}
                  {currentPage < totalPages && (
                    <Button asChild variant="outline">
                      <Link href={`/admin/products?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}>
                        Next
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * 20 + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 20, totalProducts)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalProducts}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      {currentPage > 1 && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/products?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}>
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        </Button>
                      )}
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            asChild
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                          >
                            <Link href={`/admin/products?page=${pageNum}${search ? `&search=${search}` : ''}`}>
                              {pageNum}
                            </Link>
                          </Button>
                        );
                      })}
                      
                      {currentPage < totalPages && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/products?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}>
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        </Button>
                      )}
                    </nav>
                  </div>
                </div>
              </CardContent>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
