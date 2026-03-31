// =============================================================================
// AI Chat API Route — Gemini 2.5 Flash (with Financial Data Context)
// =============================================================================
// Handles streaming chat requests using Google Gemini 2.5 Flash via Vercel
// AI SDK. Fetches real financial data from the database and injects it into
// the system prompt so the AI can provide data-driven, personalized insights.
//
// DATA FLOW:
// 1. Auth check → get user session
// 2. Fetch financial summary from Prisma (income, expense, balance, recent txns)
// 3. Build system prompt with real data context
// 4. Stream AI response to the client
// =============================================================================

import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Financial Data Fetcher — pulls summary data from the database
// ---------------------------------------------------------------------------
async function getFinancialContext() {
  // Get Jakarta "today" boundaries
  const jakartaTodayStr = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const today = new Date(`${jakartaTodayStr}T00:00:00Z`);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  // Start of this month
  const parts = jakartaTodayStr.split("-").map(Number);
  const monthStart = new Date(Date.UTC(parts[0], parts[1] - 1, 1));

  // Start of 7 days ago
  const weekAgo = new Date(today);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);

  const [
    // All-time totals
    allTimeIncome,
    allTimeExpense,
    // This month totals
    monthIncome,
    monthExpense,
    // Today totals
    todayIncome,
    todayExpense,
    // 7-day totals
    weekIncome,
    weekExpense,
    // Transaction count
    totalTransactions,
    // Top expense categories (this month)
    topExpenseCategories,
    // Top income categories (this month)
    topIncomeCategories,
    // Recent transactions (last 10)
    recentTransactions,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "INCOME", deletedAt: null },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE", deletedAt: null },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "INCOME",
        date: { gte: monthStart, lt: tomorrow },
        deletedAt: null,
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "EXPENSE",
        date: { gte: monthStart, lt: tomorrow },
        deletedAt: null,
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "INCOME",
        date: { gte: today, lt: tomorrow },
        deletedAt: null,
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "EXPENSE",
        date: { gte: today, lt: tomorrow },
        deletedAt: null,
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "INCOME",
        date: { gte: weekAgo, lt: tomorrow },
        deletedAt: null,
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "EXPENSE",
        date: { gte: weekAgo, lt: tomorrow },
        deletedAt: null,
      },
    }),
    prisma.transaction.count({ where: { deletedAt: null } }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      _sum: { amount: true },
      where: {
        type: "EXPENSE",
        date: { gte: monthStart, lt: tomorrow },
        deletedAt: null,
      },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      _sum: { amount: true },
      where: {
        type: "INCOME",
        date: { gte: monthStart, lt: tomorrow },
        deletedAt: null,
      },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: { deletedAt: null },
      orderBy: { date: "desc" },
      take: 10,
      include: { category: true, user: { select: { name: true } } },
    }),
  ]);

  // Resolve category names for top categories
  const allCatIds = [
    ...topExpenseCategories.map((c) => c.categoryId),
    ...topIncomeCategories.map((c) => c.categoryId),
  ];
  const categories =
    allCatIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: [...new Set(allCatIds)] } },
        })
      : [];

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const dateFmt = (d: Date) =>
    d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });

  // Build structured data
  const totalIncomeAll = Number(allTimeIncome._sum.amount ?? 0);
  const totalExpenseAll = Number(allTimeExpense._sum.amount ?? 0);
  const balance = totalIncomeAll - totalExpenseAll;

  const monthIncomeVal = Number(monthIncome._sum.amount ?? 0);
  const monthExpenseVal = Number(monthExpense._sum.amount ?? 0);

  const todayIncomeVal = Number(todayIncome._sum.amount ?? 0);
  const todayExpenseVal = Number(todayExpense._sum.amount ?? 0);

  const weekIncomeVal = Number(weekIncome._sum.amount ?? 0);
  const weekExpenseVal = Number(weekExpense._sum.amount ?? 0);

  // Top categories breakdown
  const topExpenseList = topExpenseCategories
    .map((g) => {
      const cat = categories.find((c) => c.id === g.categoryId);
      return `  - ${cat?.name ?? "Lainnya"}: ${fmt(Number(g._sum.amount ?? 0))}`;
    })
    .join("\n");

  const topIncomeList = topIncomeCategories
    .map((g) => {
      const cat = categories.find((c) => c.id === g.categoryId);
      return `  - ${cat?.name ?? "Lainnya"}: ${fmt(Number(g._sum.amount ?? 0))}`;
    })
    .join("\n");

  // Recent transactions list
  const recentList = recentTransactions
    .map((tx) => {
      const sign = tx.type === "INCOME" ? "+" : "-";
      const desc = tx.description ? ` (${tx.description})` : "";
      return `  - ${dateFmt(tx.date)} | ${sign}${fmt(Number(tx.amount))} | ${tx.category.name}${desc} | oleh ${tx.user.name}`;
    })
    .join("\n");

  return `
## Data Keuangan Real-Time (${jakartaTodayStr})

### Ringkasan Keseluruhan
- Total Pemasukan (all-time): ${fmt(totalIncomeAll)}
- Total Pengeluaran (all-time): ${fmt(totalExpenseAll)}
- **Saldo/Laci Saat Ini: ${fmt(balance)}**
- Total Transaksi Tercatat: ${totalTransactions} transaksi

### Hari Ini (${jakartaTodayStr})
- Pemasukan Hari Ini: ${fmt(todayIncomeVal)}
- Pengeluaran Hari Ini: ${fmt(todayExpenseVal)}
- Selisih: ${fmt(todayIncomeVal - todayExpenseVal)}

### 7 Hari Terakhir
- Pemasukan: ${fmt(weekIncomeVal)}
- Pengeluaran: ${fmt(weekExpenseVal)}
- Selisih: ${fmt(weekIncomeVal - weekExpenseVal)}

### Bulan Ini
- Pemasukan: ${fmt(monthIncomeVal)}
- Pengeluaran: ${fmt(monthExpenseVal)}
- Selisih: ${fmt(monthIncomeVal - monthExpenseVal)}
- Margin: ${monthIncomeVal > 0 ? ((monthIncomeVal - monthExpenseVal) / monthIncomeVal * 100).toFixed(1) : "0"}%

### Top 5 Kategori Pengeluaran (Bulan Ini)
${topExpenseList || "  Belum ada pengeluaran bulan ini"}

### Top 5 Kategori Pemasukan (Bulan Ini)
${topIncomeList || "  Belum ada pemasukan bulan ini"}

### 10 Transaksi Terakhir
${recentList || "  Belum ada transaksi"}`;
}

