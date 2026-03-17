"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, Download, Search, Trash2, FileImage, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import Link from "next/link";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { deleteTransaction, deleteAllTransactions, restoreTransactions } from "./actions";
import { Undo2 } from "lucide-react";

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
  currentPage: number;
  totalPages: number;
  totalItems: number;
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

export function TransactionDataTable({ 
  transactions: initialTransactions, 
  userRole,
  currentPage,
  totalPages,
  totalItems
}: TransactionDataTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    return {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };
  });
  
  const [isPending, startTransition] = useTransition();
  const [lastDeletedAt, setLastDeletedAt] = useState<string | null>(null);

  // Helper to update URL with new filters and reset page to 1
  const updateFilters = useCallback((newSearch: string, newRange?: DateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always reset to page 1 on filter change
    params.set("page", "1");
    
    if (newSearch) {
      params.set("q", newSearch);
    } else {
      params.delete("q");
    }
    
    if (newRange?.from) {
      params.set("from", format(newRange.from, "yyyy-MM-dd"));
    } else {
      params.delete("from");
    }
    
    if (newRange?.to) {
      params.set("to", format(newRange.to, "yyyy-MM-dd"));
    } else {
      params.delete("to");
    }
    
    router.push(`/transactions?${params.toString()}`);
  }, [searchParams, router]);

  // Debounced search logic
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      updateFilters(searchQuery, dateRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, dateRange, updateFilters]);

  // Handle date range change
  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    updateFilters(searchQuery, range);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Hapus Transaksi?",
      text: "Data akan dipindahkan ke tempat sampah sementara.",
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
          setLastDeletedAt(res.deletedAt || null);
          toast.success("Transaksi berhasil dihapus.", {
            action: {
              label: "Undo",
              onClick: () => handleUndo(res.deletedAt!),
            },
          });
        }
      });
    }
  };

  const handleDeleteAll = async () => {
    const result = await Swal.fire({
      title: "Hapus Semua Data?",
      text: "Ketik 'ya saya yakin menghapus semua' untuk mengonfirmasi:",
      input: "text",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Hapus Semua",
      cancelButtonText: "Batal",
      inputValidator: (value) => {
        if (value !== "ya saya yakin menghapus semua") {
          return "Konfirmasi tidak sesuai!";
        }
      },
    });

    if (result.isConfirmed) {
      startTransition(async () => {
        const res = await deleteAllTransactions();
        if (res?.error) {
          toast.error(res.error);
        } else if (res?.success) {
          setLastDeletedAt(res.deletedAt || null);
          toast.success("Semua transaksi berhasil dihapus.", {
            action: {
              label: "Undo",
              onClick: () => handleUndo(res.deletedAt!),
            },
          });
        }
      });
    }
  };

  const handleUndo = async (timestamp: string) => {
    const result = await Swal.fire({
      title: "Batalkan Penghapusan?",
      text: "Data yang dihapus akan dikembalikan.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Kembalikan!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      startTransition(async () => {
        const res = await restoreTransactions(timestamp);
        if (res?.error) {
          toast.error(res.error);
        } else if (res?.success) {
          setLastDeletedAt(null);
          toast.success("Berhasil memulihkan data.");
        }
      });
    }
  };

  /**
   * Utility to export currently filtered transactions to a CSV file.
   * CSV format uses comma separation. Escapes double quotes if necessary.
   */
   const handleExportCSV = () => {
    if (initialTransactions.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }

    // Define CSV Headers
    const headers = ["Tanggal", "Kategori", "Catatan", "Tipe", "Nominal", "Pencatat"];
    
    // Build CSV rows
    const rows = initialTransactions.map((tx: Transaction) => {
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
                onSelect={handleDateSelect}
                numberOfMonths={2}
                locale={id}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {/* Undo Button */}
          {lastDeletedAt && (
            <Button
              variant="outline"
              onClick={() => handleUndo(lastDeletedAt)}
              className="h-11 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 w-full sm:w-auto"
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Urungkan (Undo)
            </Button>
          )}

          {/* Delete All Button */}
          {userRole === "OWNER" && (
            <Button
              variant="outline"
              onClick={handleDeleteAll}
              className="h-11 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Semua Data
            </Button>
          )}

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
              {initialTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Tidak ada data transaksi yang sesuai.
                  </TableCell>
                </TableRow>
              ) : (
                initialTransactions.map((tx: Transaction) => (
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
      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          Menampilkan <span className="font-medium text-foreground">{Math.min((currentPage - 1) * 10 + 1, totalItems)}</span> -{" "}
          <span className="font-medium text-foreground">{Math.min(currentPage * 10, totalItems)}</span> dari{" "}
          <span className="font-medium text-foreground">{totalItems}</span> transaksi
        </div>
        
        <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/transactions?page=${currentPage - 1}`)}
            disabled={currentPage <= 1 || isPending}
            className="gap-1 h-9 flex-1 sm:flex-initial"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>
          <div className="bg-muted px-3 h-9 flex items-center justify-center rounded-md text-sm font-medium min-w-12">
            {currentPage} / {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/transactions?page=${currentPage + 1}`)}
            disabled={currentPage >= totalPages || isPending}
            className="gap-1 h-9 flex-1 sm:flex-initial"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
