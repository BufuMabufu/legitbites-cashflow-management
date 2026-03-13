// =============================================================================
// Category Management — Server Actions (OWNER only)
// =============================================================================
// CRUD operations for income/expense categories.
//
// Security: Every action verifies the user's role is OWNER before proceeding.
// WHY server-side role check AND middleware?
// - Middleware prevents page access (UI level)
// - Server-side checks prevent direct API calls (data level)
// - Defense in depth — never trust the client alone
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Creates a new category. Only OWNER can perform this action.
 */
export async function createCategory(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return { error: "Anda tidak memiliki akses untuk menambah kategori." };
  }

  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as string;

  if (!name) return { error: "Nama kategori wajib diisi." };
  if (type !== "INCOME" && type !== "EXPENSE") {
    return { error: "Tipe kategori tidak valid." };
  }

  try {
    await prisma.category.create({
      data: { name, type },
    });
  } catch {
    return { error: "Kategori dengan nama tersebut sudah ada." };
  }

  revalidatePath("/categories");
  return { success: true };
}

/**
 * Updates an existing category. Only OWNER can perform this action.
 */
export async function updateCategory(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return { error: "Anda tidak memiliki akses untuk mengubah kategori." };
  }

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as string;

  if (!id) return { error: "ID kategori tidak valid." };
  if (!name) return { error: "Nama kategori wajib diisi." };
  if (type !== "INCOME" && type !== "EXPENSE") {
    return { error: "Tipe kategori tidak valid." };
  }

  try {
    await prisma.category.update({
      where: { id },
      data: { name, type },
    });
  } catch {
    return { error: "Gagal mengubah kategori. Pastikan nama tidak duplikat." };
  }

  revalidatePath("/categories");
  return { success: true };
}

/**
 * Deletes a category. Only OWNER can perform this action.
 *
 * WHY check for related transactions before deleting?
 * If a category has transactions linked to it, deleting would either:
 * - Fail with a foreign key error (if DB enforces it), or
 * - Orphan the transactions (bad data integrity)
 * So we reject the delete and tell the user why.
 */
export async function deleteCategory(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return { error: "Anda tidak memiliki akses untuk menghapus kategori." };
  }

  const id = formData.get("id") as string;
  if (!id) return { error: "ID kategori tidak valid." };

  // Check if category has linked transactions
  const transactionCount = await prisma.transaction.count({
    where: { categoryId: id },
  });

  if (transactionCount > 0) {
    return {
      error: `Kategori ini memiliki ${transactionCount} transaksi terkait dan tidak bisa dihapus.`,
    };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
  return { success: true };
}
