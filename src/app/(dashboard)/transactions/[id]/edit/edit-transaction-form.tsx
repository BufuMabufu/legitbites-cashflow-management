"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, FileImage } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateTransaction } from "../../actions";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

type Transaction = {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | string;
  date: Date;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
};

interface EditTransactionFormProps {
  categories: Category[];
  transaction: Transaction;
}

export function EditTransactionForm({ categories, transaction }: EditTransactionFormProps) {
  const router = useRouter();
  
  const initialAmount = transaction.amount.toString();
  const [type, setType] = useState<"INCOME" | "EXPENSE">(transaction.type as "INCOME" | "EXPENSE");
  const [rawAmount, setRawAmount] = useState(initialAmount);
  const [displayAmount, setDisplayAmount] = useState(new Intl.NumberFormat("id-ID").format(Number(initialAmount)));
  const [fileName, setFileName] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string>(transaction.categoryId);
  const [isPending, startTransition] = useTransition();

  const filteredCategories = categories.filter((c) => c.type === type);

  // Default to the transaction's existing date
  const storedDate = new Date(transaction.date).toISOString().split("T")[0];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setRawAmount(value);
    
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
      const result = await updateTransaction(transaction.id, formData);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        await Swal.fire({
          title: "Berhasil!",
          text: `Transaksi ${type === "INCOME" ? "pemasukan" : "pengeluaran"} berhasil diperbarui.`,
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Edit Transaksi</h1>
        <p className="text-base md:text-lg text-muted-foreground mt-2">
          Ubah detail transaksi yang sudah ada
        </p>
      </div>

      {/* Type Toggle */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Button
          type="button"
          variant={type === "INCOME" ? "default" : "outline"}
          className={`h-14 md:h-16 text-base md:text-lg font-bold rounded-xl md:rounded-2xl transition-all ${
            type === "INCOME"
              ? "bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
              : ""
          }`}
          onClick={() => {
            setType("INCOME");
            setCategoryId(""); // Reset category when type changes
          }}
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
          onClick={() => {
            setType("EXPENSE");
            setCategoryId(""); // Reset category when type changes
          }}
        >
          💸 Pengeluaran
        </Button>
      </div>

      {/* Transaction Form */}
      <Card className="shadow-md">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg md:text-xl">
            Detail Transaksi
          </CardTitle>
          <CardDescription>Perbarui Nominal dan Kategori</CardDescription>
        </CardHeader>
        <CardContent className="md:p-8 pt-6">
          <form action={handleSubmit} className="space-y-6">
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

            <div className="space-y-3">
              <Label htmlFor="categoryId" className="text-base md:text-lg font-bold">
                Kategori
              </Label>
              <input type="hidden" name="categoryId" value={categoryId} />
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v || "")} required>
                <SelectTrigger className="w-full h-12 md:h-14 text-base md:text-lg rounded-xl">
                  <SelectValue placeholder="Pilih kategori">
                    {categoryId
                      ? (categories.find(c => c.id === categoryId)?.name || "Pilih kategori")
                      : undefined
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
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

            <div className="space-y-3">
              <Label htmlFor="date" className="text-base md:text-lg font-bold">
                Tanggal
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={storedDate}
                required
                className="h-12 md:h-14 text-base md:text-lg rounded-xl w-full"
              />
            </div>

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
                defaultValue={transaction.description || ""}
                placeholder="Contoh: Penjualan nasi goreng 50 porsi"
                className="h-12 md:h-14 text-base md:text-lg rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="receipt" className="text-base md:text-lg font-bold flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span>Foto Bukti Kuitansi {transaction.imageUrl && "Baru"}</span>
                {transaction.imageUrl && (
                  <a href={transaction.imageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <FileImage className="h-4 w-4" /> Lihat Bukti Lama
                  </a>
                )}
              </Label>

              <Label 
                htmlFor="receipt" 
                className="flex items-center justify-center w-full min-h-24 md:min-h-32 p-4 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors text-center"
              >
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm md:text-base font-medium text-muted-foreground break-all px-4">
                    {fileName ? fileName : (transaction.imageUrl ? "Pilih gambar untuk menimpa bukti lama" : "Klik di sini untuk memilih gambar")}
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
                "Simpan Perubahan"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="flex justify-center mt-4 mb-20 animate-fade-in animation-delay-500">
        <Button 
          variant="outline" 
          onClick={() => router.back()} 
          className="text-muted-foreground"
          type="button"
        >
          Batal & Kembali
        </Button>
      </div>
    </div>
  );
}
