import Link from "next/link";
import {
  Plus,
  Download,
  Undo2,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { FilterSelect } from "@/components/layout/filter-select";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/layout/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getSupplierReturns,
  getSupplierReturnSummary,
  getRecentSupplierReturns,
} from "@/actions/supplier-returns";
import {
  SUPPLIER_RETURN_STATUS_LABELS,
  SUPPLIER_RETURN_REASON_LABELS,
  type SupplierReturnStatus,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    from?: string;
    to?: string;
    status?: string;
    supplier?: string;
    reason?: string;
  }>;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthAgoIso = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};

const STATUS_OPTIONS = Object.entries(SUPPLIER_RETURN_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const REASON_OPTIONS = Object.entries(SUPPLIER_RETURN_REASON_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    IN_TRANSIT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    CANCELLED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
        styles[status] || "bg-zinc-100 text-zinc-700"
      }`}
    >
      {SUPPLIER_RETURN_STATUS_LABELS[status as SupplierReturnStatus] || status}
    </span>
  );
}

export default async function SupplierReturnsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const from = sp.from || monthAgoIso();
  const to = sp.to || todayIso();
  const page = Number(sp.page) || 1;

  const [{ items, total, totalPages }, summary, recent] = await Promise.all([
    getSupplierReturns({
      search: sp.search,
      page,
      limit: 20,
      from,
      to,
      status: sp.status,
      supplier: sp.supplier,
      reason: sp.reason,
    }),
    getSupplierReturnSummary(),
    getRecentSupplierReturns(5),
  ]);

  const list = items as Array<{
    _id: string;
    referenceNumber: string;
    supplierName?: string;
    status: string;
    primaryReason: string;
    totalQuantity: number;
    totalValue: number;
    returnDate: string;
    createdAt: string;
  }>;

  const recentList = recent as Array<{
    _id: string;
    referenceNumber: string;
    supplierName?: string;
    status: string;
    totalValue: number;
    primaryReason: string;
    returnDate: string;
  }>;

  const exportQs = new URLSearchParams({ from, to });
  if (sp.status && sp.status !== "all") exportQs.set("status", sp.status);
  if (sp.supplier && sp.supplier !== "all") exportQs.set("supplierId", sp.supplier);
  if (sp.reason && sp.reason !== "all") exportQs.set("reason", sp.reason);
  const exportHref = `/api/reports/supplier-returns?${exportQs.toString()}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Supplier Returns"
        description="Track defective, overstocked, or wrong items returned back to suppliers"
      >
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
            <Plus className="h-4 w-4 mr-2" />
            New Return
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          className={
            summary.pending > 0
              ? "ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/5"
              : ""
          }
        >
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pending Approval
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{summary.pending}</p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  In Progress
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{summary.inProgress}</p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Completed (Month)
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{summary.completedThisMonth}</p>
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
                  Value (Month)
                </p>
                <p className="text-base sm:text-xl font-bold mt-1">
                  {formatCurrency(summary.valueThisMonth)}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center">
                <Undo2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <form className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <SearchInput placeholder="Search by ref, supplier, product..." />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                From
              </label>
              <input
                type="date"
                name="from"
                defaultValue={from}
                className="block h-9 rounded-md border bg-transparent px-3 text-sm mt-0.5 w-full"
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
                className="block h-9 rounded-md border bg-transparent px-3 text-sm mt-0.5 w-full"
              />
            </div>
            <div>
              <FilterSelect
                label="Status"
                param="status"
                value={sp.status || ""}
                options={[{ value: "all", label: "All" }, ...STATUS_OPTIONS]}
              />
            </div>
            <div>
              <FilterSelect
                label="Reason"
                param="reason"
                value={sp.reason || ""}
                options={[{ value: "all", label: "All" }, ...REASON_OPTIONS]}
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base sm:text-lg">Returns</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {total} {total === 1 ? "return" : "returns"} found
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="sm" className="sm:hidden">
                <a href={`${exportHref}&format=excel`} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="text-center py-12 px-4">
              <PackageCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No supplier returns yet</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/supplier-returns/new">Record first return</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((r) => (
                      <TableRow key={r._id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/supplier-returns/${r._id}`}
                            className="hover:underline text-primary"
                          >
                            {r.referenceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.supplierName || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(SUPPLIER_RETURN_REASON_LABELS as Record<string, string>)[
                            r.primaryReason
                          ] || r.primaryReason}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.totalQuantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(r.totalValue)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(r.returnDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {list.map((r) => (
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
                          {r.totalQuantity} units ·{" "}
                          {(SUPPLIER_RETURN_REASON_LABELS as Record<string, string>)[
                            r.primaryReason
                          ] || r.primaryReason}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatCurrency(r.totalValue)}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={r.status} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination page={page} totalPages={totalPages} total={total} />
          </div>
        )}
      </Card>

      {recentList.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Recent Returns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentList.map((r) => (
              <Link
                key={r._id}
                href={`/supplier-returns/${r._id}`}
                className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs">{r.referenceNumber}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.supplierName || "—"} · {formatDate(r.returnDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(r.totalValue)}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
