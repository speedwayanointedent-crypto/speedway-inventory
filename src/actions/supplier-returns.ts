"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import {
  Product,
  SupplierReturn,
  InventoryTransaction,
  Supplier,
  StockEntry,
} from "@/models";
import { requirePermission } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { PERMISSIONS } from "@/lib/constants";
import {
  supplierReturnSchema,
  supplierReturnUpdateSchema,
  type SupplierReturnInput,
  type SupplierReturnUpdateInput,
} from "@/lib/validations";
import { formatCurrency, generateSupplierReturnReferenceNumber, safeJSON } from "@/lib/utils";
import type { ISupplierReturnItem } from "@/models/SupplierReturn";

interface ReturnLineInput {
  product: string;
  quantity: number;
  unitCost: number;
  reason: string;
  restockable: boolean;
}

function computeTotals(items: ReturnLineInput[]) {
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  return { totalItems: items.length, totalQuantity, totalValue };
}

export async function createSupplierReturn(input: SupplierReturnInput) {
  const user = await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  const data = supplierReturnSchema.parse(input);

  await connectDB();
  const session = await mongoose.startSession();
  let returnId = "";
  let referenceNumber = "";

  try {
    await session.withTransaction(async () => {
      const productIds = data.items.map((i) => i.product);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      for (const item of data.items) {
        const product = productMap.get(item.product);
        if (!product) throw new Error(`Product not found: ${item.product}`);
        if (item.quantity > product.quantity) {
          throw new Error(
            `Cannot return ${item.quantity} of ${product.name}. Only ${product.quantity} in stock.`
          );
        }
      }

      let supplierName: string | undefined;
      if (data.supplier) {
        const supplierDoc = await Supplier.findById(data.supplier).session(session);
        if (supplierDoc) supplierName = supplierDoc.companyName;
      }

      let originalRef: string | undefined;
      if (data.originalStockEntry) {
        const original = await StockEntry.findById(data.originalStockEntry)
          .select("referenceNumber")
          .session(session);
        if (original) originalRef = original.referenceNumber;
      }

      const totals = computeTotals(data.items);
      referenceNumber = generateSupplierReturnReferenceNumber();

      const items: ISupplierReturnItem[] = [];
      for (const item of data.items) {
        const product = productMap.get(item.product)!;
        const previousQuantity = product.quantity;
        const newQuantity = Math.max(0, previousQuantity - item.quantity);

        if (item.restockable) {
          product.quantity = newQuantity;
          await product.save({ session });
        }

        items.push({
          product: product._id,
          productName: product.name,
          productCode: product.productCode,
          sku: product.sku,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
          reason: item.reason,
          restockable: item.restockable,
          previousQuantity,
          newQuantity: item.restockable ? newQuantity : previousQuantity,
        });

        if (item.restockable) {
          await InventoryTransaction.create(
            [
              {
                product: product._id,
                productName: product.name,
                type: "RETURN",
                previousQuantity,
                changeQuantity: -item.quantity,
                newQuantity,
                reason: `Supplier return ${referenceNumber} (${item.reason})`,
                reference: referenceNumber,
                referenceModel: "SupplierReturn",
                user: user.id,
                userName: user.name,
              },
            ],
            { session }
          );
        } else {
          await InventoryTransaction.create(
            [
              {
                product: product._id,
                productName: product.name,
                type: "DAMAGED",
                previousQuantity,
                changeQuantity: -item.quantity,
                newQuantity: previousQuantity,
                reason: `Damaged stock sent back via supplier return ${referenceNumber} (${item.reason})`,
                reference: referenceNumber,
                referenceModel: "SupplierReturn",
                user: user.id,
                userName: user.name,
              },
            ],
            { session }
          );
        }
      }

      const [created] = await SupplierReturn.create(
        [
          {
            referenceNumber,
            supplier: data.supplier || undefined,
            supplierName,
            originalStockEntry: data.originalStockEntry || undefined,
            originalStockEntryRef: originalRef,
            items,
            totalItems: totals.totalItems,
            totalQuantity: totals.totalQuantity,
            totalValue: totals.totalValue,
            status: data.status || "PENDING",
            primaryReason: data.primaryReason || "DEFECTIVE",
            resolution: data.resolution || "PENDING",
            expectedRefundAmount: data.expectedRefundAmount || 0,
            actualRefundAmount: 0,
            trackingNumber: data.trackingNumber,
            returnDate: data.returnDate ? new Date(data.returnDate as string) : new Date(),
            user: user.id,
            userName: user.name,
            notes: data.notes,
          },
        ],
        { session }
      );

      returnId = created._id.toString();
    });
  } catch (err) {
    await session.endSession();
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create supplier return",
    };
  }

  await session.endSession();

  await createNotification({
    type: "STOCK_RECEIVED",
    title: "Supplier return created",
    message: `Supplier return ${referenceNumber} recorded for ${formatCurrency(0)}`,
    link: `/supplier-returns/${returnId}`,
    metadata: { type: "supplier_return", referenceNumber },
  });

  await logActivity(user, {
    action: "CREATE",
    module: "INVENTORY",
    description: `Recorded supplier return ${referenceNumber}`,
    metadata: { returnId, referenceNumber },
  });

  revalidatePath("/supplier-returns");
  revalidatePath(`/supplier-returns/${returnId}`);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/reports/supplier-returns");
  revalidatePath("/reports/low-stock");
  return { success: true, id: returnId, referenceNumber };
}

