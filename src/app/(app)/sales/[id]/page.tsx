import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { getSale } from "@/actions/sales";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SaleActions } from "@/components/sales/sale-actions";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = (await getSale(id)) as Record<string, unknown> | null;
  if (!sale) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold font-mono">{sale.saleNumber as string}</h1>
            <p className="text-xs text-muted-foreground">
              {formatDate(sale.createdAt as string, true)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/receipt/${sale.publicId}`} target="_blank" rel="noopener noreferrer">
              <Printer className="h-4 w-4" /> Receipt
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/api/receipts/${sale.publicId}/pdf`}>
              <Download className="h-4 w-4" /> PDF
            </Link>
          </Button>
          {(sale.status as string) === "COMPLETED" && (
            <SaleActions id={id} />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(sale.items as Array<{
                    productName: string;
                    productCode: string;
                    quantity: number;
                    unitPrice: number;
                    subtotal: number;
                  }>).map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.productCode}</p>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {Boolean(sale.notes) && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{String(sale.notes)}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Summary</h3>
                <Badge
                  variant={
                    (sale.status as string) === "COMPLETED"
                      ? "success"
                      : (sale.status as string) === "REFUNDED"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {sale.status as string}
                </Badge>
              </div>
              <div className="text-sm space-y-1.5">
                <Row label="Subtotal" value={formatCurrency(sale.subtotal as number)} />
                {(sale.totalDiscount as number) > 0 && (
                  <Row
                    label="Discount"
                    value={`-${formatCurrency(sale.totalDiscount as number)}`}
                  />
                )}
                {(sale.tax as number) > 0 && (
                  <Row label="Tax" value={formatCurrency(sale.tax as number)} />
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(sale.total as number)}</span>
                </div>
                <Row label="Paid" value={formatCurrency(sale.amountPaid as number)} />
                <Row label="Change" value={formatCurrency(sale.change as number)} />
                {(sale.refundedAmount as number) > 0 && (
                  <Row
                    label="Refunded"
                    value={`-${formatCurrency(sale.refundedAmount as number)}`}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <h3 className="text-sm font-semibold mb-2">Details</h3>
              <Row label="Customer" value={sale.customerName as string} />
              <Row label="Cashier" value={sale.staffName as string} />
              <Row
                label="Payment"
                value={PAYMENT_METHOD_LABELS[sale.paymentMethod as PaymentMethod]}
              />
              {(sale.isWholesale as boolean) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="info">Wholesale</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
