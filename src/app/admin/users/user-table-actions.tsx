// =============================================================================
// User Table Actions — Client Component
// =============================================================================
// Dropdown menu per user row: Reset Password & Change Role.
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { resetUserPassword, changeUserRole } from "./actions";
import { Role } from "@prisma/client";

interface UserTableActionsProps {
  userId: string;
  currentRole: Role;
}

const ROLES: { value: Role; label: string }[] = [
  { value: "OWNER", label: "👑 Owner" },
  { value: "STAFF", label: "👤 Staff" },
  { value: "ADMIN", label: "⚙️ Admin" },
];

export function UserTableActions({ userId, currentRole }: UserTableActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleResetPassword = () => {
    startTransition(async () => {
      try {
        await resetUserPassword(userId);
        toast.success("Email reset password berhasil dikirim.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengirim reset password.");
      }
    });
  };

  const handleChangeRole = (newRole: Role) => {
    if (newRole === currentRole) return;
    startTransition(async () => {
      try {
        await changeUserRole(userId, newRole);
        toast.success(`Role berhasil diubah ke ${newRole}.`);
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengubah role.");
      }
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" disabled={isPending} type="button">
            <MoreHorizontal className="w-4 h-4" />
            <span className="sr-only">Buka menu</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleResetPassword} disabled={isPending}>
          <KeyRound className="w-4 h-4 mr-2" />
          Reset Password
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="mr-2">🔄</span>
            Ubah Role
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {ROLES.map((r) => (
              <DropdownMenuItem
                key={r.value}
                onClick={() => handleChangeRole(r.value)}
                disabled={r.value === currentRole || isPending}
              >
                {r.label}
                {r.value === currentRole && (
                  <span className="ml-auto text-xs text-muted-foreground">aktif</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
