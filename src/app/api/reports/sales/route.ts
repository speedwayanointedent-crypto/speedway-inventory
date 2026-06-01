import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Sale } from "@/models";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateReportPDF } from "@/lib/pdf";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/constants";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  await connectDB();

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "excel").toLowerCase();
  const from = new Date(url.searchParams.get("from") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const to = new Date(url.searchParams.get("to") || new Date());

  const sales = await Sale.find({
    createdAt: { $gte: from, $lte: to },
    status: { $in: ["COMPLETED", "PARTIAL_REFUND"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const total = sales.reduce((s, r) => s + r.total, 0);
  const count = sales.length;

  if (format === "csv") {
    const rows = [
      ["Sale #", "Date", "Customer", "Cashier", "Payment", "Subtotal", "Discount", "Tax", "Total", "Status"],
      ...sales.map((s) => [
        s.saleNumber,
        formatDate(s.createdAt, true),
        s.customerName,
        s.staffName,
        PAYMENT_METHOD_LABELS[s.paymentMethod as PaymentMethod],
        s.subtotal.toFixed(2),
        s.totalDiscount.toFixed(2),
        s.tax.toFixed(2),
        s.total.toFixed(2),
        s.status,
      ]),
      [],
      ["", "", "", "", "TOTAL", "", "", "", total.toFixed(2), `${count} sales`],
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sales-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const headers = ["Sale #", "Date", "Customer", "Payment", "Total", "Status"];
    const rows = sales.map((s) => [
      s.saleNumber,
      formatDate(s.createdAt, true),
      s.customerName,
      PAYMENT_METHOD_LABELS[s.paymentMethod as PaymentMethod],
      formatCurrency(s.total),
      s.status,
    ]);
    rows.push(["", "", "", "TOTAL", formatCurrency(total), `${count} sales`]);
    const pdf = generateReportPDF("Sales Report", headers, rows);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sales-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sales");
  ws.columns = [
    { header: "Sale #", key: "n", width: 18 },
    { header: "Date", key: "d", width: 18 },
    { header: "Customer", key: "c", width: 22 },
    { header: "Cashier", key: "s", width: 18 },
    { header: "Payment", key: "p", width: 14 },
    { header: "Subtotal", key: "sub", width: 12 },
    { header: "Discount", key: "dis", width: 10 },
    { header: "Tax", key: "tax", width: 10 },
    { header: "Total", key: "t", width: 14 },
    { header: "Status", key: "st", width: 14 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  sales.forEach((s) =>
    ws.addRow({
      n: s.saleNumber,
      d: formatDate(s.createdAt, true),
      c: s.customerName,
      s: s.staffName,
      p: PAYMENT_METHOD_LABELS[s.paymentMethod as PaymentMethod],
      sub: s.subtotal,
      dis: s.totalDiscount,
      tax: s.tax,
      t: s.total,
      st: s.status,
    })
  );
  ws.addRow({});
  ws.addRow({ t: "TOTAL", st: `${count} sales`, n: "" }).font = { bold: true };
  const totalRow = ws.lastRow;
  if (totalRow) totalRow.getCell("t").value = total;

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sales-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
