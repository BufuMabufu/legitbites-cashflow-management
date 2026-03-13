// =============================================================================
// Prisma Configuration
// =============================================================================
// Configures the Prisma CLI with the schema location and datasource URL.
// Uses `dotenv/config` to automatically load environment variables from `.env`.
// =============================================================================
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // WHY use DIRECT_URL instead of DATABASE_URL here?
    // Prisma Migrate needs a direct (non-pooled) connection to perform
    // schema migrations. The pooled `DATABASE_URL` (via PgBouncer) doesn't
    // support the DDL operations required by migrations.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
