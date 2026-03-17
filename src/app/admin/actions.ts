// =============================================================================
// Admin Server Actions
// =============================================================================
// All server actions for the Admin Panel dashboard operations.
// Each action records an entry to the AuditLog model for accountability.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Helper: Ensure caller is ADMIN
// ---------------------------------------------------------------------------
async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Helper: Write to AuditLog
// ---------------------------------------------------------------------------
async function logAction(
  userId: string,
  action: string,
  details?: string
) {
  await prisma.auditLog.create({
    data: { userId, action, details },
  });
}

// ---------------------------------------------------------------------------
// Maintenance Mode Toggle
// ---------------------------------------------------------------------------
export async function toggleMaintenanceMode(isActive: boolean) {
  const admin = await assertAdmin();

  // Upsert the MAINTENANCE_MODE setting
  await prisma.systemSetting.upsert({
    where: { key: "MAINTENANCE_MODE" },
    update: { value: isActive ? "true" : "false" },
    create: { key: "MAINTENANCE_MODE", value: isActive ? "true" : "false" },
  });

  await logAction(
    admin.id,
    "MAINTENANCE_MODE_TOGGLED",
    JSON.stringify({ isActive })
  );

  revalidatePath("/admin");
  revalidatePath("/api/settings/maintenance");
}
