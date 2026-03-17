// =============================================================================
// Admin Category Management — Server Actions
// =============================================================================
// Server Actions for managing categories: add and toggle active status.
// All actions are guarded by assertAdmin and logged to AuditLog.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TransactionType } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Helper: Ensure caller is ADMIN
// ---------------------------------------------------------------------------
async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");
  return user;
}

// ---------------------------------------------------------------------------
// Helper: Write to AuditLog
// ---------------------------------------------------------------------------
async function logAction(userId: string, action: string, details?: string) {
  await prisma.auditLog.create({ data: { userId, action, details } });
}

// ---------------------------------------------------------------------------
// Action: Add New Category
// ---------------------------------------------------------------------------
export async function addCategory(formData: FormData) {
  const admin = await assertAdmin();

  const name = formData.get("name") as string;
  const type = formData.get("type") as TransactionType;

  if (!name?.trim() || !type) throw new Error("Nama dan tipe kategori wajib diisi.");

  await prisma.category.create({
    data: { name: name.trim(), type, isActive: true },
  });

  await logAction(
    admin.id,
    "CATEGORY_CREATED",
    JSON.stringify({ name, type })
  );

  revalidatePath("/admin/categories");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Action: Toggle Category Active Status
// ---------------------------------------------------------------------------
export async function toggleCategoryStatus(categoryId: string, isActive: boolean) {
  const admin = await assertAdmin();

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { name: true },
  });
  if (!category) throw new Error("Kategori tidak ditemukan.");

  await prisma.category.update({
    where: { id: categoryId },
    data: { isActive },
  });

  await logAction(
    admin.id,
    "CATEGORY_TOGGLED",
    JSON.stringify({ categoryId, name: category.name, isActive })
  );

  revalidatePath("/admin/categories");
  revalidatePath("/");
}
