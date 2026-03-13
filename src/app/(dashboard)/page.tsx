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
import { PlusCircle, TrendingUp, TrendingDown, Landmark } from "lucide-react";
import { SalesChart } from "./sales-chart";
import { ExpenseChart } from "./expense-chart";

/**
 * Fetches dashboard queries properly handling timezone logic.
 *
 * It generates UTC boundaries for "today" in Asia/Jakarta to query
 * transactions recorded on specific local dates.
 */
async function getDashboardData() {
  const now = new Date();
  const todayStr = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD
  
  const todayUTC = new Date(todayStr); // UTC midnight of current local day
  const tomorrowUTC = new Date(todayUTC);
  tomorrowUTC.setDate(tomorrowUTC.getDate() + 1);

  const sevenDaysAgoUTC = new Date(todayUTC);
  sevenDaysAgoUTC.setDate(sevenDaysAgoUTC.getDate() - 6); 

  const [
    todayIncomeResult, 
    todayExpenseResult, 
    allTimeIncome, 
    allTimeExpense, 
    weeklyIncomeTransactions,
    weeklyExpenseTransactions
  ] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "INCOME", date: { gte: todayUTC, lt: tomorrowUTC } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE", date: { gte: todayUTC, lt: tomorrowUTC } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "INCOME" }
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE" }
    }),
    prisma.transaction.groupBy({
      by: ["date"],
      _sum: { amount: true },
      where: {
        type: "INCOME",
        date: { gte: sevenDaysAgoUTC, lt: tomorrowUTC }
      },
      orderBy: { date: "asc" }
    }),
    prisma.transaction.groupBy({
      by: ["date"],
      _sum: { amount: true },
      where: {
        type: "EXPENSE",
        date: { gte: sevenDaysAgoUTC, lt: tomorrowUTC }
      },
      orderBy: { date: "asc" }
    })
  ]);

  const todayIncome = Number(todayIncomeResult._sum.amount ?? 0);
  const todayExpense = Number(todayExpenseResult._sum.amount ?? 0);

  const totalIncome = Number(allTimeIncome._sum.amount ?? 0);
  const totalExpense = Number(allTimeExpense._sum.amount ?? 0);
  const totalBalance = totalIncome - totalExpense;

  // Build chart timeline
  const chartDataIncomeMap = new Map<string, number>();
  const chartDataExpenseMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayUTC);
    d.setDate(d.getDate() - i);
    const dateLabel = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    chartDataIncomeMap.set(dateLabel, 0);
    chartDataExpenseMap.set(dateLabel, 0);
  }

  // Populate income data
  for (const group of weeklyIncomeTransactions) {
    const dateLabel = new Date(group.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    if (chartDataIncomeMap.has(dateLabel)) {
      chartDataIncomeMap.set(dateLabel, (chartDataIncomeMap.get(dateLabel) || 0) + Number(group._sum.amount ?? 0));
    }
  }

  // Populate expense data
  for (const group of weeklyExpenseTransactions) {
    const dateLabel = new Date(group.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    if (chartDataExpenseMap.has(dateLabel)) {
      chartDataExpenseMap.set(dateLabel, (chartDataExpenseMap.get(dateLabel) || 0) + Number(group._sum.amount ?? 0));
    }
  }

  const chartDataIncome = Array.from(chartDataIncomeMap.entries()).map(([date, income]) => ({
    date,
    income
  }));

  const chartDataExpense = Array.from(chartDataExpenseMap.entries()).map(([date, expense]) => ({
    date,
    expense
  }));

  return { todayIncome, todayExpense, totalBalance, chartDataIncome, chartDataExpense };
}

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
  const { todayIncome, todayExpense, totalBalance, chartDataIncome, chartDataExpense } = await getDashboardData();

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta"
  });

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Halo, {user?.name} 👋
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mt-1">{today}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {/* Total Saldo Card */}
        <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base md:text-lg font-medium text-muted-foreground">
              Total Saldo Utama
            </CardTitle>
            <Landmark className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl md:text-4xl font-bold truncate ${totalBalance >= 0 ? "text-indigo-600" : "text-red-600"}`}>
              {formatRupiah(totalBalance)}
            </div>
          </CardContent>
        </Card>

        {/* Income Card */}
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base md:text-lg font-medium text-muted-foreground">
              Pemasukan Hari Ini
            </CardTitle>
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold text-emerald-600 truncate">
              {formatRupiah(todayIncome)}
            </div>
          </CardContent>
        </Card>

        {/* Expense Card */}
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base md:text-lg font-medium text-muted-foreground">
              Pengeluaran Hari Ini
            </CardTitle>
            <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold text-red-600 truncate">
              {formatRupiah(todayExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SalesChart data={chartDataIncome} />
        <ExpenseChart data={chartDataExpense} />
      </div>

      {/* Quick Actions — bigger buttons for seniors */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Link
            href="/transactions/new?type=INCOME"
            className="flex flex-col items-center justify-center gap-3 h-32 md:h-40 text-2xl md:text-3xl font-bold rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg transition-all"
          >
            <PlusCircle className="w-10 h-10 md:w-14 md:h-14" />
            <span>Catat Pemasukan</span>
          </Link>

          <Link
            href="/transactions/new?type=EXPENSE"
            className="flex flex-col items-center justify-center gap-3 h-32 md:h-40 text-2xl md:text-3xl font-bold rounded-2xl bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg transition-all"
          >
            <PlusCircle className="w-10 h-10 md:w-14 md:h-14" />
            <span>Catat Pengeluaran</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
