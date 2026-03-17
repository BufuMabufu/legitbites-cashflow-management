// =============================================================================
// Add Category Dialog — Client Component
// =============================================================================
"use client";

import { useRef, useState, useTransition } from "react";
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
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { addCategory } from "./actions";

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await addCategory(formData);
        toast.success("Kategori berhasil ditambahkan.");
        setOpen(false);
        formRef.current?.reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menambahkan kategori.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="shrink-0" type="button">
            <FolderPlus className="w-4 h-4 mr-2" />
            Tambah Kategori
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Kategori Baru</DialogTitle>
          <DialogDescription>
            Kategori baru akan langsung aktif dan tersedia untuk transaksi.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nama Kategori</Label>
            <Input
              id="cat-name"
              name="name"
              placeholder="contoh: Bahan Baku, Kemasan, dll."
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-type">Tipe</Label>
            <Select name="type" required>
              <SelectTrigger id="cat-type">
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">💰 Pemasukan (Income)</SelectItem>
                <SelectItem value="EXPENSE">💸 Pengeluaran (Expense)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
