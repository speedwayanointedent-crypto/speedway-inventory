import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SupplierReturn } from "@/models";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateReportPDF } from "@/lib/pdf";
import {
  SUPPLIER_RETURN_STATUS_LABELS,
  SUPPLIER_RETURN_REASON_LABELS,
  SUPPLIER_RETURN_RESOLUTION_LABELS,
  type SupplierReturnStatus,
  type SupplierReturnReason,
  type SupplierReturnResolution,
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
  const supplierId = url.searchParams.get("supplierId");
  const status = url.searchParams.get("status");

  const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  from.setHours(0, 0, 0, 0);
  const to = toStr ? new Date(toStr) : new Date();
  to.setHours(23, 59, 59, 999);

  const match: Record<string, unknown> = {
    returnDate: { $gte: from, $lte: to },
  };
  if (supplierId && supplierId !== "all") match.supplier = supplierId;
  if (status && status !== "all") match.status = status;

  const returns = await SupplierReturn.find(match).sort({ returnDate: -1 }).lean();

  const totalValue = returns.reduce((s, r) => s + (r.totalValue || 0), 0);
  const totalRefunded = returns.reduce((s, r) => s + (r.actualRefundAmount || 0), 0);

  if (format === "csv") {
    const csvRows: string[][] = [
      [
        "Reference",
        "Date",
        "Supplier",
        "Reason",
        "Status",
        "Resolution",
        "Items",
        "Units",
        "Value",
        "Expected Refund",
        "Actual Refund",
        "Tracking #",
        "Notes",
      ],
      ...returns.map((r) => [
        r.referenceNumber,
        formatDate(r.returnDate),
        r.supplierName || "",
        SUPPLIER_RETURN_REASON_LABELS[r.primaryReason as SupplierReturnReason] || r.primaryReason,
        SUPPLIER_RETURN_STATUS_LABELS[r.status as SupplierReturnStatus] || r.status,
        SUPPLIER_RETURN_RESOLUTION_LABELS[r.resolution as SupplierReturnResolution] || r.resolution,
        String(r.totalItems),
        String(r.totalQuantity),
        (r.totalValue || 0).toFixed(2),
        (r.expectedRefundAmount || 0).toFixed(2),
        (r.actualRefundAmount || 0).toFixed(2),
        r.trackingNumber || "",
        (r.notes || "").replace(/[\r\n]+/g, " "),
      ]),
    ];
    const csv = csvRows.map((r) => r.map(csvEscape).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="supplier-returns-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const headers = [
      "Reference",
      "Date",
      "Supplier",
      "Status",
      "Items",
      "Value",
      "Refunded",
    ];
    const tableRows = returns.map((r) => [
      r.referenceNumber,
      formatDate(r.returnDate),
      r.supplierName || "—",
      SUPPLIER_RETURN_STATUS_LABELS[r.status as SupplierReturnStatus] || r.status,
      String(r.totalItems),
      formatCurrency(r.totalValue),
      formatCurrency(r.actualRefundAmount),
    ]);
    tableRows.push([
      "TOTAL",
      "",
      "",
      "",
      String(returns.length),
      formatCurrency(totalValue),
      formatCurrency(totalRefunded),
    ]);
    const pdf = generateReportPDF(
      `Supplier Returns · ${formatDate(from.toISOString())} → ${formatDate(to.toISOString())}`,
      headers,
      tableRows
    );
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="supplier-returns-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Supplier Returns");
  ws.columns = [
    { header: "Reference", key: "r", width: 20 },
    { header: "Date", key: "d", width: 14 },
    { header: "Supplier", key: "s", width: 24 },
    { header: "Reason", key: "rs", width: 18 },
    { header: "Status", key: "st", width: 14 },
    { header: "Resolution", key: "rl", width: 14 },
    { header: "Items", key: "i", width: 8 },
    { header: "Units", key: "u", width: 8 },
    { header: "Value", key: "v", width: 12 },
    { header: "Expected", key: "e", width: 12 },
    { header: "Refunded", key: "a", width: 12 },
    { header: "Tracking", key: "t", width: 18 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE11D48" } };
  for (const r of returns) {
    ws.addRow({
      r: r.referenceNumber,
      d: formatDate(r.returnDate),
      s: r.supplierName || "",
      rs: SUPPLIER_RETURN_REASON_LABELS[r.primaryReason as SupplierReturnReason] || r.primaryReason,
      st: SUPPLIER_RETURN_STATUS_LABELS[r.status as SupplierReturnStatus] || r.status,
      rl: SUPPLIER_RETURN_RESOLUTION_LABELS[r.resolution as SupplierReturnResolution] || r.resolution,
      i: r.totalItems,
      u: r.totalQuantity,
      v: r.totalValue,
      e: r.expectedRefundAmount,
      a: r.actualRefundAmount,
      t: r.trackingNumber || "",
    });
  }
  ws.addRow({});
  const totalRow = ws.addRow({
    r: "TOTAL",
    i: returns.length,
    v: totalValue,
    e: returns.reduce((s, r) => s + r.expectedRefundAmount, 0),
    a: totalRefunded,
  });
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });

  const detail = wb.addWorksheet("Items");
  detail.columns = [
    { header: "Reference", key: "r", width: 20 },
    { header: "Product", key: "p", width: 28 },
    { header: "Code", key: "c", width: 14 },
    { header: "Quantity", key: "q", width: 10 },
    { header: "Unit Cost", key: "uc", width: 12 },
    { header: "Total", key: "t", width: 12 },
    { header: "Reason", key: "rs", width: 18 },
    { header: "Restockable", key: "rest", width: 12 },
  ];
  detail.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  detail.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE11D48" } };
  for (const r of returns) {
    for (const item of r.items) {
      detail.addRow({
        r: r.referenceNumber,
        p: item.productName,
        c: item.productCode,
        q: item.quantity,
        uc: item.unitCost,
        t: item.totalCost,
        rs: SUPPLIER_RETURN_REASON_LABELS[item.reason as SupplierReturnReason] || item.reason,
        rest: item.restockable ? "Yes" : "No",
      });
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="supplier-returns-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
