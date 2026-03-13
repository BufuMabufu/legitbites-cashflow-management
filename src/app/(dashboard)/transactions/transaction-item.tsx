"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { deleteTransaction } from "./actions";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: Date;
  category: { name: string };
  user: { name: string };
  imageUrl?: string | null;
}

interface TransactionItemProps {
  transaction: Transaction;
  userRole: string;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TransactionItem({ transaction: tx, userRole }: TransactionItemProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Hapus Transaksi?",
      text: "Data yang dihapus tidak dapat dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      const formData = new FormData();
      formData.set("id", tx.id);

      startTransition(async () => {
        const res = await deleteTransaction(formData);
        if (res?.error) {
          toast.error(res.error);
        } else if (res?.success) {
          toast.success("Transaksi berhasil dihapus.");
        }
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow relative group">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-10 md:pr-0">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant="secondary"
                className={`text-sm md:text-base px-3 py-1 ${
                  tx.type === "INCOME"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
              </Badge>
              <span className="text-base md:text-xl font-medium text-muted-foreground truncate">
                {tx.category.name}
              </span>
            </div>
            {tx.description && (
              <p className="text-lg md:text-2xl font-semibold text-foreground truncate mt-1">
                {tx.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 text-sm md:text-lg text-muted-foreground">
              <span>{formatDate(tx.date)}</span>
              {userRole === "OWNER" && (
                <>
                  <span>•</span>
                  <span>oleh {tx.user.name}</span>
                </>
              )}
              {tx.imageUrl && (
                <>
                  <span>•</span>
                  <a href={tx.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                    Lihat Bukti
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Amount */}
            <div
              className={`text-2xl md:text-4xl font-extrabold whitespace-nowrap ${
                tx.type === "INCOME" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {tx.type === "INCOME" ? "+" : "-"}
              {formatRupiah(Number(tx.amount))}
            </div>

            {/* Delete Button - Only visible for OWNER */}
            {userRole === "OWNER" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isPending}
                className="text-destructive hover:bg-destructive/10 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 md:relative md:top-0 md:right-0 h-14 w-14"
                title="Hapus Transaksi"
              >
                <Trash2 className="h-8 w-8" />
              </Button>
            )}
          </div>
          
          {/* Mobile Delete Button */}
          {userRole === "OWNER" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10 flex md:hidden absolute top-2 right-2 h-12 w-12"
              title="Hapus Transaksi"
            >
              <Trash2 className="h-6 w-6" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
