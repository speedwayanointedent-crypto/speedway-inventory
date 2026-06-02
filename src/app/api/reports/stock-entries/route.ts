import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { StockEntry } from "@/models";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateReportPDF } from "@/lib/pdf";
import {
  STOCK_ENTRY_STATUS_LABELS,
  STOCK_PAYMENT_METHOD_LABELS,
  type StockEntryStatus,
  type StockPaymentMethod,
} from "@/lib/constants";

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
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const supplier = url.searchParams.get("supplier");
  const status = url.searchParams.get("status");
  const paymentStatus = url.searchParams.get("paymentStatus");
  const shop = url.searchParams.get("shop");
  const search = url.searchParams.get("search");

  const filter: Record<string, unknown> = {};
  if (from || to) {
    filter.entryDate = {};
    if (from) (filter.entryDate as Record<string, Date>).$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      (filter.entryDate as Record<string, Date>).$lte = toDate;
    }
  }
  if (supplier && supplier !== "all") filter.supplier = supplier;
  if (status && status !== "all") filter.status = status;
  if (paymentStatus && paymentStatus !== "all") filter.paymentStatus = paymentStatus;
  if (shop && shop !== "all") filter.shop = shop;
  if (search) {
    filter.$or = [
      { referenceNumber: { $regex: search, $options: "i" } },
      { invoiceNumber: { $regex: search, $options: "i" } },
      { supplierName: { $regex: search, $options: "i" } },
      { "lineItems.productName": { $regex: search, $options: "i" } },
    ];
  }

  const entries = await StockEntry.find(filter).sort({ entryDate: -1 }).lean();

  const totalCost = entries.reduce((s, e) => s + e.totalCost, 0);
  const totalDue = entries.reduce((s, e) => s + e.amountDue, 0);
  const totalPaid = entries.reduce((s, e) => s + e.amountPaid, 0);
  const totalQuantity = entries.reduce((s, e) => s + e.totalQuantity, 0);

  if (format === "csv") {
    const rows: string[][] = [
      [
        "Reference",
        "Date",
        "Supplier",
        "Invoice",
        "Shop",
        "Status",
        "Items",
        "Units",
        "Total Cost",
        "Amount Paid",
        "Amount Due",
        "Payment Status",
        "Payment Method",
        "Recorded By",
      ],
      ...entries.map((e) => [
        e.referenceNumber,
        formatDate(e.entryDate, true),
        e.supplierName || "",
        e.invoiceNumber || "",
        e.shopName || "",
        STOCK_ENTRY_STATUS_LABELS[e.status as StockEntryStatus] || e.status,
        String(e.totalItems),
        String(e.totalQuantity),
        e.totalCost.toFixed(2),
        e.amountPaid.toFixed(2),
        e.amountDue.toFixed(2),
        e.paymentStatus,
        e.paymentMethod
          ? STOCK_PAYMENT_METHOD_LABELS[e.paymentMethod as StockPaymentMethod] || e.paymentMethod
          : "",
        e.userName,
      ]),
      [],
      ["TOTAL", "", "", "", "", "", String(entries.length), String(totalQuantity), totalCost.toFixed(2), totalPaid.toFixed(2), totalDue.toFixed(2), "", "", ""],
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="stock-intake-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const headers = [
      "Ref",
      "Date",
      "Supplier",
      "Items",
      "Units",
      "Cost",
      "Paid",
      "Due",
      "Status",
    ];
    const rows = entries.map((e) => [
      e.referenceNumber,
      formatDate(e.entryDate),
      e.supplierName || "—",
      String(e.totalItems),
      String(e.totalQuantity),
      formatCurrency(e.totalCost),
      formatCurrency(e.amountPaid),
      formatCurrency(e.amountDue),
      `${STOCK_ENTRY_STATUS_LABELS[e.status as StockEntryStatus] || e.status} / ${e.paymentStatus}`,
    ]);
    rows.push([
      "TOTAL",
      "",
      "",
      String(entries.length),
      String(totalQuantity),
      formatCurrency(totalCost),
      formatCurrency(totalPaid),
      formatCurrency(totalDue),
      "",
    ]);
    const pdf = generateReportPDF(
      `Stock Intake Report · ${from || "All"} → ${to || "Now"}`,
      headers,
      rows
    );
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="stock-intake-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Stock Intake");
  ws.columns = [
    { header: "Reference", key: "ref", width: 20 },
    { header: "Date", key: "date", width: 18 },
    { header: "Supplier", key: "sup", width: 22 },
    { header: "Invoice", key: "inv", width: 16 },
    { header: "Shop", key: "shop", width: 18 },
    { header: "Status", key: "st", width: 12 },
    { header: "Payment", key: "pay", width: 12 },
    { header: "Method", key: "m", width: 14 },
    { header: "Items", key: "i", width: 8 },
    { header: "Units", key: "u", width: 8 },
    { header: "Total Cost", key: "tc", width: 12 },
    { header: "Paid", key: "pd", width: 12 },
    { header: "Due", key: "du", width: 12 },
    { header: "By", key: "by", width: 14 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  for (const e of entries) {
    ws.addRow({
      ref: e.referenceNumber,
      date: formatDate(e.entryDate, true),
      sup: e.supplierName || "",
      inv: e.invoiceNumber || "",
      shop: e.shopName || "",
      st: STOCK_ENTRY_STATUS_LABELS[e.status as StockEntryStatus] || e.status,
      pay: e.paymentStatus,
      m: e.paymentMethod
        ? STOCK_PAYMENT_METHOD_LABELS[e.paymentMethod as StockPaymentMethod] || e.paymentMethod
        : "",
      i: e.totalItems,
      u: e.totalQuantity,
      tc: e.totalCost,
      pd: e.amountPaid,
      du: e.amountDue,
      by: e.userName,
    });
  }
  ws.addRow({});
  const totalRow = ws.addRow({
    ref: "TOTAL",
    i: entries.length,
    u: totalQuantity,
    tc: totalCost,
    pd: totalPaid,
    du: totalDue,
  });
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stock-intake-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
