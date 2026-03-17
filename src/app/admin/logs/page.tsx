// =============================================================================
// Admin — Audit Trail Page (/admin/logs)
// =============================================================================
// Read-only table displaying all AuditLog entries, newest first.
// =============================================================================

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Audit Trail — Admin LegitBites" };
export const dynamic = "force-dynamic";

// Map action strings to readable badges
const ACTION_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  USER_CREATED: { label: "User Dibuat", variant: "default" },
  USER_ROLE_CHANGED: { label: "Role Diubah", variant: "outline" },
  USER_PASSWORD_RESET: { label: "Reset Password", variant: "secondary" },
  CATEGORY_CREATED: { label: "Kategori Dibuat", variant: "default" },
  CATEGORY_TOGGLED: { label: "Kategori Di-toggle", variant: "secondary" },
  MAINTENANCE_MODE_TOGGLED: { label: "Maintenance Toggle", variant: "destructive" },
};

export default async function LogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200, // Limit to the 200 most recent entries
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Riwayat aktivitas sistem — read-only. Menampilkan 200 entri terbaru.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Log Aktivitas</CardTitle>
          <CardDescription>{logs.length} entri ditampilkan</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    Belum ada log aktivitas.
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => {
                const badge = ACTION_BADGE[log.action] ?? {
                  label: log.action,
                  variant: "outline" as const,
                };

                // Parse details JSON if available
                let detailText = log.details ?? "—";
                try {
                  if (log.details) {
                    const parsed = JSON.parse(log.details) as Record<string, unknown>;
                    detailText = Object.entries(parsed)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ");
                  }
                } catch {
                  detailText = log.details ?? "—";
                }

                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {log.createdAt.toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.user.name}</p>
                        <p className="text-xs text-muted-foreground">{log.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {detailText}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
