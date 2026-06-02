import type { Metadata } from "next";
import Link from "next/link";
import {
  Download,
  BarChart3,
  TrendingUp,
  Package,
  Truck,
  Wallet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
} from "lucide-react";
import { getStockIntakeReport } from "@/actions/stock";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { StockIntakeChart } from "@/components/reports/stock-intake-chart";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Stock Intake Report" };
export const dynamic = "force-dynamic";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function monthAgoISO() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function StockIntakeReportPage({ searchParams }: Props) {
  const sp = await searchParams;
  const from = sp.from ?? monthAgoISO();
  const to = sp.to ?? todayISO();
  const data = await getStockIntakeReport({ from, to });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Stock Intake Report"
        description={`${formatDate(from)} → ${formatDate(to)}`}
      >
        <Button asChild variant="outline" size="sm">
          <a href={`/api/reports/stock-entries?format=pdf&from=${from}&to=${to}`} download>
            <Download className="h-4 w-4" /> PDF
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/reports/stock-entries?format=excel&from=${from}&to=${to}`} download>
            <Download className="h-4 w-4" /> Excel
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/reports/stock-entries?format=csv&from=${from}&to=${to}`} download>
            <Download className="h-4 w-4" /> CSV
          </a>
        </Button>
        <Button asChild size="sm" className="shadow-lg shadow-primary/20">
          <Link href="/stock-entries/new">
            <ListChecks className="h-4 w-4" /> Record intake
          </Link>
        </Button>
      </PageHeader>

      <form className="flex items-end gap-2 flex-wrap">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            From
          </label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="block h-9 rounded-md border bg-transparent px-3 text-sm mt-0.5"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            To
          </label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="block h-9 rounded-md border bg-transparent px-3 text-sm mt-0.5"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Apply
        </Button>
      </form>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          label="Intakes"
          value={String(data.summary.entries)}
          sub="Total receipts"
          icon={ListChecks}
          accent="from-blue-500 to-cyan-500"
        />
        <SummaryCard
          label="Units received"
          value={String(data.summary.quantity)}
          sub={`Across ${data.summary.entries} intakes`}
          icon={Package}
          accent="from-emerald-500 to-teal-500"
        />
        <SummaryCard
          label="Total cost"
          value={formatCurrency(data.summary.cost)}
          sub="Stock value added"
          icon={TrendingUp}
          accent="from-violet-500 to-fuchsia-500"
        />
        <SummaryCard
          label="Outstanding"
          value={formatCurrency(data.summary.due)}
          sub={`${formatCurrency(data.summary.paid)} paid`}
          icon={Wallet}
          accent="from-amber-500 to-orange-500"
          highlight={data.summary.due > 0}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Daily intake trend
            </CardTitle>
            <CardDescription className="text-xs">
              Cost of stock received per day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockIntakeChart data={data.daily} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Payment status
            </CardTitle>
            <CardDescription className="text-xs">Intake payment breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <PaymentRow
              label="Paid"
              value={data.paymentBreakdown.PAID || 0}
              total={data.summary.entries}
              variant="success"
            />
            <PaymentRow
              label="Partial"
              value={data.paymentBreakdown.PARTIAL || 0}
              total={data.summary.entries}
              variant="warning"
            />
            <PaymentRow
              label="Pending"
              value={data.paymentBreakdown.PENDING || 0}
              total={data.summary.entries}
              variant="warning"
            />
            <PaymentRow
              label="Unpaid"
              value={data.paymentBreakdown.UNPAID || 0}
              total={data.summary.entries}
              variant="destructive"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Truck className="h-4 w-4" /> By supplier
            </CardTitle>
            <CardDescription className="text-xs">
              Top suppliers by intake value
            </CardDescription>
          </CardHeader>
          {data.suppliers.length === 0 ? (
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-6">No data</p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-center">Intakes</TableHead>
                  <TableHead className="text-center">Units</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.suppliers.slice(0, 10).map((s) => (
                  <TableRow key={s.supplierId || s.supplierName}>
                    <TableCell className="text-sm font-medium">{s.supplierName}</TableCell>
                    <TableCell className="text-center text-sm">{s.entries}</TableCell>
                    <TableCell className="text-center text-sm text-emerald-600">
                      +{s.quantity}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(s.cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Package className="h-4 w-4" /> Top products received
            </CardTitle>
            <CardDescription className="text-xs">Most restocked products</CardDescription>
          </CardHeader>
          {data.products.length === 0 ? (
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-6">No data</p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Times</TableHead>
                  <TableHead className="text-center">Units</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.slice(0, 10).map((p) => (
                  <TableRow key={p.productId}>
                    <TableCell>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {p.productName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {p.productCode}
                      </p>
                    </TableCell>
                    <TableCell className="text-center text-sm">{p.entries}</TableCell>
                    <TableCell className="text-center text-sm text-emerald-600 font-semibold">
                      +{p.quantity}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(p.cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden p-4 ${
        highlight ? "ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/5" : ""
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl`}
      />
      <div className="flex items-start justify-between gap-2 relative">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight truncate">
            {value}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
        </div>
        <div
          className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center shadow-md`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:h-5" />
        </div>
      </div>
    </Card>
  );
}

function PaymentRow({
  label,
  value,
  total,
  variant,
}: {
  label: string;
  value: number;
  total: number;
  variant: "success" | "warning" | "destructive";
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">
          {variant === "success" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
          {variant === "warning" && <Calendar className="h-3 w-3 text-amber-500" />}
          {variant === "destructive" && <AlertTriangle className="h-3 w-3 text-rose-500" />}
          {label}
        </span>
        <span className="font-semibold">
          {value} <span className="text-muted-foreground font-normal">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${
            variant === "success"
              ? "bg-emerald-500"
              : variant === "warning"
                ? "bg-amber-500"
                : "bg-rose-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
