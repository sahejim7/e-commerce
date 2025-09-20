import { createProduct } from "@/lib/actions/admin/productActions";
import ProductForm from "@/components/admin/ProductForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Product</CardTitle>
          <p className="text-gray-600">
            Add a new product to your catalog
          </p>
        </CardHeader>
        <CardContent>
          <ProductForm action={createProduct} isEditing={false} />
        </CardContent>
      </Card>
    </div>
  );
}

