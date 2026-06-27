import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ── Seed Ingredient Conflicts ──────────────────
  // Known skincare ingredient incompatibilities
  const conflicts = [
    {
      ingredientA: "retinol",
      ingredientB: "aha",
      severity: "CRITICAL" as const,
      description:
        "Retinol + AHA (Alpha Hydroxy Acid) can cause severe irritation, redness, and peeling. Use on alternate nights or separate into AM/PM routines.",
    },
    {
      ingredientA: "retinol",
      ingredientB: "bha",
      severity: "HIGH" as const,
      description:
        "Retinol + BHA (Salicylic Acid) together can over-exfoliate and damage the skin barrier. Space them out by at least 30 minutes or use on different days.",
    },
    {
      ingredientA: "retinol",
      ingredientB: "vitamin c",
      severity: "HIGH" as const,
      description:
        "Retinol + Vitamin C (L-Ascorbic Acid) can destabilize each other and cause irritation. Use Vitamin C in the morning and retinol at night.",
    },
    {
      ingredientA: "retinol",
      ingredientB: "benzoyl peroxide",
      severity: "CRITICAL" as const,
      description:
        "Benzoyl peroxide oxidizes retinol, making it ineffective. Never layer these together — use on alternate nights.",
    },
    {
      ingredientA: "vitamin c",
      ingredientB: "niacinamide",
      severity: "LOW" as const,
      description:
        "Older research suggested these conflict, but modern formulations are generally safe together. Some sensitive skin may experience flushing.",
    },
    {
      ingredientA: "vitamin c",
      ingredientB: "aha",
      severity: "MEDIUM" as const,
      description:
        "Both are acidic and can lower skin pH too much when combined, causing irritation. Use Vitamin C in the morning and AHA at night.",
    },
    {
      ingredientA: "vitamin c",
      ingredientB: "bha",
      severity: "MEDIUM" as const,
      description:
        "Using both at the same time can cause excessive dryness and irritation. Separate into AM/PM for best results.",
    },
    {
      ingredientA: "aha",
      ingredientB: "bha",
      severity: "HIGH" as const,
      description:
        "Combining AHA + BHA can lead to over-exfoliation, sensitivity, and a compromised skin barrier. Use on alternate days.",
    },
    {
      ingredientA: "niacinamide",
      ingredientB: "aha",
      severity: "LOW" as const,
      description:
        "At high concentrations, combining these may cause temporary redness. Generally safe with buffered formulations.",
    },
    {
      ingredientA: "retinol",
      ingredientB: "glycolic acid",
      severity: "CRITICAL" as const,
      description:
        "Glycolic acid (an AHA) + retinol together causes excessive exfoliation, leading to raw, irritated skin. Never use simultaneously.",
    },
    {
      ingredientA: "hydroquinone",
      ingredientB: "benzoyl peroxide",
      severity: "HIGH" as const,
      description:
        "Benzoyl peroxide can oxidize hydroquinone, causing temporary dark staining on skin. Apply at different times of day.",
    },
    {
      ingredientA: "retinol",
      ingredientB: "lactic acid",
      severity: "HIGH" as const,
      description:
        "Lactic acid (an AHA) combined with retinol increases sensitivity and can cause chemical burns on sensitive skin types.",
    },
    {
      ingredientA: "copper peptides",
      ingredientB: "vitamin c",
      severity: "MEDIUM" as const,
      description:
        "Copper can oxidize Vitamin C, reducing the effectiveness of both ingredients. Use at different times of day.",
    },
    {
      ingredientA: "copper peptides",
      ingredientB: "retinol",
      severity: "MEDIUM" as const,
      description:
        "These active ingredients can interfere with each other's absorption. Best used on alternating days.",
    },
    {
      ingredientA: "tretinoin",
      ingredientB: "aha",
      severity: "CRITICAL" as const,
      description:
        "Tretinoin (prescription retinoid) + AHA is an extremely irritating combination that can cause severe peeling and damage.",
    },
    {
      ingredientA: "tretinoin",
      ingredientB: "bha",
      severity: "CRITICAL" as const,
      description:
        "Tretinoin + BHA together dramatically increases skin sensitivity and risk of chemical burns. Never combine.",
    },
    {
      ingredientA: "tretinoin",
      ingredientB: "benzoyl peroxide",
      severity: "CRITICAL" as const,
      description:
        "Benzoyl peroxide degrades tretinoin on contact, completely negating its effects. Must be used at different times.",
    },
  ];

  for (const conflict of conflicts) {
    await prisma.ingredientConflict.upsert({
      where: {
        ingredientA_ingredientB: {
          ingredientA: conflict.ingredientA,
          ingredientB: conflict.ingredientB,
        },
      },
      update: conflict,
      create: conflict,
    });
  }

  console.log(`✅ Seeded ${conflicts.length} ingredient conflicts`);
  console.log("🌱 Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
