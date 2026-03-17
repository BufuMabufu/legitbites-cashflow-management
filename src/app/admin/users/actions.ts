// =============================================================================
// Admin User Management — Server Actions
// =============================================================================
// Server Actions for managing users: add, reset password, change role.
// Uses Supabase Admin API (service role key) to manage Auth users.
// All actions are guarded by assertAdmin and logged to AuditLog.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

// ---------------------------------------------------------------------------
// Supabase Admin Client (requires SERVICE_ROLE_KEY)
// ---------------------------------------------------------------------------
function getSupabaseAdmin() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

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
// Action: Add New User
// ---------------------------------------------------------------------------
export async function addUser(formData: FormData) {
  const admin = await assertAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as Role;

  if (!email || !name || !password || !role) {
    throw new Error("Semua field wajib diisi.");
  }

  // 1. Create the Supabase Auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role }, // Store role in JWT for middleware to read
      user_metadata: { name },
    });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Gagal membuat akun Supabase.");
  }

  // 2. Create the Prisma user record synced to Auth UUID
  await prisma.user.create({
    data: {
      id: authData.user.id,
      email,
      name,
      role,
    },
  });

  await logAction(
    admin.id,
    "USER_CREATED",
    JSON.stringify({ targetEmail: email, role })
  );

  revalidatePath("/admin/users");
}

// ---------------------------------------------------------------------------
// Action: Reset User Password (sends magic link / password reset email)
// ---------------------------------------------------------------------------
export async function resetUserPassword(userId: string) {
  const admin = await assertAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!dbUser) throw new Error("User tidak ditemukan.");

  // Send a password reset email via Supabase
  const { error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: dbUser.email,
  });

  if (error) throw new Error(error.message);

  await logAction(
    admin.id,
    "USER_PASSWORD_RESET",
    JSON.stringify({ targetUserId: userId, targetEmail: dbUser.email })
  );

  revalidatePath("/admin/users");
}

// ---------------------------------------------------------------------------
// Action: Change User Role
// ---------------------------------------------------------------------------
export async function changeUserRole(userId: string, newRole: Role) {
  const admin = await assertAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });
  if (!dbUser) throw new Error("User tidak ditemukan.");

  // 1. Update Prisma
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  // 2. Sync to Supabase app_metadata so the JWT reflects the new role
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role: newRole },
  });

  await logAction(
    admin.id,
    "USER_ROLE_CHANGED",
    JSON.stringify({ targetUserId: userId, oldRole: dbUser.role, newRole })
  );

  revalidatePath("/admin/users");
}

// ---------------------------------------------------------------------------
// Action: Update User
// ---------------------------------------------------------------------------
export async function updateUser(userId: string, formData: FormData) {
  const admin = await assertAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as Role;

  if (!email || !name || !role) {
    throw new Error("Email, Nama, dan Role wajib diisi.");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) throw new Error("User tidak ditemukan.");

  // 1. Update Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      email,
      app_metadata: { role },
      user_metadata: { name },
    }
  );

  if (authError) throw new Error(authError.message);

  // 2. Update Prisma
  await prisma.user.update({
    where: { id: userId },
    data: { email, name, role },
  });

  await logAction(
    admin.id,
    "USER_UPDATED",
    JSON.stringify({ targetUserId: userId, email, role })
  );

  revalidatePath("/admin/users");
}

// ---------------------------------------------------------------------------
// Action: Delete User
// ---------------------------------------------------------------------------
export async function deleteUser(userId: string) {
  const admin = await assertAdmin();
  const supabaseAdmin = getSupabaseAdmin();

  if (admin.id === userId) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) throw new Error("User tidak ditemukan.");

  // 1. Delete from Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) throw new Error(authError.message);

  // 2. Delete from Prisma
  await prisma.user.delete({ where: { id: userId } });

  await logAction(
    admin.id,
    "USER_DELETED",
    JSON.stringify({ targetUserId: userId, targetEmail: dbUser.email })
  );

  revalidatePath("/admin/users");
}