export async function updateSupplierReturn(
  id: string,
  input: SupplierReturnUpdateInput,
  options?: { restockItems?: boolean }
) {
  const user = await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  const data = supplierReturnUpdateSchema.parse(input);

  await connectDB();
  const session = await mongoose.startSession();
  let referenceNumber = "";

  try {
    await session.withTransaction(async () => {
      const ret = await SupplierReturn.findById(id).session(session);
      if (!ret) throw new Error("Supplier return not found");
      if (ret.status === "CANCELLED") {
        throw new Error("Cancelled returns cannot be edited");
      }
      if (ret.status === "COMPLETED" && !options?.restockItems) {
        throw new Error("Completed returns cannot be edited");
      }
      referenceNumber = ret.referenceNumber;

      if (data.items && options?.restockItems) {
        const itemMap = new Map(
          data.items.map((i) => [
            i.product,
            {
              quantity: i.quantity,
              unitCost: i.unitCost,
              reason: i.reason,
              restockable: i.restockable,
            },
          ])
        );
        const productIds = Array.from(itemMap.keys());
        const products = await Product.find({ _id: { $in: productIds } }).session(session);
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        for (const [pid, update] of itemMap) {
          const product = productMap.get(pid);
          if (!product) throw new Error(`Product not found: ${pid}`);
          const original = ret.items.find((li) => li.product.toString() === pid);
          if (!original) continue;
          const diff = update.quantity - original.quantity;
          if (diff === 0) continue;

          const previousQuantity = product.quantity;
          const newQuantity = Math.max(0, previousQuantity - diff);
          if (newQuantity !== previousQuantity) {
            product.quantity = newQuantity;
            await product.save({ session });
            await InventoryTransaction.create(
              [
                {
                  product: product._id,
                  productName: product.name,
                  type: update.restockable ? "RETURN" : "DAMAGED",
                  previousQuantity,
                  changeQuantity: -diff,
                  newQuantity,
                  reason: `Supplier return edit (${ret.referenceNumber})`,
                  reference: ret.referenceNumber,
                  referenceModel: "SupplierReturn",
                  user: user.id,
                  userName: user.name,
                },
              ],
              { session }
            );
          }
          original.quantity = update.quantity;
          original.unitCost = update.unitCost;
          original.reason = update.reason;
          original.restockable = update.restockable;
          original.totalCost = update.quantity * update.unitCost;
          original.newQuantity = newQuantity;
        }

        const totals = computeTotals(
          ret.items.map((li) => ({
            product: li.product.toString(),
            quantity: li.quantity,
            unitCost: li.unitCost,
            reason: li.reason,
            restockable: li.restockable,
          }))
        );
        ret.totalItems = totals.totalItems;
        ret.totalQuantity = totals.totalQuantity;
        ret.totalValue = totals.totalValue;
      }

      if (data.supplier !== undefined) {
        if (data.supplier) {
          const sup = await Supplier.findById(data.supplier).session(session);
          if (sup) {
            ret.supplier = sup._id;
            ret.supplierName = sup.companyName;
          }
        } else {
          ret.supplier = undefined;
          ret.supplierName = undefined;
        }
      }

      if (data.primaryReason) ret.primaryReason = data.primaryReason;
      if (data.resolution) ret.resolution = data.resolution;
      if (data.expectedRefundAmount !== undefined)
        ret.expectedRefundAmount = data.expectedRefundAmount;
      if (data.actualRefundAmount !== undefined)
        ret.actualRefundAmount = data.actualRefundAmount;
      if (data.trackingNumber !== undefined) ret.trackingNumber = data.trackingNumber;
      if (data.notes !== undefined) ret.notes = data.notes;
      if (data.returnDate) ret.returnDate = new Date(data.returnDate as string);
      if (data.shippedDate) ret.shippedDate = new Date(data.shippedDate as string);
      if (data.completedDate) ret.completedDate = new Date(data.completedDate as string);
      if (data.status) {
        ret.status = data.status;
        if (data.status === "COMPLETED" && !ret.completedDate) {
          ret.completedDate = new Date();
        }
      }

      await ret.save({ session });
    });
  } catch (err) {
    await session.endSession();
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update supplier return",
    };
  }

  await session.endSession();

  await logActivity(user, {
    action: "UPDATE",
    module: "INVENTORY",
    description: `Updated supplier return ${referenceNumber}`,
    metadata: { returnId: id, referenceNumber },
  });

  revalidatePath("/supplier-returns");
  revalidatePath(`/supplier-returns/${id}`);
  revalidatePath("/reports/supplier-returns");
  revalidatePath("/reports/low-stock");
  return { success: true };
}

