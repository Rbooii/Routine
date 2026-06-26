"use client";

import { useState, useActionState } from "react";
import { createProduct } from "@/lib/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

const CATEGORIES = [
  { value: "CLEANSER", label: "🧴 Cleanser" },
  { value: "TONER", label: "💧 Toner" },
  { value: "SERUM", label: "✨ Serum" },
  { value: "MOISTURIZER", label: "🧊 Moisturizer" },
  { value: "SUNSCREEN", label: "☀️ Sunscreen" },
  { value: "EXFOLIANT", label: "🫧 Exfoliant" },
  { value: "MASK", label: "🎭 Mask" },
  { value: "EYE_CREAM", label: "👁️ Eye Cream" },
  { value: "LIP_CARE", label: "💋 Lip Care" },
  { value: "TREATMENT", label: "💉 Treatment" },
  { value: "SPOT_TREATMENT", label: "🎯 Spot Treatment" },
  { value: "PRESCRIPTION", label: "💊 Prescription" },
  { value: "OTHER", label: "📦 Other" },
];

export function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProduct, undefined);

  useEffect(() => {
    if (state?.success) {
      toast.success("Product added!");
      setOpen(false);
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>
            Add a skincare product to your library
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              name="name"
              placeholder="e.g., Niacinamide 10% + Zinc"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                name="brand"
                placeholder="e.g., The Ordinary"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select name="category" defaultValue="SERUM">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredients">Key Ingredients</Label>
            <Input
              id="ingredients"
              name="ingredients"
              placeholder="retinol, niacinamide, hyaluronic acid"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated. Used for conflict detection.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Any notes about this product..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isPending ? "Adding..." : "Add Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
