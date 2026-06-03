import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  Building2,
  Calendar,
  Hash,
  Wallet,
  StickyNote,
  Package,
  CheckCircle2,
  Pencil,
  Download,
  Store,
  Clock,
  Banknote,
  Ban,
  User,
} from "lucide-react";
import { getStockEntry } from "@/actions/stock";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockEntryPayment } from "@/components/inventory/stock-entry-payment";
import { StockEntryCancel } from "@/components/inventory/stock-entry-cancel";
import {
  STOCK_ENTRY_STATUS_LABELS,
  STOCK_PAYMENT_METHOD_LABELS,
  type StockEntryStatus,
  type StockPaymentMethod,
  type StockPaymentStatus,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireAuth } from "@/lib/session";
import { PERMISSIONS } from "@/lib/constants";

interface Props {
  params: Promise<{ id: string }>;
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

const STATUS_GRADIENT: Record<StockEntryStatus, string> = {
  RECEIVED: "from-emerald-500/20 via-teal-500/10 to-transparent",
  PENDING: "from-amber-500/20 via-amber-500/5 to-transparent",
  CANCELLED: "from-rose-500/20 via-rose-500/5 to-transparent",
};

export default async function StockEntryDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth();
  const entry = (await getStockEntry(id)) as Record<string, unknown> | null;
  if (!entry) notFound();

  const e = entry as unknown as {
    _id: string;
    referenceNumber: string;
    supplier?: string;
    supplierName?: string;
    shopName?: string;
    lineItems: Array<{
      product: string;
      productName: string;
      productCode: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      previousQuantity: number;
      newQuantity: number;
    }>;
    totalItems: number;
    totalQuantity: number;
    totalCost: number;
    status: StockEntryStatus;
    paymentStatus: StockPaymentStatus;
    paymentMethod?: StockPaymentMethod;
    amountPaid: number;
    amountDue: number;
    dueDate?: string;
    invoiceNumber?: string;
    notes?: string;
    entryDate: string;
    receivedDate?: string;
    userName: string;
    cancelledAt?: string;
    cancelledByName?: string;
    cancelReason?: string;
    createdAt: string;
  };

