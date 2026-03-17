// =============================================================================
// Admin Dashboard Page — /admin
// =============================================================================
// Main landing page for the admin panel.
// Shows a summary card and the Maintenance Mode toggle.
// =============================================================================

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MaintenanceToggle } from "./maintenance-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin Dashboard — LegitBites" };

// Force dynamic so the maintenance status is always fresh
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [userCount, categoryCount, logCount, maintenanceSetting] =
    await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.auditLog.count(),
      prisma.systemSetting.findUnique({
        where: { key: "MAINTENANCE_MODE" },
        select: { value: true },
      }),
    ]);

  const isMaintenanceActive = maintenanceSetting?.value === "true";

  const stats = [
    { label: "Total User", value: userCount },
    { label: "Total Kategori", value: categoryCount },
    { label: "Entri Audit Log", value: logCount },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola sistem, pengguna, dan pengaturan LegitBites.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Maintenance Mode Card */}
      <Card className="border-amber-200 dark:border-amber-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 Maintenance Mode
          </CardTitle>
          <CardDescription>
            Ketika aktif, semua akses dashboard oleh OWNER dan STAFF akan
            diarahkan ke halaman maintenance. Admin tetap bisa mengakses
            semua halaman.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceToggle isActive={isMaintenanceActive} />
        </CardContent>
      </Card>
    </div>
  );
}