export async function approveSupplierReturn(id: string) {
  const user = await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  await connectDB();
  const ret = await SupplierReturn.findById(id);
  if (!ret) return { success: false, error: "Return not found" };
  if (ret.status !== "PENDING") {
    return { success: false, error: `Cannot approve a return in ${ret.status} status` };
  }
  ret.status = "APPROVED";
  ret.approvedBy = new mongoose.Types.ObjectId(user.id);
  ret.approvedByName = user.name;
  ret.approvedAt = new Date();
  await ret.save();

  await logActivity(user, {
    action: "APPROVE",
    module: "INVENTORY",
    description: `Approved supplier return ${ret.referenceNumber}`,
    metadata: { returnId: id, referenceNumber: ret.referenceNumber },
  });

  revalidatePath("/supplier-returns");
  revalidatePath(`/supplier-returns/${id}`);
  return { success: true };
}

export async function completeSupplierReturn(
  id: string,
  actualRefundAmount: number,
  resolution: "REFUND" | "REPLACEMENT" | "CREDIT_NOTE"
) {
  const user = await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  if (actualRefundAmount < 0) {
    return { success: false, error: "Refund amount cannot be negative" };
  }

  await connectDB();
  const ret = await SupplierReturn.findById(id);
  if (!ret) return { success: false, error: "Return not found" };
  if (ret.status === "CANCELLED") {
    return { success: false, error: "Cancelled return cannot be completed" };
  }
  if (ret.status === "COMPLETED") {
    return { success: false, error: "Return is already completed" };
  }

  ret.status = "COMPLETED";
  ret.completedDate = new Date();
  ret.actualRefundAmount = actualRefundAmount;
  ret.resolution = resolution;
  await ret.save();

  if (ret.supplier && (resolution === "REFUND" || resolution === "CREDIT_NOTE") && actualRefundAmount > 0) {
    const sup = await Supplier.findById(ret.supplier);
    if (sup) {
      sup.totalDue = Math.max(0, sup.totalDue - actualRefundAmount);
      await sup.save();
      revalidatePath("/suppliers");
    }
  }

  await logActivity(user, {
    action: "COMPLETE",
    module: "INVENTORY",
    description: `Completed supplier return ${ret.referenceNumber} via ${resolution}`,
    metadata: { returnId: id, resolution, actualRefundAmount },
  });

  revalidatePath("/supplier-returns");
  revalidatePath(`/supplier-returns/${id}`);
  revalidatePath("/reports/supplier-returns");
  return { success: true };
}