  const status = e.status;
  const hasEditPerm = user.permissions.includes(PERMISSIONS.EDIT_INVENTORY);
  const canEdit = hasEditPerm && status !== "CANCELLED";
  const canCancel = hasEditPerm && status !== "CANCELLED";
  const heroGradient = STATUS_GRADIENT[status] || STATUS_GRADIENT.RECEIVED;

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5 print:space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/stock-entries" aria-label="Back to stock entries">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold truncate flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {e.referenceNumber}
              </h1>
              <Badge variant={STATUS_VARIANT[status]}>
                {STOCK_ENTRY_STATUS_LABELS[status]}
              </Badge>
              <Badge variant={PAYMENT_VARIANT[e.paymentStatus]}>{e.paymentStatus}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Recorded {formatDate(e.entryDate, true)} by {e.userName}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm" className="h-9">
            <a href={`/api/stock-entries/${e._id}/pdf`} download>
              <Download className="h-4 w-4" /> PDF
            </a>
          </Button>
          {canEdit && (
            <Button asChild size="sm" className="h-9 shadow-lg shadow-primary/20">
              <Link href={`/stock-entries/${e._id}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
          )}
          {canCancel && (
            <StockEntryCancel id={e._id} referenceNumber={e.referenceNumber} />
          )}
        </div>
      </div>

      {status === "CANCELLED" && (
        <Card className="border-rose-500/30 bg-rose-500/5 print:hidden">
          <CardContent className="p-4 flex gap-3 text-sm">
            <Ban className="h-5 w-5 text-rose-500 shrink-0" />
            <div>
              <p className="font-semibold text-rose-600 dark:text-rose-400">
                This entry was cancelled
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {e.cancelledByName ? `By ${e.cancelledByName}` : ""}
                {e.cancelledAt && ` on ${formatDate(e.cancelledAt, true)}`}
                {e.cancelReason && ` — ${e.cancelReason}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="relative overflow-hidden border-border/60">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${heroGradient} pointer-events-none`}
        />
        <CardContent className="relative p-0">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-5 sm:p-6 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total cost
                </p>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 mt-1">
                  {formatCurrency(e.totalCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {e.totalItems} {e.totalItems === 1 ? "item" : "items"} ·{" "}
                  {e.totalQuantity} units
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat
                  icon={Wallet}
                  label="Amount Paid"
                  value={formatCurrency(e.amountPaid)}
                  accent="text-emerald-600"
                />
                <Stat
                  icon={Banknote}
                  label="Balance Due"
                  value={formatCurrency(e.amountDue)}
                  accent={e.amountDue > 0 ? "text-amber-600" : "text-emerald-600"}
                />
              </div>
            </div>
            <div className="p-5 sm:p-6 border-t md:border-t-0 md:border-l border-border/60 space-y-3">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <DetailRow
                  icon={Building2}
                  label="Supplier"
                  value={e.supplierName || "Unspecified"}
                />
                {e.shopName && (
                  <DetailRow icon={Store} label="Receiving shop" value={e.shopName} />
                )}
                {e.invoiceNumber && (
                  <DetailRow icon={Hash} label="Invoice / Reference" value={e.invoiceNumber} />
                )}
                <DetailRow
                  icon={Calendar}
                  label="Entry date"
                  value={formatDate(e.entryDate, true)}
                />
                {e.receivedDate && (
                  <DetailRow
                    icon={CheckCircle2}
                    label="Received date"
                    value={formatDate(e.receivedDate, true)}
                  />
                )}
                {e.dueDate && (
                  <DetailRow
                    icon={Clock}
                    label="Payment due"
                    value={formatDate(e.dueDate)}
                  />
                )}
                {e.paymentMethod && (
                  <DetailRow
                    icon={Banknote}
                    label="Payment method"
                    value={STOCK_PAYMENT_METHOD_LABELS[e.paymentMethod]}
                  />
                )}
                <DetailRow icon={User} label="Recorded by" value={e.userName} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6 pb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" /> Line items ({e.totalItems})
          </h2>
          <p className="text-xs text-muted-foreground">
            All products received in this intake
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Unit cost</TableHead>
              <TableHead className="text-right">Line total</TableHead>
              <TableHead className="text-center">Stock change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {e.lineItems.map((li, i) => (
              <TableRow key={i}>
                <TableCell>
                  <p className="text-sm font-medium">{li.productName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {li.productCode}
                  </p>
                </TableCell>
                <TableCell className="text-center font-semibold text-emerald-600">
                  +{li.quantity}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatCurrency(li.unitCost)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(li.totalCost)}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-xs text-muted-foreground">
                    {li.previousQuantity} →{" "}
                    <span className="font-semibold text-foreground">{li.newQuantity}</span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Payment
            </h3>
            <Separator />
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                <p className="font-semibold mt-0.5">{formatCurrency(e.totalCost)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid</p>
                <p className="font-semibold mt-0.5 text-emerald-600">
                  {formatCurrency(e.amountPaid)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Due</p>
                <p
                  className={`font-semibold mt-0.5 ${
                    e.amountDue > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {formatCurrency(e.amountDue)}
                </p>
              </div>
            </div>
            {e.amountDue > 0.01 && status !== "CANCELLED" && (
              <div className="pt-1 print:hidden">
                <StockEntryPayment entryId={e._id} amountDue={e.amountDue} />
              </div>
            )}
            {e.amountDue <= 0.01 && status !== "CANCELLED" && (
              <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Fully paid
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3 text-xs text-muted-foreground">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <StickyNote className="h-3.5 w-3.5" /> Notes
            </h3>
            <Separator />
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {e.notes || "—"}
            </p>
            <Separator />
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-foreground font-medium">
                  {formatDate(e.createdAt, true)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className={`mt-1 font-bold text-base ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
