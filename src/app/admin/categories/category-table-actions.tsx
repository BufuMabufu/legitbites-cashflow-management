// =============================================================================
// Category Table Actions — Client Component
// =============================================================================
// Dropdown menu per category row: Edit & Delete.
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { deleteCategory } from "./actions";
import { EditCategoryDialog } from "./edit-category-dialog";
import { TransactionType } from "@prisma/client";

interface CategoryTableActionsProps {
  category: {
    id: string;
    name: string;
    type: TransactionType;
  };
}

export function CategoryTableActions({ category }: CategoryTableActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteCategory(category.id);
        toast.success("Kategori berhasil dihapus.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus kategori.");
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
        <DropdownMenuGroup>
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <EditCategoryDialog category={category} />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isPending}
          variant="destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Hapus Kategori
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
