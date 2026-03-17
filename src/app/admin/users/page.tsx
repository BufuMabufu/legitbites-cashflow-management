// =============================================================================
// Admin — User Management Page (/admin/users)
// =============================================================================
// Displays a table of all users with role badges.
// Actions: Add New Account, Reset Password, Change Role.
// =============================================================================

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AddUserDialog } from "./add-user-dialog";
import { UserTableActions } from "./user-table-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "User Management — Admin LegitBites" };
export const dynamic = "force-dynamic";

const ROLE_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OWNER: { label: "👑 Owner", variant: "default" },
  STAFF: { label: "👤 Staff", variant: "secondary" },
  ADMIN: { label: "⚙️ Admin", variant: "outline" },
};

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola akun pengguna — tambah akun baru, reset password, atau ubah role.
          </p>
        </div>
        <AddUserDialog />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Pengguna</CardTitle>
          <CardDescription>{users.length} akun terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Belum ada pengguna.
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => {
                const badge = ROLE_BADGE[user.role];
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.createdAt.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserTableActions user={user} />
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
