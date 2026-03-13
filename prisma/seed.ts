// =============================================================================
// Database Seed Script
// =============================================================================
// Seeds the database with default categories for a culinary business.
//
// Run with: npx prisma db seed
// (Requires `prisma.seed` config in package.json)
//
// WHY seed default categories?
// New OWNER users shouldn't have to manually create common categories.
// Pre-populating saves setup time and ensures data consistency.
// =============================================================================

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Default categories for a culinary business
const DEFAULT_CATEGORIES = [
  // --- Income categories ---
  { name: "Penjualan Harian", type: "INCOME" as const },
  { name: "Penjualan Online", type: "INCOME" as const },
  { name: "Catering / Pesanan", type: "INCOME" as const },
  { name: "Pemasukan Lain-lain", type: "INCOME" as const },

  // --- Expense categories ---
  { name: "Bahan Baku", type: "EXPENSE" as const },
  { name: "Gaji Karyawan", type: "EXPENSE" as const },
  { name: "Listrik & Air", type: "EXPENSE" as const },
  { name: "Sewa Tempat", type: "EXPENSE" as const },
  { name: "Gas & Bahan Bakar", type: "EXPENSE" as const },
  { name: "Perlengkapan Dapur", type: "EXPENSE" as const },
  { name: "Transport / Ongkir", type: "EXPENSE" as const },
  { name: "Pengeluaran Lain-lain", type: "EXPENSE" as const },
];

async function main() {
  console.log("🌱 Seeding database...");

  for (const category of DEFAULT_CATEGORIES) {
    // WHY upsert instead of create?
    // Safe to run multiple times — won't fail if categories already exist.
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`  ✅ ${category.type === "INCOME" ? "💰" : "💸"} ${category.name}`);
  }

  console.log("\n✨ Seeding selesai!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
