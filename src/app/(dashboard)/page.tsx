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
import { PlusCircle, TrendingUp, TrendingDown, Landmark, Sparkles } from "lucide-react";
import { SalesChart } from "./sales-chart";
import { ExpenseChart } from "./expense-chart";
import { DashboardFilter } from "./dashboard-filter";
import { ExpenseDonutChart } from "./expense-donut-chart";
import { RecentTransactionsTable } from "./recent-transactions-table";
import { IncomeDonutChart } from "./income-donut-chart";

/**
 * Helper to determine date range based on the query parameter
 */
function getDateRange(rangeParam: string): { gte: Date; lt: Date; label: string } {
  const now = new Date();
  const dateStr = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const todayUTC = new Date(dateStr); // UTC midnight of current local day
  const tomorrowUTC = new Date(todayUTC);
  tomorrowUTC.setDate(tomorrowUTC.getDate() + 1);

  let gte = todayUTC;
  const lt = tomorrowUTC;
  let label = "Hari Ini";

  if (rangeParam === "all") {
    gte = new Date(2000, 0, 1); // effectively all-time
    label = "Semua Waktu";
  } else if (rangeParam === "7d") {
    gte = new Date(todayUTC);
    gte.setDate(gte.getDate() - 6);
    label = "7 Hari Terakhir";
  } else if (rangeParam === "this_month") {
    gte = new Date(todayUTC.getFullYear(), todayUTC.getMonth(), 1);
    label = "Bulan Ini";
  } else if (rangeParam === "this_year") {
    gte = new Date(todayUTC.getFullYear(), 0, 1);
    label = "Tahun Ini";
  }

  return { gte, lt, label };
}

/**
 * Fetches dashboard queries properly handling timezone logic and selected range
 */
