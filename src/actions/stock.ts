"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Product, StockEntry, InventoryTransaction, Supplier } from "@/models";
import { requirePermission } from "@/lib/session";
import { stockEntrySchema, type StockEntryInput } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { safeJSON } from "@/lib/utils";

export async function createStockEntry(input: StockEntryInput) {
  const user = await requirePermission(PERMISSIONS.CREATE_INVENTORY);
  const data = stockEntrySchema.parse(input);

  await connectDB();
  const product = await Product.findById(data.product);
  if (!product) return { success: false, error: "Product not found" };

  const previousQuantity = product.quantity;
  product.quantity += data.quantityAdded;
  if (data.purchaseCost) product.costPrice = data.purchaseCost;
  await product.save();

  let supplierName: string | undefined;
  if (data.supplier) {
    const supplier = await Supplier.findById(data.supplier);
    if (supplier) {
      supplierName = supplier.companyName;
      supplier.totalPurchases += data.purchaseCost * data.quantityAdded;
      await supplier.save();
    }
  }

  const entry = await StockEntry.create({
    product: data.product,
    productName: product.name,
    quantityAdded: data.quantityAdded,
    purchaseCost: data.purchaseCost,
    totalCost: data.purchaseCost * data.quantityAdded,
    supplier: data.supplier || undefined,
    supplierName,
    invoiceNumber: data.invoiceNumber,
    notes: data.notes,
    entryDate: data.entryDate ? new Date(data.entryDate as string) : new Date(),
    user: user.id,
    userName: user.name,
  });

  await InventoryTransaction.create({
    product: product._id,
    productName: product.name,
    type: "STOCK_IN",
    previousQuantity,
    changeQuantity: data.quantityAdded,
    newQuantity: product.quantity,
    reason: data.notes || "Stock intake",
    reference: entry._id.toString(),
    referenceModel: "StockEntry",
    user: user.id,
    userName: user.name,
  });

  await logActivity(user, {
    action: "STOCK_IN",
    module: "INVENTORY",
    description: `Added ${data.quantityAdded} units of ${product.name}`,
    metadata: { entryId: entry._id.toString(), productId: data.product },
  });

  revalidatePath("/inventory");
  revalidatePath("/stock-entries");
  return { success: true, id: entry._id.toString() };
}

export async function getStockEntries(opts?: {
  search?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  if (opts?.search) {
    filter.$or = [
      { productName: { $regex: opts.search, $options: "i" } },
      { invoiceNumber: { $regex: opts.search, $options: "i" } },
      { supplierName: { $regex: opts.search, $options: "i" } },
    ];
  }
  if (opts?.from || opts?.to) {
    filter.entryDate = {};
    if (opts.from) (filter.entryDate as Record<string, Date>).$gte = new Date(opts.from);
    if (opts.to) (filter.entryDate as Record<string, Date>).$lte = new Date(opts.to);
  }

  const [items, total] = await Promise.all([
    StockEntry.find(filter).sort({ entryDate: -1 }).skip(skip).limit(limit).lean(),
    StockEntry.countDocuments(filter),
  ]);

  return { items: safeJSON<unknown[]>(items), total, page, totalPages: Math.ceil(total / limit) };
}
