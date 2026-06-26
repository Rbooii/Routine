"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/lib/actions/product-actions";
import { Package, Trash2, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";

interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  description: string | null;
  ingredients: string[];
}

const categoryEmoji: Record<string, string> = {
  CLEANSER: "🧴",
  TONER: "💧",
  SERUM: "✨",
  MOISTURIZER: "🧊",
  SUNSCREEN: "☀️",
  EXFOLIANT: "🫧",
  MASK: "🎭",
  EYE_CREAM: "👁️",
  LIP_CARE: "💋",
  TREATMENT: "💉",
  SPOT_TREATMENT: "🎯",
  PRESCRIPTION: "💊",
  OTHER: "📦",
};

export function ProductList({ products }: { products: Product[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteProduct(id);
      toast.success(`"${name}" deleted`);
    });
  }

  if (products.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Add your skincare products to start building routines. You can add
            ingredients for conflict detection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {products.map((product) => (
        <Card key={product.id} className="group hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {categoryEmoji[product.category] || "📦"}
                  </span>
                  <div>
                    <h3 className="font-medium text-sm">{product.name}</h3>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground">
                        {product.brand}
                      </p>
                    )}
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] mt-2">
                  {product.category.replace("_", " ")}
                </Badge>

                {product.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.ingredients.slice(0, 5).map((ing) => (
                      <Badge
                        key={ing}
                        variant="secondary"
                        className="text-[10px] py-0"
                      >
                        <FlaskConical className="h-2 w-2 mr-0.5" />
                        {ing}
                      </Badge>
                    ))}
                    {product.ingredients.length > 5 && (
                      <Badge variant="secondary" className="text-[10px] py-0">
                        +{product.ingredients.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={() => handleDelete(product.id, product.name)}
                disabled={isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
