import { getProducts } from "@/lib/actions/product-actions";
import { ProductList } from "@/components/products/product-list";
import { AddProductDialog } from "@/components/products/add-product-dialog";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your skincare product library
          </p>
        </div>
        <AddProductDialog />
      </div>

      <ProductList products={products} />
    </div>
  );
}
