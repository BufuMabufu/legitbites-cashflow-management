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
import { Prisma } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { TransactionDataTable } from "./transaction-data-table";
import { Button } from "@/components/ui/button";


export default async function TransactionsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string; q?: string; from?: string; to?: string }> 
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const searchQuery = params.q || "";
  const dateFrom = params.from;
  const dateTo = params.to;
  const pageSize = 10;

  // Build filtering condition
  const whereClause: Prisma.TransactionWhereInput = { 
    deletedAt: null 
  };

  if (searchQuery) {
    whereClause.OR = [
      { description: { contains: searchQuery, mode: 'insensitive' } },
      { category: { name: { contains: searchQuery, mode: 'insensitive' } } }
    ];
  }

  if (dateFrom || dateTo) {
    whereClause.date = {};
    if (dateFrom) whereClause.date.gte = new Date(dateFrom);
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      whereClause.date.lte = toDate;
    }
  }

  // Fetch total count based on active filters
  const totalItems = await prisma.transaction.count({ where: whereClause });
  const totalPages = Math.ceil(totalItems / pageSize);

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: {
      category: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: pageSize,
    skip: (currentPage - 1) * pageSize,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Riwayat Transaksi</h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-2">
            Kelola dan pantau semua transaksi yang telah dicatat.
          </p>
        </div>

        <Link href="/transactions/new">
          <Button className="w-full sm:w-auto h-12 md:h-16 text-base md:text-xl font-bold rounded-xl md:rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md transition-transform hover:-translate-y-1">
            <PlusCircle className="mr-2 h-5 w-5 md:h-6 md:w-6" />
            Catat Transaksi
          </Button>
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
        <TransactionDataTable 
          transactions={transactions.map(tx => ({ ...tx, amount: Number(tx.amount) }))}
          userRole={user.role}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}
