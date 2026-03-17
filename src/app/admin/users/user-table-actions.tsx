// =============================================================================
// User Table Actions — Client Component
// =============================================================================
// Dropdown menu per user row: Reset Password & Change Role.
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, KeyRound, Trash2, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditUserDialog } from "./edit-user-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { resetUserPassword, changeUserRole, deleteUser } from "./actions";
import { Role } from "@prisma/client";

interface UserTableActionsProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: Role;
  };
}

const ROLES: { value: Role; label: string }[] = [
  { value: "OWNER", label: "👑 Owner" },
  { value: "STAFF", label: "👤 Staff" },
  { value: "ADMIN", label: "⚙️ Admin" },
];

export function UserTableActions({ user }: UserTableActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleResetPassword = () => {
    startTransition(async () => {
      try {
        await resetUserPassword(user.id);
        toast.success("Email reset password berhasil dikirim.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengirim reset password.");
      }
    });
  };

  const handleDeleteUser = () => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.")) return;
    startTransition(async () => {
      try {
        await deleteUser(user.id);
        toast.success("Akun berhasil dihapus.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus akun.");
      }
    });
  };

  const handleChangeRole = (newRole: Role) => {
    if (newRole === user.role) return;
    startTransition(async () => {
      try {
        await changeUserRole(user.id, newRole);
        toast.success(`Role berhasil diubah ke ${newRole}.`);
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengubah role.");
      }
    });
  };

  return (
    <>
      <EditUserDialog 
        user={user} 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
      />
      
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
          <DropdownMenuGroup>
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
            <UserPen className="w-4 h-4 mr-2" />
            Edit Akun
          </DropdownMenuItem>

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
                  disabled={r.value === user.role || isPending}
                >
                  {r.label}
                  {r.value === user.role && (
                    <span className="ml-auto text-xs text-muted-foreground">aktif</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDeleteUser} 
            disabled={isPending}
            variant="destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Akun
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
