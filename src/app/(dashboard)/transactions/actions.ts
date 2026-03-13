// =============================================================================
// Transaction Server Actions
// =============================================================================
// Handles creating transactions. Both OWNER and STAFF can create transactions.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
 * Deletes a transaction.
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
    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    revalidatePath("/");
    revalidatePath("/transactions");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return { error: "Gagal menghapus transaksi." };
  }
}
