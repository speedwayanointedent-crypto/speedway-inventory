import type { Metadata } from "next";
import Link from "next/link";
import {
  Plus,
  PackagePlus,
  Download,
  Eye,
  Wallet,
  Building2,
  Calendar,
  Hash,
  TrendingUp,
  Package,
  FileText,
  Receipt,
  Upload,
} from "lucide-react";
import { getStockEntries } from "@/actions/stock";
import { getSuppliers } from "@/actions/suppliers";
import { getShops } from "@/actions/shops";
import { getStockIntakeSummary } from "@/actions/stock";
import { Card, CardContent } from "@/components/ui/card";
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
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/layout/pagination";
import { FilterSelect } from "@/components/layout/filter-select";
import {
  STOCK_ENTRY_STATUS_LABELS,
  STOCK_PAYMENT_METHOD_LABELS,
  type StockEntryStatus,
  type StockPaymentMethod,
  type StockPaymentStatus,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Stock Entries" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    search?: string;
    page?: string;
    from?: string;
    to?: string;
    supplier?: string;
    status?: string;
    paymentStatus?: string;
    shop?: string;
  }>;
}

const STATUS_VARIANT: Record<StockEntryStatus, "success" | "warning" | "destructive"> = {
  RECEIVED: "success",
  PENDING: "warning",
  CANCELLED: "destructive",
};

