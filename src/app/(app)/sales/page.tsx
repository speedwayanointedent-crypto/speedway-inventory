import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Receipt as ReceiptIcon, Printer } from "lucide-react";
import { getSales } from "@/actions/sales";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/layout/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/constants";

export const metadata: Metadata = { title: "Sales" };

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "destructive" | "warning" | "secondary"
> = {
  COMPLETED: "success",
  REFUNDED: "destructive",
  CANCELLED: "secondary",
  PARTIAL_REFUND: "warning",
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { items, total, totalPages } = await getSales({
    search: sp.search,
    status: sp.status,
    page,
    limit: 20,
  });

  return (
    <div>
      <PageHeader title="Sales" description={`${total} sales recorded`}>
        <Button asChild>
          <Link href="/pos">New Sale</Link>
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput placeholder="Search by sale number or customer..." />
      </div>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={ReceiptIcon}
            title="No sales yet"
            description="Sales will appear here once you start processing transactions."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as Array<{
                _id: string;
                saleNumber: string;
                publicId: string;
                customerName: string;
                staffName: string;
                paymentMethod: PaymentMethod;
                total: number;
                status: string;
                createdAt: string;
              }>).map((s) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <Link
                      href={`/sales/${s._id}`}
                      className="text-sm font-mono font-medium hover:text-primary"
                    >
                      {s.saleNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{s.customerName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.staffName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {PAYMENT_METHOD_LABELS[s.paymentMethod]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(s.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status] ?? "default"}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(s.createdAt, true)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                        <Link href={`/sales/${s._id}`}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                        <Link href={`/receipt/${s.publicId}`} target="_blank" rel="noopener noreferrer">
                          <Printer className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
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