// ---------------------------------------------------------------------------
// System Prompt Builder
// ---------------------------------------------------------------------------
function buildSystemPrompt(financialData: string, userName: string) {
  return `Kamu adalah "Legi", asisten keuangan AI milik LegitBites Cashflow Management.

## Tentang LegitBites
LegitBites adalah aplikasi manajemen arus kas (cashflow) untuk usaha kuliner/bisnis kecil. Aplikasi ini mencatat pemasukan dan pengeluaran harian, menampilkan laporan keuangan, dan membantu pemilik usaha mengelola keuangannya.

## Pengguna Saat Ini
Nama: ${userName}

## Peranmu
- Kamu PUNYA AKSES ke data keuangan pengguna yang ditampilkan di bawah
- Bantu pengguna memahami keuangan mereka berdasarkan DATA NYATA
- Berikan analisis dan saran berdasarkan data yang ada
- Identifikasi tren, peluang penghematan, atau risiko dari data
- Berikan tips penghematan, strategi pricing, atau ide peningkatan omzet

## Aturan
1. SELALU jawab dalam Bahasa Indonesia yang ramah dan mudah dipahami
2. Gunakan emoji secukupnya untuk membuat percakapan lebih hidup 😊
3. Referensikan DATA NYATA pengguna saat menjawab pertanyaan keuangan
4. Berikan jawaban yang konkret dan actionable berbasis data
5. Jika pengguna bertanya tentang data yang TIDAK tersedia, jujur bilang kamu hanya punya data yang ditampilkan
6. Format jawaban dengan baik (gunakan bullet points, bold, dll ketika membantu)
7. Jika ditanya hal di luar keuangan/bisnis, jawab dengan sopan bahwa kamu spesialis keuangan
${financialData}`;
}

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  // --- Auth Check ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();

    // Fetch real financial data and user info in parallel
    const [financialData, dbUser] = await Promise.all([
      getFinancialContext(),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      }),
    ]);

    const userName = dbUser?.name ?? "Pengguna";
    const systemPrompt = buildSystemPrompt(financialData, userName);

    // Convert UIMessages (parts-based) from useChat v5 → ModelMessages for streamText
    const modelMessages = await convertToModelMessages(body.messages);

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: modelMessages,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingBudget: 1024 },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error("[AI Chat] Error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
