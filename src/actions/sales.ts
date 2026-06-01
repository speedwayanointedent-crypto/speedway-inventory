"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Sale, Product, Customer, InventoryTransaction } from "@/models";
import { requirePermission, requireAuth } from "@/lib/session";
import { saleSchema, type SaleInput } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { generateSaleNumber, safeJSON } from "@/lib/utils";

export async function createSale(input: SaleInput) {
  const user = await requirePermission(PERMISSIONS.CREATE_SALES);
  const data = saleSchema.parse(input);

  await connectDB();
  const session = await mongoose.startSession();
  let saleId = "";
  let publicId = "";
  let saleNumber = "";

  try {
    await session.withTransaction(async () => {
      saleNumber = generateSaleNumber();
      publicId = uuidv4();

      for (const item of data.items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) throw new Error(`Product not found: ${item.productName}`);
        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
        const previousQuantity = product.quantity;
        product.quantity -= item.quantity;
        product.totalSold += item.quantity;
        await product.save({ session });

        await InventoryTransaction.create(
          [
            {
              product: product._id,
              productName: product.name,
              type: "SALE",
              previousQuantity,
              changeQuantity: -item.quantity,
              newQuantity: product.quantity,
              reason: `Sale ${saleNumber}`,
              reference: saleNumber,
              referenceModel: "Sale",
              user: user.id,
              userName: user.name,
            },
          ],
          { session }
        );

        if (product.quantity <= product.reorderLevel) {
          await createNotification({
            type: product.quantity <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
            title: product.quantity <= 0 ? "Out of stock" : "Low stock",
            message: `${product.name} now has ${product.quantity} units`,
            link: `/inventory/${product._id}`,
          });
        }
      }

      const [sale] = await Sale.create(
        [
          {
            saleNumber,
            publicId,
            customer: data.customer || undefined,
            customerName: data.customerName,
            items: data.items,
            subtotal: data.subtotal,
            totalDiscount: data.totalDiscount,
            taxRate: data.taxRate,
            tax: data.tax,
            total: data.total,
            amountPaid: data.amountPaid,
            change: data.change,
            paymentMethod: data.paymentMethod,
            payments: data.payments,
            staff: user.id,
            staffName: user.name,
            status: "COMPLETED",
            notes: data.notes,
            isWholesale: data.isWholesale,
          },
        ],
        { session }
      );

      saleId = sale._id.toString();

      if (data.customer) {
        await Customer.findByIdAndUpdate(
          data.customer,
          {
            $inc: { totalSpending: data.total },
            $set: { lastPurchaseDate: new Date() },
          },
          { session }
        );
      }
    });
  } catch (error) {
    await session.endSession();
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sale failed",
    };
  }

  await session.endSession();

  await createNotification({
    type: "SALE_COMPLETED",
    title: "Sale completed",
    message: `Sale ${saleNumber} for ${data.customerName} — Total ${data.total.toFixed(2)}`,
    link: `/sales/${saleId}`,
  });

  await logActivity(user, {
    action: "CREATE_SALE",
    module: "SALES",
    description: `Created sale ${saleNumber} for ${data.customerName} (${data.total.toFixed(2)})`,
    metadata: { saleId, saleNumber, total: data.total },
  });

  revalidatePath("/sales");
  revalidatePath("/pos");
  revalidatePath("/dashboard");

  return { success: true, id: saleId, publicId, saleNumber };
}

export async function refundSale(saleId: string, reason: string) {
  const user = await requirePermission(PERMISSIONS.PROCESS_RETURNS);
  await connectDB();
  const sale = await Sale.findById(saleId);
  if (!sale) return { success: false, error: "Sale not found" };
  if (sale.status !== "COMPLETED") {
    return { success: false, error: "Only completed sales can be refunded" };
  }

  for (const item of sale.items) {
    const product = await Product.findById(item.product);
    if (product) {
      const previousQuantity = product.quantity;
      product.quantity += item.quantity;
      product.totalSold = Math.max(0, product.totalSold - item.quantity);
      await product.save();

      await InventoryTransaction.create({
        product: product._id,
        productName: product.name,
        type: "RETURN",
        previousQuantity,
        changeQuantity: item.quantity,
        newQuantity: product.quantity,
        reason: `Refund for sale ${sale.saleNumber}`,
        reference: sale.saleNumber,
        referenceModel: "Sale",
        user: user.id,
        userName: user.name,
      });
    }
  }

  sale.status = "REFUNDED";
  sale.refundedAmount = sale.total;
  sale.notes = (sale.notes ? sale.notes + "\n" : "") + `Refunded: ${reason}`;
  await sale.save();

  if (sale.customer) {
    await Customer.findByIdAndUpdate(sale.customer, {
      $inc: { totalSpending: -sale.total },
    });
  }

  await logActivity(user, {
    action: "REFUND",
    module: "SALES",
    description: `Refunded sale ${sale.saleNumber}`,
    metadata: { saleId, reason },
  });

  revalidatePath("/sales");
  return { success: true };
}

export async function cancelSale(saleId: string) {
  const user = await requirePermission(PERMISSIONS.PROCESS_RETURNS);
  await connectDB();
  const sale = await Sale.findById(saleId);
  if (!sale) return { success: false, error: "Not found" };

  for (const item of sale.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { quantity: item.quantity, totalSold: -item.quantity },
    });
  }

  sale.status = "CANCELLED";
  await sale.save();

  await logActivity(user, {
    action: "CANCEL",
    module: "SALES",
    description: `Cancelled sale ${sale.saleNumber}`,
  });

  revalidatePath("/sales");
  return { success: true };
}

export async function getSales(opts?: {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  await requireAuth();
  await connectDB();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  if (opts?.search) {
    filter.$or = [
      { saleNumber: { $regex: opts.search, $options: "i" } },
      { customerName: { $regex: opts.search, $options: "i" } },
    ];
  }
  if (opts?.status && opts.status !== "all") filter.status = opts.status;
  if (opts?.from || opts?.to) {
    filter.createdAt = {};
    if (opts.from) (filter.createdAt as Record<string, Date>).$gte = new Date(opts.from);
    if (opts.to) (filter.createdAt as Record<string, Date>).$lte = new Date(opts.to);
  }

  const [items, total] = await Promise.all([
    Sale.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Sale.countDocuments(filter),
  ]);

  return { items: safeJSON<unknown[]>(items), total, page, totalPages: Math.ceil(total / limit) };
}

export async function getSale(id: string) {
  await requireAuth();
  await connectDB();
  const sale = await Sale.findById(id).lean();
  return sale ? safeJSON<unknown>(sale) : null;
}

export async function getSaleByPublicId(publicId: string) {
  await connectDB();
  const sale = await Sale.findOne({ publicId }).lean();
  return sale ? safeJSON<unknown>(sale) : null;
}

export async function searchProductsForPOS(query: string) {
  await requirePermission(PERMISSIONS.CREATE_SALES);
  await connectDB();
  const filter: Record<string, unknown> = { status: "ACTIVE", quantity: { $gt: 0 } };
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { productCode: { $regex: query, $options: "i" } },
      { sku: { $regex: query, $options: "i" } },
      { barcode: query },
    ];
  }
  const items = await Product.find(filter).limit(20).lean();
  return safeJSON<unknown[]>(items);
}
