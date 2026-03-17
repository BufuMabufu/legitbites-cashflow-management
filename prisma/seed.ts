// =============================================================================
// Database Seed Script
// =============================================================================
// Seeds the database with:
// 1. Default categories for a culinary business
// 2. Default user accounts (via Supabase Auth Admin API + Prisma)
//
// Run with: npx prisma db seed
//
// PREREQUISITES:
// - .env must have valid SUPABASE_SERVICE_ROLE_KEY (for creating auth users)
// - .env must have valid NEXT_PUBLIC_SUPABASE_URL
// - .env must have valid DATABASE_URL
// =============================================================================

import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Create Supabase Admin client using Service Role Key
// WHY service role key? The anon key can only sign up users (with email
// confirmation flow). The service role key lets us create users directly
// without email verification — perfect for seeding test accounts.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// =========================================================================
// Default Categories
// =========================================================================
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

// =========================================================================
// Default Users
// =========================================================================
const DEFAULT_USERS = [
  {
    email: "hani@legitbites.com",
    password: "admin123",
    name: "Hani",
    role: Role.OWNER,
  },
  {
    email: "caca@legitbites.com",
    password: "staf123",
    name: "Caca",
    role: Role.STAFF,
  },
  {
    email: "fardan@legitbites.com",
    password: "staf123",
    name: "Fardan",
    role: Role.STAFF,
  },
  {
    email: "revan@legitbites.com",
    password: "admin123",
    name: "Revan Admin",
    role: Role.ADMIN,
  },
];

async function main() {
  // --- Seed Categories ---
  console.log("🌱 Seeding categories...");
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`  ✅ ${category.type === "INCOME" ? "💰" : "💸"} ${category.name}`);
  }

  // --- Seed Users ---
  console.log("\n👤 Seeding users...");
  for (const userData of DEFAULT_USERS) {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
          app_metadata: { role: userData.role } // Inject role into JWT
        });

      // Also set the role explicitly via updateUser to bypass Supabase schema restrictions if any
      if (authData.user?.id) {
        await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
          app_metadata: { role: userData.role }
        });
      }

    if (authError || !authData.user?.id) {
      // If user already exists, fetch their ID instead
      if (authError?.message?.includes("already been registered")) {
        console.log(`  ⏭️  ${userData.name} (${userData.email}) — sudah ada di Auth`);

        // Try to find existing auth user by email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(
          (u) => u.email === userData.email
        );

        if (existing) {
          // Upsert to Prisma with the existing auth ID
          await prisma.user.upsert({
            where: { id: existing.id },
            update: { name: userData.name, role: userData.role },
            create: {
              id: existing.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
            },
          });
          console.log(`  ✅ ${userData.role === "OWNER" ? "👑" : "👤"} ${userData.name} — synced ke database`);
        }
        continue;
      }

      console.error(`  ❌ Gagal buat ${userData.name}:`, authError?.message || "User ID not returned");
      continue;
    }

    // Step 2: Create corresponding user in our Prisma database
    if (authData.user) {
      await prisma.user.upsert({
        where: { id: authData.user.id },
        update: { name: userData.name, role: userData.role },
        create: {
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        },
      });
      console.log(`  ✅ ${userData.role === "OWNER" ? "👑" : "👤"} ${userData.name} (${userData.email}) — ${userData.role}`);
    }
  }

  console.log("\n✨ Seeding selesai!");
  console.log("\n📋 Akun yang bisa digunakan:");
  console.log("   ┌───────────┬──────────────────────────┬───────────┬─────────┐");
  console.log("   │ Nama      │ Email                    │ Password  │ Role    │");
  console.log("   ├───────────┼──────────────────────────┼───────────┼─────────┤");
  console.log("   │ Hani      │ hani@legitbites.com      │ admin123  │ OWNER   │");
  console.log("   │ Caca      │ caca@legitbites.com      │ staf123   │ STAFF   │");
  console.log("   │ Fardan    │ fardan@legitbites.com    │ staf123   │ STAFF   │");
  console.log("   │ Revan     │ revan@legitbites.com     │ admin123  │ ADMIN   │");
  console.log("   └───────────┴──────────────────────────┴───────────┴─────────┘");
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