async function getDashboardData(rangeParam: string) {
  const { gte, lt, label: rangeLabel } = getDateRange(rangeParam);

  // For the line charts, if range is "today", we still want to show a 7-day trend
  // so the chart doesn't look empty and weird with flat zeros.
  let chartGte = gte;
  if (rangeParam === "today") {
    const todayUTC = new Date(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }));
    chartGte = new Date(todayUTC);
    chartGte.setDate(chartGte.getDate() - 6);
  }

  const [
    rangeIncomeResult, 
    rangeExpenseResult, 
    allTimeIncome, 
    allTimeExpense, 
    rangeIncomeTransactions,
    rangeExpenseTransactions,
    topExpenseCategories,
    topIncomeCategories,
    recentTransactions
  ] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "INCOME", date: { gte, lt }, deletedAt: null },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE", date: { gte, lt }, deletedAt: null },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "INCOME", deletedAt: null }
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE", deletedAt: null }
    }),
    prisma.transaction.groupBy({
      by: ["date"],
      _sum: { amount: true },
      where: { type: "INCOME", date: { gte: chartGte, lt }, deletedAt: null },
      orderBy: { date: "asc" }
    }),
    prisma.transaction.groupBy({
      by: ["date"],
      _sum: { amount: true },
      where: { type: "EXPENSE", date: { gte: chartGte, lt }, deletedAt: null },
      orderBy: { date: "asc" }
    }),
    // Top Expense Categories (Donut)
    prisma.transaction.groupBy({
      by: ["categoryId"],
      _sum: { amount: true },
      where: { type: "EXPENSE", date: { gte, lt }, deletedAt: null },
      orderBy: { _sum: { amount: "desc" } }
    }),
    // Top Income Categories (Donut)
    prisma.transaction.groupBy({
      by: ["categoryId"],
      _sum: { amount: true },
      where: { type: "INCOME", date: { gte, lt }, deletedAt: null },
      orderBy: { _sum: { amount: "desc" } }
    }),
    prisma.transaction.findMany({
      where: { date: { gte, lt }, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: true }
    })
  ]);

  const currentIncome = Number(rangeIncomeResult._sum.amount ?? 0);
  const currentExpense = Number(rangeExpenseResult._sum.amount ?? 0);

  // Constraints: Safe total balance calculation. NEVER ALTER THIS LOGIC.
  const totalIncome = Number(allTimeIncome._sum.amount ?? 0);
  const totalExpense = Number(allTimeExpense._sum.amount ?? 0);
  const totalBalance = totalIncome - totalExpense;

  // Build Linear Chart data timeline (We'll build it based on actual data points to scale well with large ranges)
  const chartDataIncomeMap = new Map<string, number>();
  const chartDataExpenseMap = new Map<string, number>();

  // Use a sensible strategy: adapt the grouping format based on the selected range.
  const isMonthGrouping = rangeParam === "this_year" || rangeParam === "all";
  const dateLocales: Intl.DateTimeFormatOptions = isMonthGrouping 
    ? { month: "long", year: "numeric" } 
    : { day: "numeric", month: "short", year: "numeric" };

  if (rangeParam === "today" || rangeParam === "7d") {
    const todayUTC = new Date(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }));
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayUTC);
      d.setDate(d.getDate() - i);
      const dateLabel = d.toLocaleDateString("id-ID", dateLocales);
      chartDataIncomeMap.set(dateLabel, 0);
      chartDataExpenseMap.set(dateLabel, 0);
    }
  } else if (rangeParam === "this_year") {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentYear, i, 1);
      const dateLabel = d.toLocaleDateString("id-ID", dateLocales);
      chartDataIncomeMap.set(dateLabel, 0);
      chartDataExpenseMap.set(dateLabel, 0);
    }
  } else if (rangeParam === "this_month") {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    for (let i = 1; i <= currentDay; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const dateLabel = d.toLocaleDateString("id-ID", dateLocales);
      chartDataIncomeMap.set(dateLabel, 0);
      chartDataExpenseMap.set(dateLabel, 0);
    }
  }

  for (const group of rangeIncomeTransactions) {
    const dateLabel = new Date(group.date).toLocaleDateString("id-ID", dateLocales);
    chartDataIncomeMap.set(dateLabel, (chartDataIncomeMap.get(dateLabel) || 0) + Number(group._sum.amount ?? 0));
  }
  for (const group of rangeExpenseTransactions) {
    const dateLabel = new Date(group.date).toLocaleDateString("id-ID", dateLocales);
    chartDataExpenseMap.set(dateLabel, (chartDataExpenseMap.get(dateLabel) || 0) + Number(group._sum.amount ?? 0));
  }

  const chartDataIncome = Array.from(chartDataIncomeMap.entries()).map(([date, income]) => ({ date, income }));
  const chartDataExpense = Array.from(chartDataExpenseMap.entries()).map(([date, expense]) => ({ date, expense }));

  // Build Donut Chart Data for Expenses
  const donutData: { name: string; value: number; color: string }[] = [];
  const expensePalette = ["#f43f5e", "#fb923c", "#facc15", "#c084fc", "#60a5fa"];
  let topCategoryName = "belum ada data";

  // Build Donut Chart Data for Income
  const incomeDonutData: { name: string; value: number; color: string }[] = [];
  const incomePalette = ["#10b981", "#14b8a6", "#06b6d4", "#8b5cf6", "#f59e0b"];

  // Collect all category IDs we need
  const allCatIds = [
    ...topExpenseCategories.map(c => c.categoryId),
    ...topIncomeCategories.map(c => c.categoryId)
  ];
  const categoriesInfo = allCatIds.length > 0
    ? await prisma.category.findMany({ where: { id: { in: [...new Set(allCatIds)] }, deletedAt: null } })
    : [];

  if (topExpenseCategories.length > 0) {
    topExpenseCategories.forEach((group, index) => {
      const cat = categoriesInfo.find(c => c.id === group.categoryId);
      if (index === 0 && cat) topCategoryName = cat.name;
      donutData.push({
        name: cat ? cat.name : "Lainnya",
        value: Number(group._sum.amount ?? 0),
        color: expensePalette[Math.min(index, expensePalette.length - 1)]
      });
    });
  }

  if (topIncomeCategories.length > 0) {
    topIncomeCategories.forEach((group, index) => {
      const cat = categoriesInfo.find(c => c.id === group.categoryId);
      incomeDonutData.push({
        name: cat ? cat.name : "Lainnya",
        value: Number(group._sum.amount ?? 0),
        color: incomePalette[Math.min(index, incomePalette.length - 1)]
      });
    });
  }

  // Insight Generator
  const formatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  let insightMessage = `Sejauh ${rangeLabel.toLowerCase()} belum ada transaksi yang tercatat. Yuk mulai pembukuan!`;
  
  if (currentIncome > 0 || currentExpense > 0) {
    if (currentIncome > currentExpense) {
      const margin = currentIncome - currentExpense;
      insightMessage = `Alhamdulillah, pemasukan ${rangeLabel.toLowerCase()} lebih tinggi ${formatter.format(margin)} dibanding pengeluaran. Kategori paling menguras biaya ada di "${topCategoryName}". Pertahankan margin positif ini!`;
    } else if (currentExpense > currentIncome) {
      const minus = currentExpense - currentIncome;
      insightMessage = `Hati-hati Bunda, pengeluaran ${rangeLabel.toLowerCase()} lebih besar ${formatter.format(minus)} daripada pemasukan. Pengeluaran tertinggi ada di kategori "${topCategoryName}". Coba tinjau ulang efisiensinya ya!`;
    } else {
      insightMessage = `Pemasukan dan pengeluaran ${rangeLabel.toLowerCase()} sama seimbang. Ayo genjot lagi penjualannya!`;
    }
  }

  return { 
    currentIncome, 
    currentExpense, 
    totalBalance, 
    chartDataIncome, 
    chartDataExpense,
    donutData,
    incomeDonutData,
    recentTransactions,
    rangeLabel,
    insightMessage
  };
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const rangeParam = params.range || "this_month";

  const { 
    currentIncome, 
    currentExpense, 
    totalBalance, 
    chartDataIncome, 
    chartDataExpense,
    donutData,
    incomeDonutData,
    recentTransactions,
    rangeLabel,
    insightMessage
  } = await getDashboardData(rangeParam);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta"
  });

  // Determine chart title: if 'today', we actually fetched 7 days of context
  const chartLabel = rangeParam === "today" ? "7 Hari Terakhir" : rangeLabel;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Header: Greeting & Filter (Sticky) */}
      <div className="sticky top-0 z-30 -mx-4 -mt-4 p-4 lg:-mx-6 lg:-mt-6 lg:p-6 bg-background/95 backdrop-blur-md flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 shadow-xs">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Halo, {user?.name} 👋
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-1">{today}</p>
        </div>
        <DashboardFilter />
      </div>

      {/* Insight Auto-Summary */}
      <div id="dashboard-content" className="scroll-mt-32">
        <Card className="border-indigo-100 bg-linear-to-r from-indigo-50/50 to-blue-50/50 dark:border-indigo-900/50 dark:from-indigo-950/20 dark:to-blue-900/10 shadow-sm">
        <CardContent className="p-4 md:p-6 flex items-start gap-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full shrink-0">
            <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1 text-slate-800 dark:text-slate-200">Insight {rangeLabel}</h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              {insightMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {/* Total Saldo Card - STATIC */}
        <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/20 max-h-36">
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
            <p className="text-xs text-muted-foreground opacity-70 mt-1">Keseluruhan uang laci</p>
          </CardContent>
        </Card>

        {/* Income Card - DYNAMIC */}
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20 max-h-36">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base md:text-lg font-medium text-muted-foreground">
              Pemasukan {rangeLabel}
            </CardTitle>
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold text-emerald-600 truncate">
              {formatRupiah(currentIncome)}
            </div>
          </CardContent>
        </Card>

        {/* Expense Card - DYNAMIC */}
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20 max-h-36">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base md:text-lg font-medium text-muted-foreground">
              Pengeluaran {rangeLabel}
            </CardTitle>
            <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold text-red-600 truncate">
              {formatRupiah(currentExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Body: Charts & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left 2/3 Column: Charts then Quick Actions */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Line Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <SalesChart data={chartDataIncome} rangeLabel={chartLabel} />
            <ExpenseChart data={chartDataExpense} rangeLabel={chartLabel} />
          </div>

          {/* Recent Transactions Table */}
          <RecentTransactionsTable 
            transactions={recentTransactions.map((tx) => ({ 
              id: tx.id,
              type: tx.type,
              amount: Number(tx.amount),
              description: tx.description,
              date: tx.date,
              category: { name: tx.category.name }
            }))} 
          />

          {/* Quick Actions — clean, equal-height buttons */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/transactions/new?type=INCOME"
                className="flex items-center justify-center gap-3 h-16 md:h-20 text-lg md:text-xl font-bold rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <PlusCircle className="w-6 h-6 md:w-7 md:h-7 shrink-0" />
                <span>Pemasukan</span>
              </Link>
              <Link
                href="/transactions/new?type=EXPENSE"
                className="flex items-center justify-center gap-3 h-16 md:h-20 text-lg md:text-xl font-bold rounded-2xl bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <PlusCircle className="w-6 h-6 md:w-7 md:h-7 shrink-0" />
                <span>Pengeluaran</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Sidebar on Desktop: Donut Charts */}
        <div className="space-y-4 md:space-y-6">
          <IncomeDonutChart data={incomeDonutData} totalIncome={currentIncome} />
          <ExpenseDonutChart data={donutData} totalExpense={currentExpense} />
        </div>
      </div>

    </div>
  );
}
