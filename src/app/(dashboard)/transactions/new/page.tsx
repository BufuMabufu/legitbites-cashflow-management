// =============================================================================
// New Transaction Page — Server Component wrapper
// =============================================================================
// Fetches categories from the database and passes them to the form component.
// =============================================================================

import { prisma } from "@/lib/prisma";
import { NewTransactionForm } from "./new-transaction-form";

export default async function NewTransactionPage() {
  const categories = await prisma.category.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: { deletedAt: null } as any,
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true },
  });

  return <NewTransactionForm categories={categories} />;
}
