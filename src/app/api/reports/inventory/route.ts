import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { formatCurrency } from "@/lib/utils";
import { generateReportPDF } from "@/lib/pdf";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  await connectDB();

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "excel").toLowerCase();
  const products = await Product.find().populate("category", "name").lean();

  if (format === "pdf") {
    const headers = ["Code", "Name", "Category", "Stock", "Cost", "Selling", "Value"];
    const rows = products.map((p) => [
      p.productCode,
      p.name,
      (p.category as { name?: string })?.name || "",
      String(p.quantity),
      formatCurrency(p.costPrice),
      formatCurrency(p.sellingPrice),
      formatCurrency(p.quantity * p.sellingPrice),
    ]);
    const pdf = generateReportPDF("Inventory Report", headers, rows);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="inventory-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Inventory");
  ws.columns = [
    { header: "Product Code", key: "code", width: 16 },
    { header: "Name", key: "name", width: 32 },
    { header: "Category", key: "category", width: 18 },
    { header: "Stock", key: "stock", width: 10 },
    { header: "Reorder Level", key: "reorder", width: 14 },
    { header: "Cost Price", key: "cost", width: 12 },
    { header: "Selling Price", key: "sell", width: 14 },
    { header: "Wholesale", key: "wh", width: 14 },
    { header: "Stock Value", key: "val", width: 14 },
    { header: "Status", key: "status", width: 12 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  for (const p of products) {
    ws.addRow({
      code: p.productCode,
      name: p.name,
      category: (p.category as { name?: string })?.name || "",
      stock: p.quantity,
      reorder: p.reorderLevel,
      cost: p.costPrice,
      sell: p.sellingPrice,
      wh: p.wholesalePrice,
      val: p.quantity * p.sellingPrice,
      status: p.status,
    });
  }
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="inventory-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