export async function cancelSupplierReturn(id: string, reason: string) {
  const user = await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  await connectDB();
  const session = await mongoose.startSession();
  let referenceNumber = "";

  try {
    await session.withTransaction(async () => {
      const ret = await SupplierReturn.findById(id).session(session);
      if (!ret) throw new Error("Supplier return not found");
      if (ret.status === "CANCELLED") {
        throw new Error("Return is already cancelled");
      }
      if (ret.status === "COMPLETED") {
        throw new Error("Completed returns cannot be cancelled");
      }
      referenceNumber = ret.referenceNumber;

      for (const li of ret.items) {
        if (!li.restockable) continue;
        const product = await Product.findById(li.product).session(session);
        if (!product) continue;
        const previousQuantity = product.quantity;
        product.quantity = previousQuantity + li.quantity;
        await product.save({ session });
        await InventoryTransaction.create(
          [
            {
              product: product._id,
              productName: product.name,
              type: "STOCK_IN",
              previousQuantity,
              changeQuantity: li.quantity,
              newQuantity: product.quantity,
              reason: `Supplier return ${ret.referenceNumber} cancelled: ${reason}`,
              reference: ret.referenceNumber,
              referenceModel: "SupplierReturn",
              user: user.id,
              userName: user.name,
            },
          ],
          { session }
        );
      }

      ret.status = "CANCELLED";
      ret.cancelledDate = new Date();
      ret.cancelledReason = reason;
      await ret.save({ session });
    });
  } catch (err) {
    await session.endSession();
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel supplier return",
    };
  }

  await session.endSession();

  await logActivity(user, {
    action: "CANCEL",
    module: "INVENTORY",
    description: `Cancelled supplier return ${referenceNumber}: ${reason}`,
    metadata: { returnId: id, referenceNumber, reason },
  });

  revalidatePath("/supplier-returns");
  revalidatePath(`/supplier-returns/${id}`);
  revalidatePath("/inventory");
  revalidatePath("/reports/supplier-returns");
  revalidatePath("/reports/low-stock");
  return { success: true };
}

