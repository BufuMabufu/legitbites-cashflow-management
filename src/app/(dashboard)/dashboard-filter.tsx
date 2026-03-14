"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarRange } from "lucide-react";

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentRange = searchParams.get("range") || "this_month";

  const handleRangeChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams);
    params.set("range", value);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <CalendarRange className="h-5 w-5 text-muted-foreground hidden sm:block" />
      <Select value={currentRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-[180px] h-12 text-base md:text-lg font-medium rounded-xl border-indigo-200 bg-white dark:bg-slate-950 dark:border-indigo-900 shadow-sm focus:ring-indigo-500">
          <SelectValue placeholder="Pilih Rentang Waktu" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="today" className="text-base py-3">Hari Ini</SelectItem>
          <SelectItem value="7d" className="text-base py-3">7 Hari Terakhir</SelectItem>
          <SelectItem value="this_month" className="text-base py-3">Bulan Ini</SelectItem>
          <SelectItem value="this_year" className="text-base py-3">Tahun Ini</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
