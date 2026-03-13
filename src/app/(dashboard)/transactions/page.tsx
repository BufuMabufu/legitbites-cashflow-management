// =============================================================================
// Transaction History Page
// =============================================================================
// Displays a list of all transactions, color-coded by type.
//
// RBAC behavior:
// - OWNER: Sees ALL transactions from all users
// - STAFF: Sees ONLY their own transactions
//
// WHY server-side filtering instead of client-side?
// - STAFF should NEVER receive other users' transaction data
// - Sending all data and filtering client-side leaks sensitive info
// - Database filtering is faster and uses less bandwidth
// =============================================================================

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

/**
 * Formats a number as Indonesian Rupiah currency.
 */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date for display in Indonesian locale.
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // RBAC: OWNER sees all, STAFF sees only their own
  const whereClause = user.role === "OWNER" ? {} : { userId: user.id };

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: {
      category: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="text-muted-foreground">
            {user.role === "OWNER"
              ? "Semua transaksi dari seluruh tim"
              : "Transaksi yang kamu catat"}
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="inline-flex items-center justify-center h-12 px-5 text-base rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg transition-all"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Catat Baru
        </Link>
      </div>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">
              Belum ada transaksi yang dicatat.
            </p>
            <Link
              href="/transactions/new"
              className="inline-flex items-center justify-center rounded-xl h-12 px-6 bg-primary text-primary-foreground font-medium"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Catat Transaksi Pertama
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Card key={tx.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={
                          tx.type === "INCOME"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }
                      >
                        {tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {tx.category.name}
                      </span>
                    </div>
                    {tx.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {tx.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(tx.date)}</span>
                      {user.role === "OWNER" && (
                        <>
                          <span>•</span>
                          <span>oleh {tx.user.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount — right-aligned, colored */}
                  <div
                    className={`text-lg font-bold whitespace-nowrap ml-4 ${
                      tx.type === "INCOME"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {formatRupiah(Number(tx.amount))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
