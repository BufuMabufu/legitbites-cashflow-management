// =============================================================================
// Bulk Entry Table — Client Component
// =============================================================================
// Spreadsheet-style table for entering multiple transactions at once.
// Each row has: Amount, Category, Date, Description, Image Upload, Delete button.
// =============================================================================

"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Trash2, Loader2, Save, UploadCloud, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { createBulkTransactions } from "../actions";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

interface BulkEntryRow {
  id: string; // client-only unique key
  amount: string;
  displayAmount: string;
  categoryId: string;
  date: string;
  description: string;
  receiptFile: File | null;
  error?: string;
}

interface BulkEntryTableProps {
  type: "INCOME" | "EXPENSE";
  categories: Category[];
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyRow(defaultDate: string): BulkEntryRow {
  return {
    id: generateId(),
    amount: "",
    displayAmount: "",
    categoryId: "",
    date: defaultDate,
    description: "",
    receiptFile: null,
  };
}

function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

export function BulkEntryTable({ type, categories }: BulkEntryTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredCategories = categories.filter((c) => c.type === type);

  const [rows, setRows] = useState<BulkEntryRow[]>(() => [
    createEmptyRow(today),
    createEmptyRow(today),
    createEmptyRow(today),
  ]);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow(today)]);
  }, [today]);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev; // Keep at least 1 row
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const updateRow = useCallback(
    (id: string, field: keyof BulkEntryRow, value: string) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          if (field === "amount") {
            const digits = value.replace(/\D/g, "");
            return { ...r, amount: digits, displayAmount: formatNumber(digits), error: undefined };
          }
          return { ...r, [field]: value, error: undefined };
        })
      );
    },
    []
  );

  const updateFile = useCallback((id: string, file: File | null) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, receiptFile: file } : r)));
  }, []);

  // Count non-empty rows (has amount)
  const filledCount = rows.filter((r) => r.amount && Number(r.amount) > 0).length;

  const handleSubmit = () => {
    let hasError = false;
    const updatedRows = rows.map((r) => {
      if (!r.amount || Number(r.amount) <= 0) {
        hasError = true;
        return { ...r, error: "Jumlah wajib diisi" };
      }
      if (!r.categoryId) {
        hasError = true;
        return { ...r, error: "Kategori wajib dipilih" };
      }
      if (!r.date) {
        hasError = true;
        return { ...r, error: "Tanggal wajib diisi" };
      }
      return { ...r, error: undefined };
    });

    if (hasError) {
      setRows(updatedRows);
      toast.error("Ada baris yang belum lengkap. Periksa kembali data Anda.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("count", rows.length.toString());

      rows.forEach((r, i) => {
        formData.append(`entries[${i}].amount`, r.amount);
        formData.append(`entries[${i}].categoryId`, r.categoryId);
        formData.append(`entries[${i}].date`, r.date);
        formData.append(`entries[${i}].description`, r.description);
        if (r.receiptFile) {
          formData.append(`entries[${i}].receipt`, r.receiptFile);
        }
      });

      const result = await createBulkTransactions(formData);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.rowErrors) {
        const errorMap = new Map(result.rowErrors.map((e) => [e.row - 1, e.message]));
        setRows((prev) =>
          prev.map((r, i) => ({
            ...r,
            error: errorMap.get(i),
          }))
        );
        toast.error(`${result.rowErrors.length} baris memiliki masalah. Periksa kembali.`);
      } else if (result?.success) {
        await Swal.fire({
          title: "Berhasil! 🎉",
          text: `${result.count} transaksi ${type === "INCOME" ? "pemasukan" : "pengeluaran"} berhasil disimpan.`,
          icon: "success",
          confirmButtonColor: "#10b981",
          timer: 2500,
          showConfirmButton: false,
        });
        router.push("/transactions");
      }
    });
  };

  const isIncome = type === "INCOME";

  return (
    <div className="space-y-4" ref={tableRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Tambah Baris
          </Button>
          {rows.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeRow(rows[rows.length - 1].id)}
              className="gap-1.5 text-muted-foreground"
            >
              <Minus className="w-4 h-4" />
              Hapus Terakhir
            </Button>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {filledCount} dari {rows.length} baris terisi
        </span>
      </div>

      {/* Spreadsheet Table */}
      <div className="border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${isIncome ? "bg-emerald-950/40" : "bg-rose-950/40"} border-b`}>
                <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider w-[18%] min-w-[140px]">
                  Jumlah (Rp)
                </th>
                <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider w-[26%] min-w-[200px]">
                  Kategori
                </th>
                <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider w-[15%] min-w-[140px]">
                  Tanggal
                </th>
                <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider w-[25%] min-w-[180px]">
                  Keterangan
                </th>
                <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider w-[8%] min-w-[70px]">
                  Bukti
                </th>
                <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider w-[8%] min-w-[50px]">
                  Batal
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-b last:border-b-0 transition-colors ${
                    row.error
                      ? "bg-red-950/20 border-l-2 border-l-red-500"
                      : index % 2 === 0
                        ? "bg-background"
                        : "bg-muted/20"
                  }`}
                >
                  {/* Amount */}
                  <td className="px-2 py-1.5">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={row.displayAmount}
                      onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                      className="h-10 text-right font-mono font-semibold border-0 bg-transparent focus-visible:ring-1 rounded-lg"
                    />
                  </td>
                  {/* Category */}
                  <td className="px-2 py-1.5">
                    <Select
                      value={row.categoryId}
                      onValueChange={(v) => updateRow(row.id, "categoryId", v ?? "")}
                    >
                      <SelectTrigger className="h-10 border-0 bg-transparent focus:ring-1 rounded-lg text-sm truncate">
                        <SelectValue placeholder="Pilih kategori">
                          {row.categoryId
                            ? categories.find((c) => c.id === row.categoryId)?.name
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.length === 0 ? (
                          <SelectItem value="__empty" disabled>
                            Belum ada kategori
                          </SelectItem>
                        ) : (
                          filteredCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </td>
                  {/* Date */}
                  <td className="px-2 py-1.5">
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, "date", e.target.value)}
                      className="h-10 border-0 bg-transparent focus-visible:ring-1 rounded-lg text-sm"
                    />
                  </td>
                  {/* Description */}
                  <td className="px-2 py-1.5">
                    <Input
                      type="text"
                      placeholder="Keterangan..."
                      value={row.description}
                      onChange={(e) => updateRow(row.id, "description", e.target.value)}
                      className="h-10 border-0 bg-transparent focus-visible:ring-1 rounded-lg text-sm"
                    />
                  </td>
                  {/* Receipt Upload */}
                  <td className="px-2 py-1.5 text-center">
                    <Label
                      htmlFor={`receipt-${row.id}`}
                      className="cursor-pointer inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title={row.receiptFile ? row.receiptFile.name : "Upload Kuitansi"}
                    >
                      {row.receiptFile ? (
                        <ImageIcon className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <UploadCloud className="w-5 h-5" />
                      )}
                      <Input
                        id={`receipt-${row.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => updateFile(row.id, e.target.files?.[0] || null)}
                      />
                    </Label>
                  </td>
                  {/* Delete */}
                  <td className="px-2 py-1.5 text-center">
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Row error messages */}
        {rows.some((r) => r.error) && (
          <div className="px-4 py-2 border-t bg-red-950/10 text-red-400 text-xs space-y-0.5">
            {rows.map((r, i) =>
              r.error ? (
                <p key={r.id}>
                  Baris {i + 1}: {r.error}
                </p>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || filledCount === 0}
        className={`w-full h-14 md:h-16 text-lg md:text-xl font-bold rounded-2xl shadow-xl transition-all ${
          isIncome
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
          <>
            <Save className="mr-2 h-5 w-5" />
            Simpan Semua ({filledCount} entri)
          </>
        )}
      </Button>
    </div>
  );
}
