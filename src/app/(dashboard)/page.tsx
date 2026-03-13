// =============================================================================
// Dashboard Summary Page
// =============================================================================
// The main dashboard page showing today's financial summary and quick actions.
// This is the first page users see after logging in.
//
// Design principle: big numbers, big buttons, minimal text — so even
// non-technical users can instantly understand their daily cashflow.
// =============================================================================

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, TrendingUp, TrendingDown, Wallet } from "lucide-react";

/**
 * Fetches today's income and expense totals.
 *
 * WHY aggregate on the server instead of fetching all transactions?
 * - Much less data transfer (just 2 numbers instead of N rows)
 * - The database does the heavy lifting (SUM is optimized in PostgreSQL)
 * - Faster page load for users with many daily transactions
 */
async function getTodaySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "INCOME",
        date: { gte: today, lt: tomorrow },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "EXPENSE",
        date: { gte: today, lt: tomorrow },
      },
    }),
  ]);

  const income = Number(incomeResult._sum.amount ?? 0);
  const expense = Number(expenseResult._sum.amount ?? 0);
  const balance = income - expense;

  return { income, expense, balance };
}

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

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const { income, expense, balance } = await getTodaySummary();

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Halo, {user?.name} 👋
        </h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income Card */}
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pemasukan Hari Ini
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatRupiah(income)}
            </div>
          </CardContent>
        </Card>

        {/* Expense Card */}
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pengeluaran Hari Ini
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatRupiah(expense)}
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Hari Ini
            </CardTitle>
            <Wallet className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {formatRupiah(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions — big, obvious buttons using Link directly */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/transactions/new?type=INCOME"
            className="flex items-center justify-center gap-3 h-20 text-lg font-semibold rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg transition-all"
          >
            <PlusCircle className="w-6 h-6" />
            Catat Pemasukan
          </Link>

          <Link
            href="/transactions/new?type=EXPENSE"
            className="flex items-center justify-center gap-3 h-20 text-lg font-semibold rounded-xl bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg transition-all"
          >
            <PlusCircle className="w-6 h-6" />
            Catat Pengeluaran
          </Link>
        </div>
      </div>
    </div>
  );
}