const PAYMENT_VARIANT: Record<StockPaymentStatus, "success" | "warning" | "destructive" | "outline"> = {
  PAID: "success",
  PARTIAL: "warning",
  PENDING: "warning",
  UNPAID: "destructive",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthAgoISO() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default async function StockEntriesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const from = sp.from ?? monthAgoISO();
  const to = sp.to ?? todayISO();

  const [{ items, total, totalPages }, suppliers, shops, summary] = await Promise.all([
    getStockEntries({
      search: sp.search,
      from,
      to,
      supplier: sp.supplier,
      status: sp.status,
      paymentStatus: sp.paymentStatus,
      shop: sp.shop,
      page,
      limit: 20,
    }),
    getSuppliers({ limit: 200 }),
    getShops(),
    getStockIntakeSummary(),
  ]);

  const exportParams = new URLSearchParams({
    from,
    to,
    ...(sp.supplier && sp.supplier !== "all" ? { supplier: sp.supplier } : {}),
    ...(sp.status && sp.status !== "all" ? { status: sp.status } : {}),
    ...(sp.paymentStatus && sp.paymentStatus !== "all" ? { paymentStatus: sp.paymentStatus } : {}),
    ...(sp.shop && sp.shop !== "all" ? { shop: sp.shop } : {}),
    ...(sp.search ? { search: sp.search } : {}),
  }).toString();

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Stock Intake"
        description={`${total} intake records · ${formatCurrency(summary.month.cost)} this month`}
      >
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link href="/stock-entries/bulk">
            <Upload className="h-4 w-4" /> Bulk
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link href="/reports/stock-entries">
            <FileText className="h-4 w-4" /> Report
          </Link>
        </Button>
        <Button asChild size="sm" className="shadow-lg shadow-primary/20">
          <Link href="/stock-entries/new">
            <Plus className="h-4 w-4" /> New Intake
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label="Today"
          value={formatCurrency(summary.today.cost)}
          sub={`${summary.today.entries} intakes · ${summary.today.quantity} units`}
          icon={Calendar}
          accent="from-emerald-500 to-teal-500"
        />
        <StatTile
          label="This Week"
          value={formatCurrency(summary.week.cost)}
          sub={`${summary.week.entries} intakes · ${summary.week.quantity} units`}
          icon={TrendingUp}
          accent="from-blue-500 to-cyan-500"
        />
        <StatTile
          label="This Month"
          value={formatCurrency(summary.month.cost)}
          sub={`${summary.month.entries} intakes · ${summary.month.quantity} units`}
          icon={Package}
          accent="from-violet-500 to-fuchsia-500"
        />
        <StatTile
          label="Outstanding"
          value={formatCurrency(summary.outstanding)}
          sub={`${summary.pending} pending arrivals`}
          icon={Wallet}
          accent="from-amber-500 to-orange-500"
          highlight={summary.outstanding > 0}
        />
      </div>

      <Card className="overflow-visible">
        <CardContent className="p-4 sm:p-5 space-y-3">
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
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`/api/reports/stock-entries?format=pdf&${exportParams}`} download>
                  <Download className="h-4 w-4" /> PDF
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`/api/reports/stock-entries?format=excel&${exportParams}`} download>
                  <Download className="h-4 w-4" /> Excel
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`/api/reports/stock-entries?format=csv&${exportParams}`} download>
                  <Download className="h-4 w-4" /> CSV
                </a>
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput placeholder="Search by reference, product, supplier, invoice…" />
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
            <FilterSelect
              label="Status"
              param="status"
              value={sp.status ?? "all"}
              options={[
                { value: "all", label: "All statuses" },
                { value: "RECEIVED", label: "Received" },
                { value: "PENDING", label: "Pending" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
            />
            <FilterSelect
              label="Payment"
              param="paymentStatus"
              value={sp.paymentStatus ?? "all"}
              options={[
                { value: "all", label: "All payments" },
                { value: "PAID", label: "Paid" },
                { value: "PARTIAL", label: "Partial" },
                { value: "PENDING", label: "Pending" },
                { value: "UNPAID", label: "Unpaid" },
              ]}
            />
            {shops.length > 1 && (
              <FilterSelect
                label="Shop"
                param="shop"
                value={sp.shop ?? "all"}
                options={[
                  { value: "all", label: "All shops" },
                  ...shops.map((s) => ({
                    value: (s as { _id: string; name: string })._id,
                    label: (s as { name: string }).name,
                  })),
                ]}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={PackagePlus}
            title="No stock intakes"
            description={
              sp.search || sp.supplier || sp.status || sp.paymentStatus
                ? "Try clearing your filters to see more results."
                : "Record incoming stock from suppliers to track inventory intake."
            }
            action={
              <Button asChild>
                <Link href="/stock-entries/new">
                  <Plus className="h-4 w-4" /> New Intake
                </Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-center">Units</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as Array<{
                _id: string;
                referenceNumber: string;
                entryDate: string;
                supplierName?: string;
                invoiceNumber?: string;
                totalItems: number;
                totalQuantity: number;
                totalCost: number;
                amountDue: number;
                status: StockEntryStatus;
                paymentStatus: StockPaymentStatus;
                paymentMethod?: StockPaymentMethod;
              }>).map((e) => (
                <TableRow key={e._id}>
                  <TableCell>
                    <Link href={`/stock-entries/${e._id}`} className="block">
                      <p className="text-sm font-mono font-semibold flex items-center gap-1.5">
                        <Receipt className="h-3 w-3 text-muted-foreground" />
                        {e.referenceNumber}
                      </p>
                      {e.invoiceNumber && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Hash className="h-2.5 w-2.5" /> {e.invoiceNumber}
                        </p>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(e.entryDate, true)}</TableCell>
                  <TableCell>
                    {e.supplierName ? (
                      <span className="text-sm flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                        {e.supplierName}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm font-semibold">
                    {e.totalItems}
                  </TableCell>
                  <TableCell className="text-center text-sm font-semibold text-emerald-600">
                    +{e.totalQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="font-semibold">{formatCurrency(e.totalCost)}</p>
                    {e.amountDue > 0 && (
                      <p className="text-[10px] text-amber-600">
                        Due {formatCurrency(e.amountDue)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[e.status]}>
                      {STOCK_ENTRY_STATUS_LABELS[e.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <Badge variant={PAYMENT_VARIANT[e.paymentStatus]} className="text-[10px]">
                        {e.paymentStatus}
                      </Badge>
                      {e.paymentMethod && (
                        <p className="text-[10px] text-muted-foreground">
                          {STOCK_PAYMENT_METHOD_LABELS[e.paymentMethod]}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                      <Link href={`/stock-entries/${e._id}`} aria-label="View entry">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
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

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden p-3.5 sm:p-5 ${
        highlight ? "ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/5" : ""
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl`}
      />
      <div className="flex items-center justify-between gap-2 relative">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1 sm:mt-1.5 text-base sm:text-xl font-bold tracking-tight truncate">
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
