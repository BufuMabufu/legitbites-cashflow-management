"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, Download, Search, Trash2, FileImage, Pencil } from "lucide-react";
import { DateRange } from "react-day-picker";
import Link from "next/link";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { deleteTransaction } from "./actions";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Make sure to reuse the same structure the parent page fetches
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

interface TransactionDataTableProps {
  transactions: Transaction[];
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

function formatDateDisplay(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TransactionDataTable({ transactions: initialTransactions, userRole }: TransactionDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isPending, startTransition] = useTransition();

  // Handle client-side filtering
  const filteredTransactions = initialTransactions.filter((tx) => {
    // Search match (category name or description)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      tx.category.name.toLowerCase().includes(searchLower) ||
      (tx.description && tx.description.toLowerCase().includes(searchLower));

    // Date range match
    let matchesDate = true;
    if (dateRange?.from) {
      const txDate = new Date(tx.date);
      // Reset time for safe comparison
      txDate.setHours(0, 0, 0, 0);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);

      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = txDate >= fromDate && txDate <= toDate;
      } else {
        matchesDate = txDate >= fromDate;
      }
    }

    return matchesSearch && matchesDate;
  });

  const handleDelete = async (id: string) => {
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
      formData.set("id", id);

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

  /**
   * Utility to export currently filtered transactions to a CSV file.
   * CSV format uses comma separation. Escapes double quotes if necessary.
   */
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }

    // Define CSV Headers
    const headers = ["Tanggal", "Kategori", "Catatan", "Tipe", "Nominal", "Pencatat"];
    
    // Build CSV rows
    const rows = filteredTransactions.map((tx) => {
      const date = format(new Date(tx.date), "dd/MM/yyyy");
      const category = `"${tx.category.name}"`;
      const description = tx.description ? `"${tx.description.replace(/"/g, '""')}"` : "-";
      const type = tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran";
      const amount = tx.amount.toString();
      const user = `"${tx.user.name}"`;

      return [date, category, description, type, amount, user].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);

    // Create a temporary anchor to trigger download
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Add current timestamp to filename
    const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
    link.setAttribute("download", `laporan_transaksi_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Berhasil mengekspor data transaksi!");
  };

  return (
    <div className="space-y-4">
      {/* Table Toolbox / Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari catatan atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>

          {/* Date Range Picker Popover */}
          <Popover>
            <PopoverTrigger
              className={cn(
                "inline-flex shrink-0 items-center justify-start rounded-lg border border-input bg-background px-3 text-sm font-medium transition-all hover:bg-muted hover:text-foreground h-11 w-full sm:w-[280px]",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y", { locale: id })} -{" "}
                    {format(dateRange.to, "LLL dd, y", { locale: id })}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y", { locale: id })
                )
              ) : (
                <span>Filter rentang tanggal</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={id}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Export Button */}
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          className="h-11 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 w-full sm:w-auto whitespace-nowrap"
        >
          <Download className="mr-2 h-4 w-4" />
          Export ke CSV
        </Button>
      </div>

      {/* The Data Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px] font-semibold">Tanggal</TableHead>
                <TableHead className="font-semibold">Kategori</TableHead>
                <TableHead className="font-semibold">Catatan</TableHead>
                <TableHead className="text-right font-semibold">Pemasukan</TableHead>
                <TableHead className="text-right font-semibold">Pengeluaran</TableHead>
                <TableHead className="text-center w-[120px] font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Tidak ada data transaksi yang sesuai.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/30">
                    {/* Timestamp */}
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDateDisplay(tx.date)}
                    </TableCell>
                    
                    {/* Category Label */}
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {tx.category.name}
                      </Badge>
                    </TableCell>

                    {/* Description */}
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {tx.description || "-"}
                      {userRole === "OWNER" && (
                        <div className="text-xs text-muted-foreground opacity-60 mt-0.5">
                          Oleh: {tx.user.name}
                        </div>
                      )}
                    </TableCell>

                    {/* Income Column */}
                    <TableCell className="text-right">
                      {tx.type === "INCOME" ? (
                        <span className="text-emerald-600 font-semibold">{formatRupiah(tx.amount)}</span>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </TableCell>

                    {/* Expense Column */}
                    <TableCell className="text-right">
                      {tx.type === "EXPENSE" ? (
                        <span className="text-red-600 font-semibold">{formatRupiah(tx.amount)}</span>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {tx.imageUrl ? (
                          <a 
                            href={tx.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            title="Lihat Bukti Foto"
                          >
                            <FileImage className="h-4 w-4" />
                          </a>
                        ) : (
                          <div className="w-8" /> /* Empty placeholder to align buttons */
                        )}
                        
                        {userRole === "OWNER" && (
                          <div className="flex items-center gap-1">
                            <Link 
                              href={`/transactions/${tx.id}/edit`}
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "icon" }),
                                "h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50"
                              )}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(tx.id)}
                              disabled={isPending}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
