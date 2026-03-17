// =============================================================================
// Edit Category Dialog — Client Component
// =============================================================================
// Dialog form to update an existing category.
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
import { FolderPen } from "lucide-react";
import { toast } from "sonner";
import { updateCategory } from "./actions";
import { TransactionType } from "@prisma/client";

interface EditCategoryDialogProps {
  category: {
    id: string;
    name: string;
    type: TransactionType;
  };
}

export function EditCategoryDialog({ category }: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateCategory(category.id, formData);
        toast.success("Kategori berhasil diperbarui.");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memperbarui kategori.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <DropdownItemWithIcon icon={<FolderPen className="w-4 h-4 mr-2" />} label="Edit Kategori" />
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Kategori</DialogTitle>
          <DialogDescription>
            Perbarui nama atau tipe kategori transaksi ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-cat-name">Nama Kategori</Label>
            <Input id="edit-cat-name" name="name" defaultValue={category.name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-cat-type">Tipe</Label>
            <Select name="type" defaultValue={category.type} required>
              <SelectTrigger id="edit-cat-type">
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">💰 Pemasukan</SelectItem>
                <SelectItem value="EXPENSE">💸 Pengeluaran</SelectItem>
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
