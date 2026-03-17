// =============================================================================
// Edit User Dialog — Client Component
// =============================================================================
// Dialog form to update an existing user account.
// =============================================================================

"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateUser } from "./actions";
import { Role } from "@prisma/client";

interface EditUserDialogProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: Role;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateUser(user.id, formData);
        toast.success("Akun berhasil diperbarui.");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memperbarui akun.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Akun</DialogTitle>
          <DialogDescription>
            Perbarui informasi nama, email, atau role pengguna ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-name-${user.id}`}>Nama Lengkap</Label>
            <Input id={`edit-name-${user.id}`} name="name" defaultValue={user.name || ""} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-email-${user.id}`}>Alamat Email</Label>
            <Input id={`edit-email-${user.id}`} name="email" type="email" defaultValue={user.email} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-role-${user.id}`}>Role</Label>
            <Select name="role" defaultValue={user.role} required>
              <SelectTrigger id={`edit-role-${user.id}`}>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">👑 Owner</SelectItem>
                <SelectItem value="STAFF">👤 Staff</SelectItem>
                <SelectItem value="ADMIN">⚙️ Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
