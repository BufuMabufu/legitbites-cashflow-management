// =============================================================================
// Transaction Server Actions
// =============================================================================
// Handles creating transactions. Both OWNER and STAFF can create transactions.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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
  let imageUrl: string | null = null;
  
  const receiptFile = formData.get("receipt") as File | null;
  if (receiptFile && receiptFile.size > 0) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const fileExt = receiptFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(filePath, receiptFile);
      
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { error: "Gagal mengunggah foto bukti." };
    }
    
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('receipts')
      .getPublicUrl(filePath);
      
    imageUrl = publicUrlData.publicUrl;
  }

  await prisma.transaction.create({
    data: {
      amount,
      type: type as "INCOME" | "EXPENSE",
      date,
      description,
      imageUrl,
      categoryId,
      userId: user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}

/**
 * Deletes a transaction (Soft Delete).
 * Only the OWNER role is authorized to perform this action.
 */
export async function deleteTransaction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return { error: "Anda tidak memiliki akses untuk menghapus transaksi." };
  }

  const transactionId = formData.get("id") as string;
  if (!transactionId) {
    return { error: "ID Transaksi tidak valid." };
  }

  try {
    const now = new Date();
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { deletedAt: now },
    });

    revalidatePath("/");
    revalidatePath("/transactions");
    return { success: true, deletedAt: now.toISOString() };
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return { error: "Gagal menghapus transaksi." };
  }
}

/**
 * Deletes all transactions (Soft Delete).
 * Only the OWNER role is authorized.
 */
export async function deleteAllTransactions() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return { error: "Anda tidak memiliki akses untuk menghapus semua transaksi." };
  }

  try {
    const now = new Date();
    await prisma.transaction.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: now },
    });

    revalidatePath("/");
    revalidatePath("/transactions");
    return { success: true, deletedAt: now.toISOString() };
  } catch (error) {
    console.error("Failed to delete all transactions:", error);
    return { error: "Gagal menghapus semua transaksi." };
  }
}

/**
 * Restores transactions deleted at a specific time (Undo).
 */
export async function restoreTransactions(deletedAt: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return { error: "Anda tidak memiliki akses untuk memulihkan transaksi." };
  }

  try {
    const date = new Date(deletedAt);
    // Allow a small margin (e.g. 1 second) for updateMany drift if any, 
    // though usually it's exact in the same call.
    await prisma.transaction.updateMany({
      where: { deletedAt: date },
      data: { deletedAt: null },
    });

    revalidatePath("/");
    revalidatePath("/transactions");
    return { success: true };
  } catch (error) {
    console.error("Failed to restore transactions:", error);
    return { error: "Gagal membatalkan penghapusan." };
  }
}

/**
 * Updates an existing transaction.
 * Only the OWNER role is authorized to perform this action to avoid staff tampering.
 */
export async function updateTransaction(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return { error: "Anda tidak memiliki akses untuk mengubah transaksi." };
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
  let imageUrl: string | undefined = undefined;

  const receiptFile = formData.get("receipt") as File | null;
  if (receiptFile && receiptFile.size > 0) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const fileExt = receiptFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(filePath, receiptFile);
      
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { error: "Gagal mengunggah foto bukti." };
    }
    
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('receipts')
      .getPublicUrl(filePath);
      
    imageUrl = publicUrlData.publicUrl;
  }

  try {
    const dataToUpdate: Prisma.TransactionUpdateInput = {
      amount,
      type: type as "INCOME" | "EXPENSE",
      date,
      description,
      category: { connect: { id: categoryId } },
    };

    if (imageUrl) {
      dataToUpdate.imageUrl = imageUrl;
    }

    await prisma.transaction.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath("/");
    revalidatePath("/transactions");
    return { success: true };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return { error: "Gagal mengubah transaksi." };
  }
}

// =============================================================================
// Bulk Transaction Creation
// =============================================================================

export async function createBulkTransactions(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Anda harus login untuk mencatat transaksi." };
  }

  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const countStr = formData.get("count") as string;
  const count = parseInt(countStr || "0", 10);

  if (count === 0) {
    return { error: "Tidak ada data untuk disimpan." };
  }

  if (type !== "INCOME" && type !== "EXPENSE") {
    return { error: "Tipe transaksi tidak valid." };
  }

  const rowErrors: { row: number; message: string }[] = [];
  const validatedData: {
    amount: number;
    categoryId: string;
    date: Date;
    description: string | null;
    receiptFile: File | null;
  }[] = [];

  // Parse entries from FormData
  const entries = [];
  for (let i = 0; i < count; i++) {
    const amountStr = formData.get(`entries[${i}].amount`) as string | null;
    const categoryId = formData.get(`entries[${i}].categoryId`) as string | null;
    const dateStr = formData.get(`entries[${i}].date`) as string | null;
    const description = (formData.get(`entries[${i}].description`) as string | null) || "";
    const receiptFile = formData.get(`entries[${i}].receipt`) as File | null;

    entries.push({
      amount: amountStr || "",
      categoryId: categoryId || "",
      date: dateStr || "",
      description,
      receiptFile,
    });
  }

  const categoryIds = [...new Set(entries.map((e) => e.categoryId).filter(Boolean))];
  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, type: true },
      })
    : [];

  const categoryMap = new Map(categories.map((c) => [c.id, c.type]));

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const rowNum = i + 1;

    const amount = parseFloat(entry.amount);
    if (!entry.amount || isNaN(amount) || amount <= 0) {
      rowErrors.push({ row: rowNum, message: "Jumlah harus lebih dari 0." });
      continue;
    }

    if (!entry.categoryId) {
      rowErrors.push({ row: rowNum, message: "Kategori wajib dipilih." });
      continue;
    }
    const catType = categoryMap.get(entry.categoryId);
    if (!catType) {
      rowErrors.push({ row: rowNum, message: "Kategori tidak ditemukan." });
      continue;
    }
    if (catType !== type) {
      rowErrors.push({ row: rowNum, message: "Kategori tidak sesuai tipe." });
      continue;
    }

    if (!entry.date) {
      rowErrors.push({ row: rowNum, message: "Tanggal wajib diisi." });
      continue;
    }

    validatedData.push({
      amount,
      categoryId: entry.categoryId,
      date: new Date(entry.date),
      description: entry.description?.trim() || null,
      receiptFile: entry.receiptFile,
    });
  }

  if (rowErrors.length > 0) {
    return { rowErrors };
  }

  try {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upload files concurrently
    const finalData = await Promise.all(
      validatedData.map(async (data) => {
        let imageUrl: string | null = null;

        if (data.receiptFile && data.receiptFile.size > 0 && data.receiptFile.name) {
          const fileExt = data.receiptFile.name.split('.').pop() || "png";
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `receipts/${fileName}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from('receipts')
            .upload(filePath, data.receiptFile);

          if (!uploadError) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('receipts')
              .getPublicUrl(filePath);
            imageUrl = publicUrlData.publicUrl;
          } else {
            console.error("Storage upload error for row:", uploadError);
          }
        }

        return {
          amount: data.amount,
          categoryId: data.categoryId,
          date: data.date,
          description: data.description,
          imageUrl,
          type,
          userId: user.id,
        };
      })
    );

    await prisma.transaction.createMany({
      data: finalData,
    });

    revalidatePath("/");
    revalidatePath("/transactions");
    return { success: true, count: finalData.length };
  } catch (error) {
    console.error("Failed to create bulk transactions:", error);
    return { error: "Gagal menyimpan transaksi. Silakan coba lagi." };
  }
}
