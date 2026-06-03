import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { StockEntry, Settings } from "@/models";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  STOCK_ENTRY_STATUS_LABELS,
  STOCK_PAYMENT_METHOD_LABELS,
  type StockEntryStatus,
  type StockPaymentMethod,
} from "@/lib/constants";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  await connectDB();

  const { id } = await params;
  const entry = await StockEntry.findById(id).lean();
  if (!entry) return new NextResponse("Not found", { status: 404 });

  const settings = await Settings.findOne().lean();
  const companyName = settings?.companyName || "SpeedWay Anointed Enterprise";
  const companyAddress = settings?.address || "";
  const companyPhone = settings?.phone || "";
  const companyEmail = settings?.email || "";
  const currencySymbol = settings?.currencySymbol || "GH₵";

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold").setFontSize(18);
  doc.text(companyName, 14, 18);
  doc.setFont("helvetica", "normal").setFontSize(9);
  if (companyAddress) doc.text(companyAddress, 14, 24);
  if (companyPhone || companyEmail) {
    doc.text([companyPhone, companyEmail].filter(Boolean).join(" · "), 14, 29);
  }

  doc.setFont("helvetica", "bold").setFontSize(14);
  doc.text("Stock Intake Receipt", pageWidth - 14, 18, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(9);
  doc.text(entry.referenceNumber, pageWidth - 14, 24, { align: "right" });
  doc.text(formatDate(entry.entryDate, true), pageWidth - 14, 29, { align: "right" });

  doc.setLineWidth(0.3);
  doc.line(14, 34, pageWidth - 14, 34);

  doc.setFontSize(9);
  let y = 40;
  const col1 = 14;
  const col2 = pageWidth / 2 + 4;

  const labelValue = (x: number, yy: number, label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, yy);
    doc.setFont("helvetica", "normal");
    doc.text(value, x + 35, yy);
  };

  labelValue(col1, y, "Supplier:", entry.supplierName || "Unspecified");
  labelValue(col2, y, "Status:", STOCK_ENTRY_STATUS_LABELS[entry.status as StockEntryStatus] || entry.status);
  y += 6;
  labelValue(col1, y, "Invoice:", entry.invoiceNumber || "—");
  labelValue(col2, y, "Payment:", entry.paymentStatus);
  y += 6;
  labelValue(col1, y, "Shop:", entry.shopName || "Default");
  labelValue(
    col2,
    y,
    "Method:",
    entry.paymentMethod
      ? STOCK_PAYMENT_METHOD_LABELS[entry.paymentMethod as StockPaymentMethod] || entry.paymentMethod
      : "—"
  );
  y += 6;
  labelValue(col1, y, "Received:", entry.receivedDate ? formatDate(entry.receivedDate, true) : "—");
  labelValue(col2, y, "Recorded by:", entry.userName);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["#", "Product", "Code", "Qty", "Unit cost", "Line total"]],
    body: entry.lineItems.map((li, i) => [
      String(i + 1),
      li.productName,
      li.productCode,
      String(li.quantity),
      formatCurrency(li.unitCost),
      formatCurrency(li.totalCost),
    ]),
    foot: [
      [
        "",
        "",
        `${entry.totalItems} items · ${entry.totalQuantity} units`,
        "TOTAL",
        formatCurrency(entry.totalCost),
      ],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    theme: "striped",
    margin: { left: 14, right: 14 },
  });

  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const rightCol = pageWidth - 14;
  const labelW = 50;
  doc.setFontSize(10);
  const totals = [
    ["Total cost:", formatCurrency(entry.totalCost)],
    ["Amount paid:", formatCurrency(entry.amountPaid)],
    ["Balance due:", formatCurrency(entry.amountDue)],
  ];
  for (const [label, value] of totals) {
    doc.setFont("helvetica", "bold");
    doc.text(label, rightCol - labelW, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`${currencySymbol} ${value.replace(/[^\d.,-]/g, "")}`, rightCol, y, { align: "right" });
    y += 6;
  }

  if (entry.notes) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 14, y);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(entry.notes, pageWidth - 28);
    doc.text(wrapped, 14, y + 5);
  }

  if (entry.status === "CANCELLED") {
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold").setFontSize(20);
    doc.text("CANCELLED", pageWidth / 2, 60, { align: "center", angle: 30 });
    doc.setTextColor(0, 0, 0);
  }

  doc.setFont("helvetica", "normal").setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: "center" }
  );

  const pdfBuffer = doc.output("arraybuffer");
  return new NextResponse(Buffer.from(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="stock-${entry.referenceNumber}.pdf"`,
    },
  });
}
