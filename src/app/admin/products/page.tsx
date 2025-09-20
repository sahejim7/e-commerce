import { getAdminProducts } from "@/lib/actions/admin/productActions";
import ProductsTable from "@/components/admin/ProductsTable";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1");
  const search = resolvedSearchParams.search || "";
  
  const productsData = await getAdminProducts(page, 20, search);

  return (
    <ProductsTable 
      initialData={productsData} 
      search={search} 
    />
  );
}

