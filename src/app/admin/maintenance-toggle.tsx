// =============================================================================
// Maintenance Mode Toggle — Client Component
// =============================================================================
// Interactive switch that calls the toggleMaintenanceMode server action.
// Separated into its own client component so the parent page stays a
// pure Server Component (no "use client" needed on the page itself).
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toggleMaintenanceMode } from "./actions";
import { toast } from "sonner";

interface MaintenanceToggleProps {
  isActive: boolean;
}

export function MaintenanceToggle({ isActive }: MaintenanceToggleProps) {
  const [active, setActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    setActive(checked); // Optimistic update
    startTransition(async () => {
      try {
        await toggleMaintenanceMode(checked);
        toast.success(
          checked
            ? "Maintenance mode AKTIF. User akan diarahkan ke halaman maintenance."
            : "Maintenance mode NONAKTIF. Sistem kembali beroperasi normal."
        );
      } catch {
        setActive(!checked); // Revert on error
        toast.error("Gagal mengubah status maintenance. Coba lagi.");
      }
    });
  };

  return (
    <div className="flex items-center gap-5">
      <Switch
        id="maintenance-toggle"
        checked={active}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="scale-125 data-[state=checked]:bg-amber-500"
      />
      <div>
        <Label
          htmlFor="maintenance-toggle"
          className="text-base font-semibold cursor-pointer"
        >
          {active ? "Maintenance Aktif" : "Sistem Normal"}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          {active
            ? "OWNER & STAFF sedang diarahkan ke halaman maintenance."
            : "Klik untuk mengaktifkan mode maintenance."}
        </p>
      </div>
      <Badge
        variant={active ? "destructive" : "secondary"}
        className="ml-auto shrink-0"
      >
        {active ? "MAINTENANCE" : "ONLINE"}
      </Badge>
    </div>
  );
}
