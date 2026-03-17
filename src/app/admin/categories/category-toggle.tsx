// =============================================================================
// Category Toggle — Client Component
// =============================================================================
// Inline switch to activate or deactivate a category.
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { toggleCategoryStatus } from "./actions";

interface CategoryToggleProps {
  categoryId: string;
  isActive: boolean;
}

export function CategoryToggle({ categoryId, isActive }: CategoryToggleProps) {
  const [active, setActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    setActive(checked);
    startTransition(async () => {
      try {
        await toggleCategoryStatus(categoryId, checked);
        toast.success(checked ? "Kategori diaktifkan." : "Kategori dinonaktifkan.");
      } catch {
        setActive(!checked); // Revert on error
        toast.error("Gagal mengubah status kategori.");
      }
    });
  };

  return (
    <Switch
      checked={active}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label="Toggle kategori"
    />
  );
}
