"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarRange, Loader2 } from "lucide-react";

/** Maps URL param values to Indonesian labels */
const RANGE_LABELS: Record<string, string> = {
  all: "Semua Waktu",
  today: "Hari Ini",
  "7d": "7 Hari Terakhir",
  this_month: "Bulan Ini",
  this_year: "Tahun Ini",
};

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentRange = searchParams.get("range") || "this_month";

  const [isPending, startTransition] = useTransition();

  const handleRangeChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams);
    params.set("range", value);
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
    
    // Smooth scroll to the results area so user sees updated charts immediately
    setTimeout(() => {
      document.getElementById("dashboard-content")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  /** 
   * Sort entries so the currently selected range is always the first option 
   * in the list, as requested by the user.
   */
  const sortedRangeEntries = Object.entries(RANGE_LABELS).sort(([key]) => 
    key === currentRange ? -1 : 1
  );

  return (
    <div className="flex items-center gap-2">
      {isPending ? (
        <Loader2 className="h-5 w-5 text-indigo-600 animate-spin hidden sm:block" />
      ) : (
        <CalendarRange className="h-5 w-5 text-muted-foreground hidden sm:block" />
      )}
      <Select value={currentRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-[200px] h-12 text-base md:text-lg font-medium rounded-xl border-indigo-200 bg-white dark:bg-slate-950 dark:border-indigo-900 shadow-sm focus:ring-indigo-500">
          <SelectValue placeholder="Pilih Rentang Waktu">
            {RANGE_LABELS[currentRange] || currentRange}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {sortedRangeEntries.map(([value, label]) => (
            <SelectItem key={value} value={value} className="text-base py-3">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
