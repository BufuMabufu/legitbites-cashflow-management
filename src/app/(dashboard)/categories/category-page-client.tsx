// =============================================================================
// Category Management Page (OWNER only)
// =============================================================================
// Lists all categories grouped by type (INCOME / EXPENSE).
// Allows OWNER to add, edit, and delete categories via modal dialogs.
//
// Protected by both middleware (route-level) and Server Actions (data-level).
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createCategory, updateCategory, deleteCategory } from "./actions";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

// === CategoryList component declared OUTSIDE render to avoid re-creation ===
// WHY? React treats components defined inside render as new component types
// on each render, causing unnecessary unmount/remount and losing state.
function CategoryList({
  title,
  items,
  color,
  onEdit,
  onDelete,
  isPending,
}: {
  title: string;
  items: Category[];
  color: string;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Badge
            variant="secondary"
            className={
              color === "emerald"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }
          >
            {title}
          </Badge>
          <span className="text-muted-foreground text-sm font-normal">
            ({items.length} kategori)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">
            Belum ada kategori. Klik &quot;Tambah Kategori&quot; untuk menambahkan.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="font-medium">{category.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => onDelete(category.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CategoryPageClientProps {
  categories: Category[];
}

export function CategoryPageClient({ categories }: CategoryPageClientProps) {
  const [openAdd, setOpenAdd] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isPending, startTransition] = useTransition();

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createCategory(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Kategori berhasil ditambahkan!");
        setOpenAdd(false);
      }
    });
  }

  async function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateCategory(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Kategori berhasil diubah!");
        setEditingCategory(null);
      }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", id);
      const result = await deleteCategory(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Kategori berhasil dihapus!");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori</h1>
          <p className="text-muted-foreground">
            Kelola kategori pemasukan dan pengeluaran
          </p>
        </div>

        {/* Add Category Dialog */}
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger className="inline-flex items-center h-12 px-5 text-base font-medium rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg text-white cursor-pointer transition-colors">
              <PlusCircle className="w-5 h-5 mr-2" />
              Tambah Kategori
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Kategori Baru</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kategori</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Contoh: Bahan Baku"
                  required
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipe</Label>
                <Select name="type" required>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Pilih tipe kategori">
                      {(value: string | null) => {
                        if (!value) return <span className="text-muted-foreground">Pilih tipe kategori</span>;
                        return value === "INCOME" ? "💰 Pemasukan" : "💸 Pengeluaran";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">💰 Pemasukan</SelectItem>
                    <SelectItem value="EXPENSE">💸 Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 text-base rounded-xl"
              >
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryList
          title="Pemasukan"
          items={incomeCategories}
          color="emerald"
          onEdit={setEditingCategory}
          onDelete={handleDelete}
          isPending={isPending}
        />
        <CategoryList
          title="Pengeluaran"
          items={expenseCategories}
          color="red"
          onEdit={setEditingCategory}
          onDelete={handleDelete}
          isPending={isPending}
        />
      </div>

      {/* Edit Category Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="id" value={editingCategory.id} />
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Kategori</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingCategory.name}
                  required
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipe</Label>
                <Select name="type" defaultValue={editingCategory.type}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue>
                      {(value: string | null) => {
                        if (!value) return null;
                        return value === "INCOME" ? "💰 Pemasukan" : "💸 Pengeluaran";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">💰 Pemasukan</SelectItem>
                    <SelectItem value="EXPENSE">💸 Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 text-base rounded-xl"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
