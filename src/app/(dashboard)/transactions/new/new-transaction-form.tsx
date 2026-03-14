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
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";
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
  const router = useRouter();
  const initialType = searchParams.get("type") === "EXPENSE" ? "EXPENSE" : "INCOME";

  const [type, setType] = useState<"INCOME" | "EXPENSE">(initialType);
  const [displayAmount, setDisplayAmount] = useState("");
  const [rawAmount, setRawAmount] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter categories based on selected transaction type
  const filteredCategories = categories.filter((c) => c.type === type);

  // Default to today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const value = e.target.value.replace(/\D/g, "");
    setRawAmount(value);
    
    // Format with thousand separator
    if (value) {
      setDisplayAmount(new Intl.NumberFormat("id-ID").format(Number(value)));
    } else {
      setDisplayAmount("");
    }
  };

  async function handleSubmit(formData: FormData) {
    if (!rawAmount || Number(rawAmount) <= 0) {
      toast.error("Jumlah transaksi harus lebih dari 0");
      return;
    }

    formData.set("type", type);
    formData.set("amount", rawAmount);

    startTransition(async () => {
      const result = await createTransaction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        await Swal.fire({
          title: "Berhasil!",
          text: `Transaksi ${type === "INCOME" ? "pemasukan" : "pengeluaran"} berhasil dicatat.`,
          icon: "success",
          confirmButtonColor: "#10b981",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/transactions");
      }
    });
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Catat Transaksi</h1>
        <p className="text-base md:text-lg text-muted-foreground mt-2">
          Pilih tipe dan isi detail transaksi
        </p>
      </div>

      {/* Type Toggle — big, colored tabs */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Button
          type="button"
          variant={type === "INCOME" ? "default" : "outline"}
          className={`h-14 md:h-16 text-base md:text-lg font-bold rounded-xl md:rounded-2xl transition-all ${
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
          className={`h-14 md:h-16 text-base md:text-lg font-bold rounded-xl md:rounded-2xl transition-all ${
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
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl">
            {type === "INCOME" ? "Detail Pemasukan" : "Detail Pengeluaran"}
          </CardTitle>
        </CardHeader>
        <CardContent className="md:p-8">
          <form action={handleSubmit} className="space-y-6">
            {/* Amount — the most important field, so it's first and biggest */}
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-base md:text-lg font-bold">
                Jumlah (Rp)
              </Label>
              <Input
                id="amount"
                type="text"
                placeholder="0"
                required
                value={displayAmount}
                onChange={handleAmountChange}
                inputMode="numeric"
                className="h-16 md:h-20 text-3xl md:text-4xl font-extrabold text-center rounded-2xl"
              />
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label htmlFor="categoryId" className="text-base md:text-lg font-bold">
                Kategori
              </Label>
              <Select name="categoryId" required>
                <SelectTrigger className="w-full h-12 md:h-14 text-base md:text-lg rounded-xl">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                  {filteredCategories.length === 0 ? (
                    <SelectItem value="__empty" disabled className="text-base">
                      Belum ada kategori {type === "INCOME" ? "pemasukan" : "pengeluaran"}
                    </SelectItem>
                  ) : (
                    filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-base md:text-lg py-3 cursor-pointer">
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-3">
              <Label htmlFor="date" className="text-base md:text-lg font-bold">
                Tanggal
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={today}
                required
                className="h-12 md:h-14 text-base md:text-lg rounded-xl w-full"
              />
            </div>

            {/* Description (optional) */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base md:text-lg font-bold flex items-center justify-between">
                <span>Keterangan</span>
                <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Opsional
                </span>
              </Label>
              <Input
                id="description"
                name="description"
                placeholder="Contoh: Penjualan nasi goreng 50 porsi"
                className="h-12 md:h-14 text-base md:text-lg rounded-xl"
              />
            </div>

            {/* Receipt Image (optional) */}
            <div className="space-y-3">
              <Label htmlFor="receipt" className="text-base md:text-lg font-bold flex items-center justify-between">
                <span>Foto Bukti Kuitansi</span>
                <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Opsional
                </span>
              </Label>

              <Label 
                htmlFor="receipt" 
                className="flex items-center justify-center w-full min-h-24 md:min-h-32 p-4 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors text-center"
              >
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm md:text-base font-medium text-muted-foreground break-all px-4">
                    {fileName ? fileName : "Klik di sini untuk memilih gambar"}
                  </span>
                </div>
                <Input
                  id="receipt"
                  name="receipt"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                />
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className={`w-full mt-8 h-14 md:h-16 text-lg md:text-xl font-bold rounded-2xl shadow-xl transition-all ${
                type === "INCOME"
                  ? "bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:-translate-y-1"
                  : "bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 hover:-translate-y-1"
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" /> 
                  Menyimpan...
                </>
              ) : (
                "Simpan Transaksi"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
