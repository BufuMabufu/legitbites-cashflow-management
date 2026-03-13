// =============================================================================
// Transaction Server Actions
// =============================================================================
// Handles creating transactions. Both OWNER and STAFF can create transactions.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Creates a new transaction (income or expense).
 *
 * WHY validate everything server-side?
 * Client-side validation improves UX, but server-side validation is the
 * security boundary. A malicious user could bypass client checks easily.
 */
export async function createTransaction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Anda harus login untuk mencatat transaksi." };
  }

  const amountStr = formData.get("amount") as string;
  const type = formData.get("type") as string;
  const categoryId = formData.get("categoryId") as string;
  const dateStr = formData.get("date") as string;
  const description = (formData.get("description") as string)?.trim() || null;

  // --- Validation ---
  if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
    return { error: "Jumlah harus berupa angka lebih dari 0." };
  }

  if (type !== "INCOME" && type !== "EXPENSE") {
    return { error: "Tipe transaksi tidak valid." };
  }

  if (!categoryId) {
    return { error: "Kategori wajib dipilih." };
  }

  if (!dateStr) {
    return { error: "Tanggal wajib diisi." };
  }

  // WHY verify the category exists AND matches the transaction type?
  // Prevents data inconsistency — e.g., recording an expense under
  // an income category would make reports inaccurate.
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { type: true },
  });

  if (!category) {
    return { error: "Kategori tidak ditemukan." };
  }

  if (category.type !== type) {
    return { error: "Kategori tidak sesuai dengan tipe transaksi." };
  }

  const amount = parseFloat(amountStr);
  const date = new Date(dateStr);

  await prisma.transaction.create({
    data: {
      amount,
      type: type as "INCOME" | "EXPENSE",
      date,
      description,
      categoryId,
      userId: user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  redirect("/transactions");
}
