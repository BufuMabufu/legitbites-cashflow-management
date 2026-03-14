// =============================================================================
// Category Page — Server Component wrapper
// =============================================================================
// Fetches categories server-side and passes them to the client component.
// This pattern lets us use Prisma (server-only) while having interactive UI.
// =============================================================================

import { prisma } from "@/lib/prisma";
import { CategoryPageClient } from "./category-page-client";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true },
  });

  return <CategoryPageClient categories={categories} />;
}
