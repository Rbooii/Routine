"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { productSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ── Get all products for the current user ────
export async function getProducts() {
  const userId = await getUserId();
  return prisma.product.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// ── Create a new product ─────────────────────
export async function createProduct(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const userId = await getUserId();

  const data = {
    name: formData.get("name") as string,
    brand: (formData.get("brand") as string) || undefined,
    category: formData.get("category") as string,
    description: (formData.get("description") as string) || undefined,
    ingredients: ((formData.get("ingredients") as string) || "")
      .split(",")
      .map((i) => i.trim().toLowerCase())
      .filter(Boolean),
  };

  const validated = productSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors.map((e) => e.message).join(". ") };
  }

  await prisma.product.create({
    data: {
      ...validated.data,
      userId,
    },
  });

  revalidatePath("/products");
  revalidatePath("/routines");
  return { success: true };
}

// ── Update a product ─────────────────────────
export async function updateProduct(
  id: string,
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const userId = await getUserId();

  const data = {
    name: formData.get("name") as string,
    brand: (formData.get("brand") as string) || undefined,
    category: formData.get("category") as string,
    description: (formData.get("description") as string) || undefined,
    ingredients: ((formData.get("ingredients") as string) || "")
      .split(",")
      .map((i) => i.trim().toLowerCase())
      .filter(Boolean),
  };

  const validated = productSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors.map((e) => e.message).join(". ") };
  }

  await prisma.product.update({
    where: { id, userId },
    data: validated.data,
  });

  revalidatePath("/products");
  return { success: true };
}

// ── Delete a product ─────────────────────────
export async function deleteProduct(id: string) {
  const userId = await getUserId();
  await prisma.product.delete({ where: { id, userId } });
  revalidatePath("/products");
  revalidatePath("/routines");
}

// ── Check ingredient conflicts ───────────────
export async function checkConflicts(ingredients: string[]) {
  const normalized = ingredients.map((i) => i.toLowerCase().trim());

  const conflicts = await prisma.ingredientConflict.findMany({
    where: {
      OR: [
        {
          ingredientA: { in: normalized },
          ingredientB: { in: normalized },
        },
        {
          ingredientA: { in: normalized },
          ingredientB: { in: normalized },
        },
      ],
    },
  });

  return conflicts;
}