export async function getSupplierReturns(opts?: {
  search?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  supplier?: string;
  status?: string;
  reason?: string;
}) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  if (opts?.search) {
    filter.$or = [
      { referenceNumber: { $regex: opts.search, $options: "i" } },
      { supplierName: { $regex: opts.search, $options: "i" } },
      { trackingNumber: { $regex: opts.search, $options: "i" } },
      { "items.productName": { $regex: opts.search, $options: "i" } },
      { notes: { $regex: opts.search, $options: "i" } },
    ];
  }
  if (opts?.from || opts?.to) {
    filter.returnDate = {};
    if (opts.from) (filter.returnDate as Record<string, Date>).$gte = new Date(opts.from);
    if (opts.to) {
      const t = new Date(opts.to);
      t.setHours(23, 59, 59, 999);
      (filter.returnDate as Record<string, Date>).$lte = t;
    }
  }
  if (opts?.supplier && opts.supplier !== "all") filter.supplier = opts.supplier;
  if (opts?.status && opts.status !== "all") filter.status = opts.status;
  if (opts?.reason && opts.reason !== "all") filter.primaryReason = opts.reason;

  const [items, total] = await Promise.all([
    SupplierReturn.find(filter)
      .sort({ returnDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SupplierReturn.countDocuments(filter),
  ]);

  return {
    items: safeJSON<unknown[]>(items),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSupplierReturn(id: string) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const ret = await SupplierReturn.findById(id).lean();
  return ret ? safeJSON<unknown>(ret) : null;
}

export async function getSupplierReturnSummary() {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [pending, inProgress, completedThisMonth, valueThisMonth, valueAllTime] =
    await Promise.all([
      SupplierReturn.countDocuments({ status: "PENDING" }),
      SupplierReturn.countDocuments({ status: { $in: ["APPROVED", "IN_TRANSIT"] } }),
      SupplierReturn.countDocuments({
        status: "COMPLETED",
        completedDate: { $gte: startOfMonth, $lte: now },
      }),
      SupplierReturn.aggregate([
        {
          $match: {
            status: { $ne: "CANCELLED" },
            returnDate: { $gte: startOfMonth, $lte: now },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalValue" } } },
      ]),
      SupplierReturn.aggregate([
        { $match: { status: { $ne: "CANCELLED" } } },
        { $group: { _id: null, total: { $sum: "$totalValue" } } },
      ]),
    ]);

  return {
    pending,
    inProgress,
    completedThisMonth,
    valueThisMonth: valueThisMonth[0]?.total || 0,
    valueAllTime: valueAllTime[0]?.total || 0,
  };
}

export async function getRecentSupplierReturns(limit = 5) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const items = await SupplierReturn.find({ status: { $ne: "CANCELLED" } })
    .sort({ returnDate: -1, createdAt: -1 })
    .limit(limit)
    .select("referenceNumber supplierName status totalValue totalQuantity returnDate primaryReason")
    .lean();
  return safeJSON<unknown[]>(items);
}

export async function getSupplierReturnReport(opts: {
  from: string;
  to: string;
  supplierId?: string;
  status?: string;
}) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const from = new Date(opts.from);
  from.setHours(0, 0, 0, 0);
  const to = new Date(opts.to);
  to.setHours(23, 59, 59, 999);

  const match: Record<string, unknown> = {
    returnDate: { $gte: from, $lte: to },
  };
  if (opts.supplierId && opts.supplierId !== "all") match.supplier = opts.supplierId;
  if (opts.status && opts.status !== "all") match.status = opts.status;

  const allReturns = await SupplierReturn.find(match).sort({ returnDate: 1 }).lean();

  const supplierMap = new Map<
    string,
    {
      supplierId: string;
      supplierName: string;
      returns: number;
      quantity: number;
      value: number;
      refunded: number;
    }
  >();
  const reasonMap = new Map<string, { reason: string; returns: number; quantity: number; value: number }>();
  const dailyMap = new Map<
    string,
    { date: string; returns: number; quantity: number; value: number }
  >();
  const statusMap: Record<string, number> = {
    PENDING: 0,
    APPROVED: 0,
    IN_TRANSIT: 0,
    COMPLETED: 0,
    REJECTED: 0,
    CANCELLED: 0,
  };
  const resolutionMap: Record<string, number> = {
    REFUND: 0,
    REPLACEMENT: 0,
    CREDIT_NOTE: 0,
    PENDING: 0,
  };

  for (const r of allReturns) {
    if (r.supplier) {
      const key = r.supplier.toString();
      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          supplierId: key,
          supplierName: r.supplierName || "Unspecified",
          returns: 0,
          quantity: 0,
          value: 0,
          refunded: 0,
        });
      }
      const s = supplierMap.get(key)!;
      s.returns += 1;
      s.quantity += r.totalQuantity;
      s.value += r.totalValue;
      s.refunded += r.actualRefundAmount || 0;
    }

    const reasonKey = r.primaryReason;
    if (!reasonMap.has(reasonKey)) {
      reasonMap.set(reasonKey, { reason: reasonKey, returns: 0, quantity: 0, value: 0 });
    }
    const rEntry = reasonMap.get(reasonKey)!;
    rEntry.returns += 1;
    rEntry.quantity += r.totalQuantity;
    rEntry.value += r.totalValue;

    const dateKey = new Date(r.returnDate).toISOString().slice(0, 10);
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { date: dateKey, returns: 0, quantity: 0, value: 0 });
    }
    const d = dailyMap.get(dateKey)!;
    d.returns += 1;
    d.quantity += r.totalQuantity;
    d.value += r.totalValue;

    statusMap[r.status] = (statusMap[r.status] || 0) + 1;
    resolutionMap[r.resolution] = (resolutionMap[r.resolution] || 0) + 1;
  }

  const summary = {
    returns: allReturns.length,
    quantity: allReturns.reduce((s, r) => s + r.totalQuantity, 0),
    value: allReturns.reduce((s, r) => s + r.totalValue, 0),
    refunded: allReturns.reduce((s, r) => s + (r.actualRefundAmount || 0), 0),
    pendingValue: allReturns
      .filter((r) => ["PENDING", "APPROVED", "IN_TRANSIT"].includes(r.status))
      .reduce((s, r) => s + r.totalValue, 0),
  };

  return {
    from: opts.from,
    to: opts.to,
    summary,
    daily: Array.from(dailyMap.values()),
    suppliers: Array.from(supplierMap.values()).sort((a, b) => b.value - a.value),
    reasons: Array.from(reasonMap.values()).sort((a, b) => b.value - a.value),
    statusBreakdown: statusMap,
    resolutionBreakdown: resolutionMap,
    entries: safeJSON<unknown[]>(allReturns),
  };
}

export async function getReturnableStockEntries() {
  await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  await connectDB();
  const since = new Date();
  since.setDate(since.getDate() - 180);
  const entries = await StockEntry.find({
    status: { $ne: "CANCELLED" },
    entryDate: { $gte: since },
  })
    .sort({ entryDate: -1 })
    .limit(100)
    .select("referenceNumber supplier supplierName totalCost totalQuantity entryDate")
    .lean();
  return safeJSON<unknown[]>(entries);
}
