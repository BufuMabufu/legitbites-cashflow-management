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
 * Deletes a category (Soft Delete).
 * Only the OWNER role is authorized to perform this action.
 */
export async function deleteCategory(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return { error: "Anda tidak memiliki akses untuk menghapus kategori." };
  }

  const id = formData.get("id") as string;
  if (!id) return { error: "ID kategori tidak valid." };

  try {
    const now = new Date();
    await prisma.category.update({
      where: { id },
      data: { deletedAt: now },
    });

    revalidatePath("/categories");
    return { success: true, deletedAt: now.toISOString() };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { error: "Gagal menghapus kategori." };
  }
}

/**
 * Deletes all categories (Soft Delete).
 * Only the OWNER role is authorized.
 */
export async function deleteAllCategories() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return { error: "Anda tidak memiliki akses untuk menghapus semua kategori." };
  }

  try {
    const now = new Date();
    await prisma.category.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: now },
    });

    revalidatePath("/categories");
    return { success: true, deletedAt: now.toISOString() };
  } catch (error) {
    console.error("Failed to delete all categories:", error);
    return { error: "Gagal menghapus semua kategori." };
  }
}

/**
 * Restores categories deleted at a specific time (Undo).
 */
export async function restoreCategories(deletedAt: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return { error: "Anda tidak memiliki akses untuk memulihkan kategori." };
  }

  try {
    const date = new Date(deletedAt);
    await prisma.category.updateMany({
      where: { deletedAt: date },
      data: { deletedAt: null },
    });

    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Failed to restore categories:", error);
    return { error: "Gagal membatalkan penghapusan." };
  }
}
