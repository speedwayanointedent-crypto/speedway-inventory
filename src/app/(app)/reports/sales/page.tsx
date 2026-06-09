import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getSalesReport } from "@/actions/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Sales Report" };

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = sp.from ?? monthAgo.toISOString().slice(0, 10);
  const to = sp.to ?? now.toISOString().slice(0, 10);
  const { sales, summary } = await getSalesReport({ from, to });
  return (
    <div>
      <PageHeader title="Sales Report" description={`${from} → ${to}`}>
        <Button asChild variant="outline">
          <a href={`/api/reports/sales?format=pdf&from=${from}&to=${to}`} download>
            <Download className="h-4 w-4" /> PDF
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`/api/reports/sales?format=excel&from=${from}&to=${to}`} download>
            <Download className="h-4 w-4" /> Excel
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`/api/reports/sales?format=csv&from=${from}&to=${to}`} download>
            <Download className="h-4 w-4" /> CSV
          </a>
        </Button>
      </PageHeader>

      <form className="flex items-end gap-2 mb-4 flex-wrap">
        <div>
          <label className="text-xs font-medium">From</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="block h-9 rounded-md border bg-transparent px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium">To</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="block h-9 rounded-md border bg-transparent px-3 text-sm"
          />
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        <SummaryCard label="Total Sales" value={formatCurrency(summary.total)} />
        <SummaryCard label="Transactions" value={String(summary.count)} />
        <SummaryCard label="Discounts" value={formatCurrency(summary.discount)} />
        <SummaryCard label="Refunds" value={formatCurrency(summary.refunded)} />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale #</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sales as Array<{
              _id: string;
              saleNumber: string;
              staffName: string;
              total: number;
              status: string;
              createdAt: string;
            }>).map((s) => (
              <TableRow key={s._id}>
                <TableCell className="text-sm font-mono">{s.saleNumber}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.staffName}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(s.total)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{s.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(s.createdAt, true)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {(sales as unknown[]).length === 0 && (
          <p className="p-12 text-center text-sm text-muted-foreground">No sales in this period</p>
        )}
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
