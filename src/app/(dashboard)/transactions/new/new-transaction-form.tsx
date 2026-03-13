// =============================================================================
// New Transaction Page — Client Component
// =============================================================================
// Big, clean form for recording income or expense transactions.
// Designed for ease of use on both mobile and desktop.
//
// Key UX decisions:
// - Tab toggle for INCOME/EXPENSE (colored for visual clarity)
// - Large numeric input field for quick amount entry
// - Category dropdown pre-filtered by transaction type
// - Date defaults to today (most common use case)
// - Optional description to minimize friction for quick entries
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createTransaction } from "../actions";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

interface NewTransactionFormProps {
  categories: Category[];
}

export function NewTransactionForm({ categories }: NewTransactionFormProps) {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "EXPENSE" ? "EXPENSE" : "INCOME";

  const [type, setType] = useState<"INCOME" | "EXPENSE">(initialType);
  const [isPending, startTransition] = useTransition();

  // Filter categories based on selected transaction type
  const filteredCategories = categories.filter((c) => c.type === type);

  // Default to today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(formData: FormData) {
    formData.set("type", type);

    startTransition(async () => {
      const result = await createTransaction(formData);
      if (result?.error) {
        toast.error(result.error);
      }
      // If no error, the Server Action will redirect to /transactions
    });
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catat Transaksi</h1>
        <p className="text-muted-foreground">
          Pilih tipe dan isi detail transaksi
        </p>
      </div>

      {/* Type Toggle — big, colored tabs */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={type === "INCOME" ? "default" : "outline"}
          className={`h-14 text-base font-semibold rounded-xl transition-all ${
            type === "INCOME"
              ? "bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
              : ""
          }`}
          onClick={() => setType("INCOME")}
        >
          💰 Pemasukan
        </Button>
        <Button
          type="button"
          variant={type === "EXPENSE" ? "default" : "outline"}
          className={`h-14 text-base font-semibold rounded-xl transition-all ${
            type === "EXPENSE"
              ? "bg-linear-to-r from-red-500 to-rose-600 text-white shadow-lg"
              : ""
          }`}
          onClick={() => setType("EXPENSE")}
        >
          💸 Pengeluaran
        </Button>
      </div>

      {/* Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {type === "INCOME" ? "Detail Pemasukan" : "Detail Pengeluaran"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-5">
            {/* Amount — the most important field, so it's first and biggest */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold">
                Jumlah (Rp)
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0"
                required
                min="1"
                step="any"
                inputMode="numeric"
                className="h-14 text-2xl font-bold text-center rounded-xl"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-base font-semibold">
                Kategori
              </Label>
              <Select name="categoryId" required>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      Belum ada kategori {type === "INCOME" ? "pemasukan" : "pengeluaran"}
                    </SelectItem>
                  ) : (
                    filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-base font-semibold">
                Tanggal
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={today}
                required
                className="h-12 text-base"
              />
            </div>

            {/* Description (optional) */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Keterangan{" "}
                <span className="text-muted-foreground font-normal">
                  (opsional)
                </span>
              </Label>
              <Input
                id="description"
                name="description"
                placeholder="Contoh: Penjualan nasi goreng 50 porsi"
                className="h-12 text-base"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className={`w-full h-14 text-lg font-semibold rounded-xl shadow-lg transition-all ${
                type === "INCOME"
                  ? "bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  : "bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
              }`}
            >
              {isPending ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
