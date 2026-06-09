import { NextResponse } from "next/server";
import { getSaleByPublicId } from "@/actions/sales";
import { generateReceiptPDF } from "@/lib/pdf";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export async function GET(
  _req: Request,
  context: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await context.params;
  const sale = (await getSaleByPublicId(publicId)) as Record<string, unknown> | null;
  if (!sale) return new NextResponse("Not found", { status: 404 });

  const pdf = await generateReceiptPDF({
    saleNumber: sale.saleNumber as string,
    publicId,
    date: formatDate(sale.createdAt as string, true),
    staffName: sale.staffName as string,
    items: sale.items as Array<{
      productName: string;
      productCode: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>,
    subtotal: sale.subtotal as number,
    totalDiscount: sale.totalDiscount as number,
    tax: sale.tax as number,
    total: sale.total as number,
    paymentMethod: PAYMENT_METHOD_LABELS[sale.paymentMethod as PaymentMethod],
    amountPaid: sale.amountPaid as number,
    change: sale.change as number,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${sale.saleNumber}.pdf"`,
    },
  });
}
