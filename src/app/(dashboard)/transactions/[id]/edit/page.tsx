// =============================================================================
// Edit Transaction Page — Server Component wrapper
// =============================================================================
// Fetches the transaction and categories from the database and passes them to the form.
// Only OWNERs can access this page.
// =============================================================================

import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditTransactionForm } from "./edit-transaction-form";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    redirect("/transactions");
  }

  const { id } = await params;

  // Run queries in parallel for efficiency
  const [transaction, categories] = await Promise.all([
    prisma.transaction.findUnique({
      where: { id },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    })
  ]);

  if (!transaction) {
    notFound();
  }

  return <EditTransactionForm transaction={transaction} categories={categories} />;
}
