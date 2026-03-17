// =============================================================================
// Edit User Dialog — Client Component
// =============================================================================
// Dialog form to update an existing user account.
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { UserPen } from "lucide-react";
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
}

export function EditUserDialog({ user }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateUser(user.id, formData);
        toast.success("Akun berhasil diperbarui.");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memperbarui akun.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <DropdownItemWithIcon icon={<UserPen className="w-4 h-4 mr-2" />} label="Edit Akun" />
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Akun</DialogTitle>
          <DialogDescription>
            Perbarui informasi nama, email, atau role pengguna ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nama Lengkap</Label>
            <Input id="edit-name" name="name" defaultValue={user.name || ""} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Alamat Email</Label>
            <Input id="edit-email" name="email" type="email" defaultValue={user.email} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Role</Label>
            <Select name="role" defaultValue={user.role} required>
              <SelectTrigger id="edit-role">
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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

// Helper to make it look like a DropdownItem but it's used inside DialogTrigger
function DropdownItemWithIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground w-full">
      {icon}
      {label}
    </div>
  );
}
