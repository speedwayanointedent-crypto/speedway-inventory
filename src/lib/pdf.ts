import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { APP_CONFIG } from "@/lib/constants";
import { generateQRCodeDataURL, buildReceiptUrl } from "@/lib/qr";

export interface ReceiptPdfData {
  saleNumber: string;
  publicId: string;
  date: string;
  staffName: string;
  items: Array<{
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  totalDiscount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
}

export async function generateReceiptPDF(data: ReceiptPdfData): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: [80, 297] });
  const pageWidth = 80;
  let y = 8;

  doc.setFont("helvetica", "bold").setFontSize(13);
  doc.text(APP_CONFIG.name, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal").setFontSize(8);
  doc.text("Wholesale Spare Parts", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text(APP_CONFIG.phone, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text(APP_CONFIG.email, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setLineWidth(0.2).line(4, y, pageWidth - 4, y);
  y += 4;

  doc.setFontSize(8);
  doc.text(`Receipt: ${data.saleNumber}`, 4, y);
  y += 4;
  doc.text(`Date: ${data.date}`, 4, y);
  y += 4;
  doc.text(`Cashier: ${data.staffName}`, 4, y);
  y += 3;
  doc.line(4, y, pageWidth - 4, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: 4, right: 4 },
    head: [["Item", "Qty", "Price", "Total"]],
    body: data.items.map((i) => [
      i.productName.substring(0, 18),
      String(i.quantity),
      i.unitPrice.toFixed(2),
      i.subtotal.toFixed(2),
    ]),
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 7 },
    theme: "plain",
  });

  // jspdf-autotable augments the jsPDF instance at runtime; cast to access lastAutoTable
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;
  doc.line(4, y, pageWidth - 4, y);
  y += 4;

  doc.setFontSize(8);
  const right = pageWidth - 4;
  doc.text("Subtotal:", 4, y);
  doc.text(`${APP_CONFIG.currencySymbol} ${data.subtotal.toFixed(2)}`, right, y, { align: "right" });
  y += 4;
  if (data.totalDiscount > 0) {
    doc.text("Discount:", 4, y);
    doc.text(`-${APP_CONFIG.currencySymbol} ${data.totalDiscount.toFixed(2)}`, right, y, { align: "right" });
    y += 4;
  }
  if (data.tax > 0) {
    doc.text("Tax:", 4, y);
    doc.text(`${APP_CONFIG.currencySymbol} ${data.tax.toFixed(2)}`, right, y, { align: "right" });
    y += 4;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Total:", 4, y);
  doc.text(`${APP_CONFIG.currencySymbol} ${data.total.toFixed(2)}`, right, y, { align: "right" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`Payment: ${data.paymentMethod}`, 4, y);
  y += 4;
  doc.text("Paid:", 4, y);
  doc.text(`${APP_CONFIG.currencySymbol} ${data.amountPaid.toFixed(2)}`, right, y, { align: "right" });
  y += 4;
  doc.text("Change:", 4, y);
  doc.text(`${APP_CONFIG.currencySymbol} ${data.change.toFixed(2)}`, right, y, { align: "right" });
  y += 4;
  doc.line(4, y, pageWidth - 4, y);
  y += 4;

  try {
    const qrUrl = buildReceiptUrl(data.publicId);
    const qrDataUrl = await generateQRCodeDataURL(qrUrl, 200);
    doc.addImage(qrDataUrl, "PNG", pageWidth / 2 - 12, y, 24, 24);
    y += 25;
    doc.setFontSize(6);
    doc.text("Scan to view receipt", pageWidth / 2, y, { align: "center" });
    y += 4;
  } catch (err) {
    console.error("QR pdf error", err);
  }

  doc.setFontSize(7);
  const footer = doc.splitTextToSize(APP_CONFIG.receiptFooter, pageWidth - 10);
  doc.text(footer, pageWidth / 2, y, { align: "center" });

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

export function generateReportPDF(title: string, headers: string[], rows: (string | number)[][]) {
  const doc = new jsPDF();
  doc.setFontSize(16).setFont("helvetica", "bold");
  doc.text(APP_CONFIG.name, 14, 18);
  doc.setFontSize(11).setFont("helvetica", "normal");
  doc.text(title, 14, 26);
  doc.setFontSize(9).text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [headers],
    body: rows.map((r) => r.map(String)),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    theme: "striped",
  });

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
