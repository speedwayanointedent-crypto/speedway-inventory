import type { Metadata } from "next";
import { RotateCcw } from "lucide-react";
import { getReturns } from "@/actions/returns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/layout/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Returns" };

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { items, total, totalPages } = await getReturns({
    search: sp.search,
    page,
    limit: 20,
  });

  return (
    <div>
      <PageHeader title="Returns" description={`${total} return records`} />
      <div className="mb-4">
        <SearchInput placeholder="Search by return or sale number..." />
      </div>
      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="No returns"
            description="Returns can be processed from the sale detail page."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return #</TableHead>
                <TableHead>Sale</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as Array<{
                _id: string;
                returnNumber: string;
                saleNumber: string;
                type: string;
                totalAmount: number;
                reason: string;
                createdAt: string;
              }>).map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="text-sm font-mono font-medium">{r.returnNumber}</TableCell>
                  <TableCell className="text-sm">{r.saleNumber}</TableCell>
                  <TableCell>
                    <Badge variant={r.type === "FULL" ? "destructive" : "warning"}>
                      {r.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-destructive">
                    -{formatCurrency(r.totalAmount)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {r.reason}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(r.createdAt)}
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
