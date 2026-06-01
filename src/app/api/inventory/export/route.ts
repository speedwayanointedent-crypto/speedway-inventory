import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { requireAuth } from "@/lib/session";

export async function GET() {
  await requireAuth();
  await connectDB();
  const products = await Product.find().populate("category", "name").lean();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Inventory");
  ws.columns = [
    { header: "Product Code", key: "code", width: 16 },
    { header: "Name", key: "name", width: 32 },
    { header: "SKU", key: "sku", width: 16 },
    { header: "Category", key: "category", width: 18 },
    { header: "Brand", key: "brand", width: 16 },
    { header: "Stock", key: "stock", width: 10 },
    { header: "Reorder Level", key: "reorder", width: 14 },
    { header: "Cost Price", key: "cost", width: 12 },
    { header: "Selling Price", key: "sell", width: 14 },
    { header: "Wholesale Price", key: "wholesale", width: 14 },
    { header: "Status", key: "status", width: 12 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  for (const p of products) {
    ws.addRow({
      code: p.productCode,
      name: p.name,
      sku: p.sku,
      category: (p.category as { name?: string })?.name || "",
      brand: p.brand || "",
      stock: p.quantity,
      reorder: p.reorderLevel,
      cost: p.costPrice,
      sell: p.sellingPrice,
      wholesale: p.wholesalePrice,
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
