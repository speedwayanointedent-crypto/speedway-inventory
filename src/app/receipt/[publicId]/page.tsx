import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Wrench, CheckCircle2 } from "lucide-react";
import { getSaleByPublicId } from "@/actions/sales";
import { generateQRCodeDataURL, buildReceiptUrl } from "@/lib/qr";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { APP_CONFIG, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ReceiptActions } from "@/components/receipt/receipt-actions";

interface Props {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  const sale = (await getSaleByPublicId(publicId)) as { saleNumber?: string } | null;
  if (!sale) return { title: "Receipt not found" };
  return {
    title: `Receipt ${sale.saleNumber}`,
    robots: { index: false, follow: false },
  };
}

export default async function ReceiptPage({ params }: Props) {
  const { publicId } = await params;
  const sale = (await getSaleByPublicId(publicId)) as
    | (Record<string, unknown> & {
        items: Array<{
          productName: string;
          productCode: string;
          quantity: number;
          unitPrice: number;
          subtotal: number;
        }>;
      })
    | null;
  if (!sale) notFound();

  const qrDataUrl = await generateQRCodeDataURL(buildReceiptUrl(publicId), 200);

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="no-print flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Wrench className="h-4 w-4" />
            </div>
            <span className="font-semibold">{APP_CONFIG.shortName}</span>
          </Link>
          <ReceiptActions publicId={publicId} />
        </div>

        <Card className="overflow-hidden print:shadow-none print:border-0">
          <CardContent className="p-8 space-y-5" id="receipt">
            <div className="text-center space-y-1">
              <div className="mx-auto h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center mb-2">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">{APP_CONFIG.name}</h1>
              <p className="text-xs text-muted-foreground">Wholesale Spare Parts</p>
              <p className="text-xs text-muted-foreground">{APP_CONFIG.phone}</p>
              <p className="text-xs text-muted-foreground">{APP_CONFIG.email}</p>
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              <Row label="Receipt #" value={sale.saleNumber as string} />
              <Row label="Date" value={formatDate(sale.createdAt as string, true)} />
              <Row label="Customer" value={sale.customerName as string} />
              <Row label="Cashier" value={sale.staffName as string} />
              <Row
                label="Payment"
                value={PAYMENT_METHOD_LABELS[sale.paymentMethod as PaymentMethod]}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={(sale.status as string) === "COMPLETED" ? "success" : "warning"}>
                  {sale.status as string}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              {sale.items.map((item, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium truncate pr-2">{item.productName}</span>
                    <span className="font-semibold whitespace-nowrap">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
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
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(sale.total as number)}</span>
              </div>
              <Row label="Amount Paid" value={formatCurrency(sale.amountPaid as number)} />
              <Row label="Change" value={formatCurrency(sale.change as number)} />
            </div>

            <Separator />

            <div className="flex flex-col items-center gap-2 pt-2">
              <Image
                src={qrDataUrl}
                alt="Receipt QR"
                width={140}
                height={140}
                unoptimized
                className="rounded"
              />
              <p className="text-xs text-muted-foreground text-center">
                Scan to view this receipt online
              </p>
            </div>

            <p className="text-center text-xs text-muted-foreground border-t pt-4">
              {APP_CONFIG.receiptFooter}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
