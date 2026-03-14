// =============================================================================
// Prisma Client Singleton (Prisma 7+)
// =============================================================================
// Creates a single PrismaClient instance and reuses it across hot-reloads
// in development. Without this pattern, Next.js dev server would create a new
// database connection on every file change, eventually exhausting the
// connection pool (Supabase free tier allows ~20 connections).
//
// Prisma 7 requires an explicit database adapter. We use the
// `@prisma/adapter-pg-worker` adapter which connects to PostgreSQL via the
// connection string in DATABASE_URL.
// =============================================================================

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Extend the global object type to include our cached Prisma instance.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Creates a PrismaClient instance with the PostgreSQL adapter.
 *
 * WHY use an adapter? Prisma 7 decoupled the database driver from the client.
 * This gives us control over connection pooling and lets us use edge-compatible
 * drivers when needed (e.g., for Vercel Edge Functions).
 */
function createPrismaClient(): PrismaClient {
  // WHY pass connectionString via PoolConfig? The adapter creates a pg.Pool
  // internally, connecting to Supabase's pooled endpoint (port 6543).
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

/**
 * Singleton PrismaClient instance.
 *
 * WHY a singleton? In development, Next.js clears the Node.js module cache
 * on every edit, but `globalThis` persists. By storing the client there, we
 * avoid creating duplicate connections on each hot-reload.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Only cache in `globalThis` during development to enable the singleton pattern.
// In production, the module-level variable is sufficient.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
