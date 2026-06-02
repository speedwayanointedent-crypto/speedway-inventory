import Link from "next/link";
import {
  Undo2,
  Download,
  Truck,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { getSupplierReturnReport } from "@/actions/supplier-returns";
import {
  SUPPLIER_RETURN_REASON_LABELS,
  SUPPLIER_RETURN_STATUS_LABELS,
  type SupplierReturnStatus,
  type SupplierReturnReason,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; status?: string; supplierId?: string }>;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthAgoIso = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.entries(SUPPLIER_RETURN_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default async function SupplierReturnsReportPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const from = sp.from || monthAgoIso();
  const to = sp.to || todayIso();
  const data = await getSupplierReturnReport({
    from,
    to,
    status: sp.status,
    supplierId: sp.supplierId,
  });

  const exportQs = new URLSearchParams({ from, to });
  if (sp.status && sp.status !== "all") exportQs.set("status", sp.status);
  const exportHref = `/api/reports/supplier-returns?${exportQs.toString()}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Supplier Returns Report"
        description={`Returns recorded between ${formatDate(from)} and ${formatDate(to)}`}
      >
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <a href={`${exportHref}&format=pdf`} download>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <a href={`${exportHref}&format=excel`} download>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <a href={`${exportHref}&format=csv`} download>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </a>
        </Button>
        <Button asChild size="sm">
          <Link href="/supplier-returns/new">
            <Undo2 className="h-4 w-4 mr-2" />
            New return
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-3 sm:p-4">
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
            <div>
              <FilterSelect
                label="Status"
                param="status"
                value={sp.status || ""}
                options={STATUS_OPTIONS}
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Returns
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{data.summary.returns}</p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center">
                <Undo2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total value
                </p>
                <p className="text-base sm:text-xl font-bold mt-1">
                  {formatCurrency(data.summary.value)}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Refunded
                </p>
                <p className="text-base sm:text-xl font-bold mt-1">
                  {formatCurrency(data.summary.refunded)}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pending value
                </p>
                <p className="text-base sm:text-xl font-bold mt-1">
                  {formatCurrency(data.summary.pendingValue)}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Truck className="h-4 w-4" />
              By supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Returns</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Refunded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.suppliers.slice(0, 10).map((s) => (
                    <TableRow key={s.supplierId}>
                      <TableCell className="text-sm">{s.supplierName}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.returns}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(s.value)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(s.refunded)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              By reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.reasons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            ) : (
              <div className="space-y-2">
                {data.reasons.map((r) => {
                  const pct = data.summary.value > 0 ? (r.value / data.summary.value) * 100 : 0;
                  return (
                    <div key={r.reason}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>
                          {SUPPLIER_RETURN_REASON_LABELS[r.reason as SupplierReturnReason] ||
                            r.reason}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(r.value)} · {r.returns}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">All returns</CardTitle>
          <CardDescription>
            {data.summary.returns} {data.summary.returns === 1 ? "return" : "returns"} in this period
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No returns recorded</p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Refunded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.entries.map((r: any) => (
                      <TableRow key={r._id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/supplier-returns/${r._id}`}
                            className="hover:underline text-primary"
                          >
                            {r.referenceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(r.returnDate)}
                        </TableCell>
                        <TableCell className="text-sm">{r.supplierName || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {SUPPLIER_RETURN_REASON_LABELS[r.primaryReason as SupplierReturnReason] ||
                            r.primaryReason}
                        </TableCell>
                        <TableCell className="text-xs">
                          {SUPPLIER_RETURN_STATUS_LABELS[r.status as SupplierReturnStatus] ||
                            r.status}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{r.totalItems}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(r.totalValue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(r.actualRefundAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {data.entries.map((r: any) => (
                  <Link
                    key={r._id}
                    href={`/supplier-returns/${r._id}`}
                    className="block p-3 hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs text-primary truncate">
                          {r.referenceNumber}
                        </p>
                        <p className="text-sm font-medium truncate mt-0.5">
                          {r.supplierName || "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(r.returnDate)} ·{" "}
                          {SUPPLIER_RETURN_REASON_LABELS[r.primaryReason as SupplierReturnReason] ||
                            r.primaryReason}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatCurrency(r.totalValue)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {SUPPLIER_RETURN_STATUS_LABELS[r.status as SupplierReturnStatus] ||
                            r.status}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
