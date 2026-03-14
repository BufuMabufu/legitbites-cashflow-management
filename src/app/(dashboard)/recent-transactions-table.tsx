"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: Date;
  category: { name: string };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
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
    month: "short",
    day: "numeric",
  });
}

export function RecentTransactionsTable({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            5 Transaksi Terakhir
          </CardTitle>
          <CardDescription className="text-base mt-1">Aktivitas arus kas terbaru</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0 overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Belum ada transaksi sama sekali.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[100px] font-semibold text-base py-3">Tanggal</TableHead>
                <TableHead className="font-semibold text-base py-3">Kategori</TableHead>
                <TableHead className="text-right font-semibold text-base py-3">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/30 group">
                  <TableCell className="font-medium text-base text-muted-foreground whitespace-nowrap">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="outline" className="text-xs bg-background">
                        {tx.category.name}
                      </Badge>
                      <span className="text-sm md:text-base font-medium truncate max-w-[200px]">
                        {tx.description || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-semibold text-base md:text-xl ${
                        tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {formatRupiah(Number(tx.amount))}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
