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
  type StockEntryStatus,
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
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const supplierId = url.searchParams.get("supplier");

  const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  from.setHours(0, 0, 0, 0);
  const to = toStr ? new Date(toStr) : new Date();
  to.setHours(23, 59, 59, 999);

  const match: Record<string, unknown> = {
    entryDate: { $gte: from, $lte: to },
  };
  if (supplierId && supplierId !== "all") match.supplier = supplierId;

  const entries = await StockEntry.find(match).sort({ entryDate: -1 }).lean();

  const supplierMap = new Map<
    string,
    {
      supplierId: string;
      supplierName: string;
      entries: number;
      products: number;
      quantity: number;
      cost: number;
      paid: number;
      due: number;
    }
  >();

  for (const e of entries) {
    if (!e.supplier) continue;
    const key = e.supplier.toString();
    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        supplierId: key,
        supplierName: e.supplierName || "Unspecified",
        entries: 0,
        products: 0,
        quantity: 0,
        cost: 0,
        paid: 0,
        due: 0,
      });
    }
    const s = supplierMap.get(key)!;
    s.entries += 1;
    s.products += e.lineItems.length;
    s.quantity += e.totalQuantity;
    s.cost += e.totalCost;
    s.paid += e.amountPaid;
    s.due += e.amountDue;
  }

  const rows = Array.from(supplierMap.values()).sort((a, b) => b.cost - a.cost);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
  const totalDue = rows.reduce((s, r) => s + r.due, 0);

  if (format === "csv") {
    const csvRows: string[][] = [
      [
        "Supplier",
        "Intakes",
        "Products",
        "Units",
        "Purchased",
        "Paid",
        "Outstanding",
      ],
      ...rows.map((r) => [
        r.supplierName,
        String(r.entries),
        String(r.products),
        String(r.quantity),
        r.cost.toFixed(2),
        r.paid.toFixed(2),
        r.due.toFixed(2),
      ]),
      [],
      ["TOTAL", String(entries.length), "", String(rows.reduce((s, r) => s + r.quantity, 0)), totalCost.toFixed(2), totalPaid.toFixed(2), totalDue.toFixed(2)],
    ];
    const csv = csvRows.map((r) => r.map(csvEscape).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="supplier-purchases-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const headers = ["Supplier", "Intakes", "Products", "Units", "Purchased", "Paid", "Outstanding"];
    const tableRows = rows.map((r) => [
      r.supplierName,
      String(r.entries),
      String(r.products),
      String(r.quantity),
      formatCurrency(r.cost),
      formatCurrency(r.paid),
      formatCurrency(r.due),
    ]);
    tableRows.push([
      "TOTAL",
      String(entries.length),
      "",
      String(rows.reduce((s, r) => s + r.quantity, 0)),
      formatCurrency(totalCost),
      formatCurrency(totalPaid),
      formatCurrency(totalDue),
    ]);
    const pdf = generateReportPDF(
      `Supplier Purchase Report · ${formatDate(from.toISOString())} → ${formatDate(to.toISOString())}`,
      headers,
      tableRows
    );
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="supplier-purchases-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Supplier Purchases");
  ws.columns = [
    { header: "Supplier", key: "s", width: 24 },
    { header: "Intakes", key: "i", width: 10 },
    { header: "Products", key: "p", width: 10 },
    { header: "Units", key: "u", width: 10 },
    { header: "Purchased", key: "cost", width: 14 },
    { header: "Paid", key: "paid", width: 14 },
    { header: "Outstanding", key: "due", width: 14 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  for (const r of rows) {
    ws.addRow({
      s: r.supplierName,
      i: r.entries,
      p: r.products,
      u: r.quantity,
      cost: r.cost,
      paid: r.paid,
      due: r.due,
    });
  }
  ws.addRow({});
  const totalRow = ws.addRow({
    s: "TOTAL",
    i: entries.length,
    u: rows.reduce((s, r) => s + r.quantity, 0),
    cost: totalCost,
    paid: totalPaid,
    due: totalDue,
  });
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });

  const detail = wb.addWorksheet("Entries");
  detail.columns = [
    { header: "Reference", key: "r", width: 20 },
    { header: "Date", key: "d", width: 18 },
    { header: "Supplier", key: "s", width: 22 },
    { header: "Invoice", key: "i", width: 16 },
    { header: "Status", key: "st", width: 12 },
    { header: "Items", key: "it", width: 8 },
    { header: "Units", key: "u", width: 8 },
    { header: "Total", key: "t", width: 12 },
    { header: "Due", key: "du", width: 12 },
  ];
  detail.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  detail.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  for (const e of entries) {
    detail.addRow({
      r: e.referenceNumber,
      d: formatDate(e.entryDate, true),
      s: e.supplierName || "",
      i: e.invoiceNumber || "",
      st: STOCK_ENTRY_STATUS_LABELS[e.status as StockEntryStatus] || e.status,
      it: e.totalItems,
      u: e.totalQuantity,
      t: e.totalCost,
      du: e.amountDue,
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="supplier-purchases-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
