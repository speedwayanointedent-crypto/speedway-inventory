import type { Metadata } from "next";
import Link from "next/link";
import { Plus, PackagePlus } from "lucide-react";
import { getStockEntries } from "@/actions/stock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/layout/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Stock Entries" };

export default async function StockEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { items, total, totalPages } = await getStockEntries({
    search: sp.search,
    page,
    limit: 20,
  });

  return (
    <div>
      <PageHeader title="Stock Entries" description={`${total} stock intake records`}>
        <Button asChild>
          <Link href="/stock-entries/new">
            <Plus className="h-4 w-4" /> New Entry
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput placeholder="Search by product, invoice, supplier..." />
      </div>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={PackagePlus}
            title="No stock entries"
            description="Record incoming stock from suppliers."
            action={
              <Button asChild>
                <Link href="/stock-entries/new">
                  <Plus className="h-4 w-4" /> New Entry
                </Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as Array<{
                _id: string;
                productName: string;
                quantityAdded: number;
                purchaseCost: number;
                totalCost: number;
                supplierName?: string;
                invoiceNumber?: string;
                userName: string;
                entryDate: string;
              }>).map((e) => (
                <TableRow key={e._id}>
                  <TableCell className="text-xs">{formatDate(e.entryDate)}</TableCell>
                  <TableCell className="text-sm font-medium">{e.productName}</TableCell>
                  <TableCell className="text-center font-semibold text-success">
                    +{e.quantityAdded}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(e.purchaseCost)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(e.totalCost)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {e.supplierName || "—"}
                  </TableCell>
                  <TableCell className="text-xs">{e.invoiceNumber || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.userName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
