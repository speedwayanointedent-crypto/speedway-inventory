import type { Metadata } from "next";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getProfitReport } from "@/actions/reports";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Profit Report" };

export default async function ProfitReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = sp.from ?? monthAgo.toISOString().slice(0, 10);
  const to = sp.to ?? now.toISOString().slice(0, 10);
  const data = await getProfitReport({ from, to });

  return (
    <div>
      <PageHeader title="Profit Report" description={`${from} → ${to}`} />

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

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(data.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-2">{data.transactions} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(data.totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Gross Profit</p>
            <p
              className={`text-2xl font-bold mt-1 ${data.grossProfit >= 0 ? "text-success" : "text-destructive"}`}
            >
              {formatCurrency(data.grossProfit)}
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              {data.grossProfit >= 0 ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              {data.grossProfit >= 0 ? "Profit" : "Loss"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Margin</p>
            <p className="text-2xl font-bold mt-1">{data.margin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
