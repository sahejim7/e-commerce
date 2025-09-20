import { notFound } from "next/navigation";
import { getProductForEdit, updateProduct } from "@/lib/actions/admin/productActions";
import ProductForm from "@/components/admin/ProductForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = await params;
  const product = await getProductForEdit(resolvedParams.id);

  if (!product) {
    notFound();
  }

  // Create a bound server action
  const boundUpdateProduct = updateProduct.bind(null, resolvedParams.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
          <p className="text-gray-600">
            Update product information and variants
          </p>
        </CardHeader>
        <CardContent>
          <ProductForm 
            product={product} 
            action={boundUpdateProduct} 
            isEditing={true} 
          />
        </CardContent>
      </Card>
    </div>
  );
}

