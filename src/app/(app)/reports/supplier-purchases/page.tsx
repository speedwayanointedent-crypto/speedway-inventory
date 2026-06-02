import type { Metadata } from "next";
import Link from "next/link";
import {
  Download,
  Truck,
  Wallet,
  Package,
  FileSpreadsheet,
  Phone,
  Building2,
} from "lucide-react";
import { getSupplierPurchaseReport } from "@/actions/stock";
import { getSuppliers } from "@/actions/suppliers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { FilterSelect } from "@/components/layout/filter-select";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Supplier Purchases Report" };
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
  searchParams: Promise<{ from?: string; to?: string; supplier?: string }>;
}

export default async function SupplierPurchasesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const from = sp.from ?? monthAgoISO();
  const to = sp.to ?? todayISO();
  const [data, suppliers] = await Promise.all([
    getSupplierPurchaseReport({ from, to, supplierId: sp.supplier }),
    getSuppliers({ limit: 200 }),
  ]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Supplier Purchase Report"
        description={`${formatDate(from)} → ${formatDate(to)}`}
      >
        <Button asChild variant="outline" size="sm">
          <a
            href={`/api/reports/supplier-purchases?format=pdf&from=${from}&to=${to}${
              sp.supplier ? `&supplier=${sp.supplier}` : ""
            }`}
            download
          >
            <Download className="h-4 w-4" /> PDF
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href={`/api/reports/supplier-purchases?format=excel&from=${from}&to=${to}${
              sp.supplier ? `&supplier=${sp.supplier}` : ""
            }`}
            download
          >
            <Download className="h-4 w-4" /> Excel
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href={`/api/reports/supplier-purchases?format=csv&from=${from}&to=${to}${
              sp.supplier ? `&supplier=${sp.supplier}` : ""
            }`}
            download
          >
            <Download className="h-4 w-4" /> CSV
          </a>
        </Button>
        <Button asChild size="sm" className="shadow-lg shadow-primary/20">
          <Link href="/stock-entries/new">
            <Truck className="h-4 w-4" /> New intake
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
        <div className="min-w-[180px]">
          <FilterSelect
            label="Supplier"
            param="supplier"
            value={sp.supplier ?? "all"}
            options={[
              { value: "all", label: "All suppliers" },
              ...(suppliers.items as Array<{ _id: string; companyName: string }>).map((s) => ({
                value: s._id,
                label: s.companyName,
              })),
            ]}
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Apply
        </Button>
      </form>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          label="Suppliers"
          value={String(data.summary.suppliers)}
          sub="Active in this period"
          icon={Truck}
          accent="from-blue-500 to-cyan-500"
        />
        <SummaryCard
          label="Intakes"
          value={String(data.summary.entries)}
          sub="Purchase orders recorded"
          icon={Package}
          accent="from-emerald-500 to-teal-500"
        />
        <SummaryCard
          label="Total purchased"
          value={formatCurrency(data.summary.cost)}
          sub={`${formatCurrency(data.summary.paid)} paid`}
          icon={FileSpreadsheet}
          accent="from-violet-500 to-fuchsia-500"
        />
        <SummaryCard
          label="Outstanding"
          value={formatCurrency(data.summary.due)}
          sub="Balance to suppliers"
          icon={Wallet}
          accent="from-amber-500 to-rose-500"
          highlight={data.summary.due > 0}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Supplier breakdown</CardTitle>
          <CardDescription className="text-xs">
            All suppliers with activity in this period
          </CardDescription>
        </CardHeader>
        {data.rows.length === 0 ? (
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-10">
              No supplier purchases recorded in this period
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Intakes</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead className="text-center">Units</TableHead>
                <TableHead className="text-right">Purchased</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((r) => (
                <TableRow key={r.supplierId}>
                  <TableCell>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {r.supplierName}
                    </p>
                  </TableCell>
                  <TableCell>
                    {r.phone ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5" /> {r.phone}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm">{r.entries}</TableCell>
                  <TableCell className="text-center text-sm">{r.products}</TableCell>
                  <TableCell className="text-center text-sm text-emerald-600 font-semibold">
                    +{r.quantity}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(r.cost)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-emerald-600">
                    {formatCurrency(r.paid)}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.due > 0.01 ? (
                      <Badge variant="warning" className="font-mono text-[10px]">
                        {formatCurrency(r.due)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-emerald-600">Paid</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {data.entries.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Detailed entries</CardTitle>
            <CardDescription className="text-xs">
              All intake records in this period
            </CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-center">Units</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.entries as Array<{
                _id: string;
                referenceNumber: string;
                entryDate: string;
                supplierName?: string;
                invoiceNumber?: string;
                totalItems: number;
                totalQuantity: number;
                totalCost: number;
                amountDue: number;
                paymentStatus: string;
                status: string;
              }>).map((e) => (
                <TableRow key={e._id}>
                  <TableCell>
                    <Link
                      href={`/stock-entries/${e._id}`}
                      className="text-sm font-mono font-semibold hover:text-primary"
                    >
                      {e.referenceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(e.entryDate, true)}</TableCell>
                  <TableCell className="text-sm">{e.supplierName || "—"}</TableCell>
                  <TableCell className="text-xs font-mono">{e.invoiceNumber || "—"}</TableCell>
                  <TableCell className="text-center text-sm">{e.totalItems}</TableCell>
                  <TableCell className="text-center text-sm">{e.totalQuantity}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(e.totalCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {e.amountDue > 0.01 ? (
                      <span className="text-amber-600 text-sm font-semibold">
                        {formatCurrency(e.amountDue)}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600">Paid</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        e.paymentStatus === "PAID"
                          ? "success"
                          : e.paymentStatus === "PARTIAL"
                            ? "warning"
                            : "destructive"
                      }
                      className="text-[10px]"
                    >
                      {e.paymentStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
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
          <Icon className="h-4 w-4 sm:h-5" />
        </div>
      </div>
    </Card>
  );
}
