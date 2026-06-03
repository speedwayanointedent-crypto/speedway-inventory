"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Return, Sale, Product, InventoryTransaction } from "@/models";
import { requirePermission } from "@/lib/session";
import { returnSchema, type ReturnInput } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { safeJSON, getEffectiveQuantity } from "@/lib/utils";

export async function createReturn(input: ReturnInput) {
  const user = await requirePermission(PERMISSIONS.PROCESS_RETURNS);
  const data = returnSchema.parse(input);

  await connectDB();
  const sale = await Sale.findById(data.sale);
  if (!sale) return { success: false, error: "Sale not found" };

  const returnNumber = `RET-${Date.now()}`;
  const totalAmount = data.items.reduce((s, i) => s + i.subtotal, 0);

  const returnDoc = await Return.create({
    returnNumber,
    sale: sale._id,
    saleNumber: sale.saleNumber,
    customer: sale.customer,
    customerName: sale.customerName,
    items: data.items,
    totalAmount,
    reason: data.reason,
    type: data.type,
    restoreInventory: data.restoreInventory,
    user: user.id,
    userName: user.name,
    notes: data.notes,
  });

  if (data.restoreInventory) {
    for (const item of data.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const previousQuantity = getEffectiveQuantity(product);
        if (product.orientation === "LEFT_RIGHT") {
          product.quantityLeft = (product.quantityLeft ?? 0) + item.quantity;
          product.quantity = (product.quantityLeft ?? 0) + (product.quantityRight ?? 0);
        } else {
          product.quantity += item.quantity;
        }
        await product.save();
        await InventoryTransaction.create({
          product: product._id,
          productName: product.name,
          type: "RETURN",
          previousQuantity,
          changeQuantity: item.quantity,
          newQuantity: getEffectiveQuantity(product),
          reason: data.reason,
          reference: returnNumber,
          referenceModel: "Return",
          user: user.id,
          userName: user.name,
        });
      }
    }
  }

  sale.refundedAmount += totalAmount;
  sale.status = data.type === "FULL" ? "REFUNDED" : "PARTIAL_REFUND";
  await sale.save();

  await createNotification({
    type: "RETURN_CREATED",
    title: "Return processed",
    message: `Return ${returnNumber} for sale ${sale.saleNumber}`,
    link: `/returns/${returnDoc._id}`,
  });

  await logActivity(user, {
    action: "CREATE_RETURN",
    module: "RETURNS",
    description: `Processed return ${returnNumber} (${totalAmount.toFixed(2)})`,
    metadata: { returnId: returnDoc._id.toString(), saleId: sale._id.toString() },
  });

  revalidatePath("/returns");
  revalidatePath("/sales");
  return { success: true, id: returnDoc._id.toString(), returnNumber };
}

export async function getReturns(opts?: { search?: string; page?: number; limit?: number }) {
  await requirePermission(PERMISSIONS.PROCESS_RETURNS);
  await connectDB();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (opts?.search) {
    filter.$or = [
      { returnNumber: { $regex: opts.search, $options: "i" } },
      { saleNumber: { $regex: opts.search, $options: "i" } },
      { customerName: { $regex: opts.search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    Return.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Return.countDocuments(filter),
  ]);
  return { items: safeJSON<unknown[]>(items), total, page, totalPages: Math.ceil(total / limit) };
}

export async function getReturn(id: string) {
  await requirePermission(PERMISSIONS.PROCESS_RETURNS);
  await connectDB();
  const ret = await Return.findById(id).lean();
  return ret ? safeJSON<unknown>(ret) : null;
}
