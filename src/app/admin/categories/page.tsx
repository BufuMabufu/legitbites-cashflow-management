// =============================================================================
// Admin — Category Management Page (/admin/categories)
// =============================================================================
// Table of all categories with active/inactive toggle and add form.
// =============================================================================

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AddCategoryDialog } from "./add-category-dialog";
import { CategoryToggle } from "./category-toggle";
import { CategoryTableActions } from "./category-table-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Manajemen Kategori — Admin LegitBites" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
      createdAt: true,
      _count: { select: { transactions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Kategori</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tambah, aktifkan, atau nonaktifkan kategori transaksi.
          </p>
        </div>
        <AddCategoryDialog />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Kategori</CardTitle>
          <CardDescription>
            {categories.filter((c) => c.isActive).length} aktif /{" "}
            {categories.length} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kategori</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Transaksi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    Belum ada kategori.
                  </TableCell>
                </TableRow>
              )}
              {categories.map((cat) => (
                <TableRow key={cat.id} className={!cat.isActive ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={cat.type === "INCOME" ? "default" : "secondary"}
                    >
                      {cat.type === "INCOME" ? "💰 Pemasukan" : "💸 Pengeluaran"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat._count.transactions}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cat.isActive ? "outline" : "secondary"}>
                      {cat.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <CategoryToggle
                        categoryId={cat.id}
                        isActive={cat.isActive}
                      />
                      <CategoryTableActions category={cat} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
