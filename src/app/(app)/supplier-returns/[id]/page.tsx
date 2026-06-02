import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  StickyNote,
  FileText,
  Package,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/session";
import { PERMISSIONS, SUPPLIER_RETURN_STATUS_LABELS, SUPPLIER_RETURN_REASON_LABELS, SUPPLIER_RETURN_RESOLUTION_LABELS } from "@/lib/constants";
import { getSupplierReturn } from "@/actions/supplier-returns";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SupplierReturnActions } from "@/components/inventory/supplier-return-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusStyles: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  APPROVED: { bg: "bg-blue-100", text: "text-blue-700", icon: CheckCircle2 },
  IN_TRANSIT: { bg: "bg-indigo-100", text: "text-indigo-700", icon: Truck },
  COMPLETED: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
  REJECTED: { bg: "bg-rose-100", text: "text-rose-700", icon: XCircle },
  CANCELLED: { bg: "bg-zinc-100", text: "text-zinc-700", icon: XCircle },
};

export default async function SupplierReturnDetailPage({ params }: PageProps) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  const { id } = await params;
  const ret = (await getSupplierReturn(id)) as any;
  if (!ret) notFound();

  const StatusIcon = statusStyles[ret.status]?.icon || AlertCircle;
  const statusClass = statusStyles[ret.status] || statusStyles.PENDING;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-7 -ml-2">
          <Link href="/supplier-returns">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to returns
          </Link>
        </Button>
      </div>

      <PageHeader
        title={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono">{ret.referenceNumber}</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass.bg} ${statusClass.text}`}
            >
              <StatusIcon className="h-3 w-3" />
              {SUPPLIER_RETURN_STATUS_LABELS[ret.status as keyof typeof SUPPLIER_RETURN_STATUS_LABELS]}
            </span>
          </div>
        }
        description={`Recorded on ${formatDate(ret.createdAt, true)} by ${ret.userName}`}
      >
        <SupplierReturnActions
          returnId={ret._id}
          status={ret.status}
          expectedRefundAmount={ret.expectedRefundAmount}
        />
      </PageHeader>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Items
            </p>
            <p className="text-xl font-bold mt-1">{ret.totalItems}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {ret.totalQuantity} units
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Return Value
            </p>
            <p className="text-xl font-bold mt-1">{formatCurrency(ret.totalValue)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              At cost price
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Refund Expected
            </p>
            <p className="text-xl font-bold mt-1">
              {formatCurrency(ret.expectedRefundAmount)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {SUPPLIER_RETURN_RESOLUTION_LABELS[ret.resolution as keyof typeof SUPPLIER_RETURN_RESOLUTION_LABELS]}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Refund Received
            </p>
            <p className="text-xl font-bold mt-1">
              {formatCurrency(ret.actualRefundAmount)}
            </p>
            {ret.completedDate && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatDate(ret.completedDate)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items being returned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ret.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-3 rounded-md border bg-card flex-wrap"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.productCode} · {item.sku}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">
                          Reason:{" "}
                          <strong>
                            {SUPPLIER_RETURN_REASON_LABELS[item.reason as keyof typeof SUPPLIER_RETURN_REASON_LABELS] || item.reason}
                          </strong>
                        </span>
                        {item.restockable ? (
                          <span className="text-[10px] text-emerald-600">
                            · Restockable (removed from stock)
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600">
                            · Damaged (kept in stock)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {item.quantity} × {formatCurrency(item.unitCost)}
                      </p>
                      <p className="text-base font-bold tabular-nums">
                        {formatCurrency(item.totalCost)}
                      </p>
                      {item.restockable && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Stock: {item.previousQuantity} → {item.newQuantity}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {ret.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{ret.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Supplier & Origin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Supplier</p>
                <p className="font-medium">{ret.supplierName || "—"}</p>
              </div>
              {ret.originalStockEntry && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Linked intake</p>
                  <Link
                    href={`/stock-entries/${ret.originalStockEntry}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {ret.originalStockEntryRef || ret.originalStockEntry}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Return date</p>
                <p className="font-medium">{formatDate(ret.returnDate)}</p>
              </div>
              {ret.trackingNumber && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Tracking #</p>
                  <p className="font-mono text-xs">{ret.trackingNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Created</p>
                <p>
                  {formatDate(ret.createdAt, true)} by {ret.userName}
                </p>
              </div>
              {ret.approvedAt && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Approved</p>
                  <p>
                    {formatDate(ret.approvedAt, true)} by {ret.approvedByName}
                  </p>
                </div>
              )}
              {ret.shippedDate && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Shipped</p>
                  <p>{formatDate(ret.shippedDate, true)}</p>
                </div>
              )}
              {ret.completedDate && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Completed</p>
                  <p>{formatDate(ret.completedDate, true)}</p>
                </div>
              )}
              {ret.cancelledDate && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Cancelled</p>
                  <p className="text-rose-600">
                    {formatDate(ret.cancelledDate, true)}
                    {ret.cancelledReason && ` — ${ret.cancelledReason}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
