// =============================================================================
// Edit Category Dialog — Client Component
// =============================================================================
// Dialog form to update an existing category.
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
import { updateCategory } from "./actions";
import { TransactionType } from "@prisma/client";

interface EditCategoryDialogProps {
  category: {
    id: string;
    name: string;
    type: TransactionType;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({ category, open, onOpenChange }: EditCategoryDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateCategory(category.id, formData);
        toast.success("Kategori berhasil diperbarui.");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memperbarui kategori.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Kategori</DialogTitle>
          <DialogDescription>
            Perbarui nama atau tipe kategori transaksi ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-cat-name-${category.id}`}>Nama Kategori</Label>
            <Input id={`edit-cat-name-${category.id}`} name="name" defaultValue={category.name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-cat-type-${category.id}`}>Tipe</Label>
            <Select name="type" defaultValue={category.type} required>
              <SelectTrigger id={`edit-cat-type-${category.id}`}>
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">💰 Pemasukan</SelectItem>
                <SelectItem value="EXPENSE">💸 Pengeluaran</SelectItem>
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
