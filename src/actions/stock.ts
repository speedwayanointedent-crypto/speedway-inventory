"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Product, StockEntry, InventoryTransaction, Supplier, Shop } from "@/models";
import { requirePermission } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { PERMISSIONS } from "@/lib/constants";
import {
  stockEntrySchema,
  stockEntryUpdateSchema,
  type StockEntryInput,
  type StockEntryUpdateInput,
} from "@/lib/validations";
import {
  formatCurrency,
  generateStockReferenceNumber,
  safeJSON,
  getEffectiveQuantity,
  addStockLine,
  subtractStockLine,
} from "@/lib/utils";
import type { IStockLineItem } from "@/models/StockEntry";
import type { ISupplier } from "@/models/Supplier";

function computeTotals(items: Array<{ quantity: number; unitCost: number }>) {
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalCost = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  return { totalItems: items.length, totalQuantity, totalCost };
}

function computePaymentStatus(
  totalCost: number,
  amountPaid: number,
  requested?: "PAID" | "PARTIAL" | "PENDING" | "UNPAID"
) {
  if (requested) return requested;
  if (amountPaid <= 0) return "UNPAID" as const;
  if (amountPaid >= totalCost) return "PAID" as const;
  return "PARTIAL" as const;
}

export async function createStockEntry(input: StockEntryInput) {
  const user = await requirePermission(PERMISSIONS.CREATE_INVENTORY);
  const data = stockEntrySchema.parse(input);

  await connectDB();
  const session = await mongoose.startSession();
  let entryId = "";
  let referenceNumber = "";

  try {
    await session.withTransaction(async () => {
      const productIds = data.lineItems.map((i) => i.product);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      for (const item of data.lineItems) {
        const product = productMap.get(item.product);
        if (!product) throw new Error(`Product not found: ${item.product}`);
      }

      const totals = computeTotals(data.lineItems);
      const amountDue = Math.max(0, totals.totalCost - (data.amountPaid || 0));
      const paymentStatus = computePaymentStatus(
        totals.totalCost,
        data.amountPaid || 0,
        data.paymentStatus
      );

      let supplierName: string | undefined;
      let supplierDoc: (mongoose.Document & ISupplier) | null = null;
      if (data.supplier) {
        supplierDoc = await Supplier.findById(data.supplier).session(session);
        if (supplierDoc) supplierName = supplierDoc.companyName;
      }

      let shopName: string | undefined;
      if (data.shop) {
        const shopDoc = await Shop.findById(data.shop).session(session);
        if (shopDoc) shopName = shopDoc.name;
      }

      referenceNumber = generateStockReferenceNumber();

      const lineItems: IStockLineItem[] = [];
      for (const item of data.lineItems) {
        const product = productMap.get(item.product)!;
        const previousQuantity = getEffectiveQuantity(product);
        const update = addStockLine(product, item.side, item.quantity);
        product.quantity = update.quantity;
        if (update.quantityLeft !== undefined) product.quantityLeft = update.quantityLeft;
        if (update.quantityRight !== undefined) product.quantityRight = update.quantityRight;
        await product.save({ session });

        lineItems.push({
          product: product._id,
          productName: product.name,
          productCode: product.productCode,
          side: item.side,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
          previousQuantity,
          newQuantity: getEffectiveQuantity(product),
        });

        await InventoryTransaction.create(
          [
            {
              product: product._id,
              productName: product.name,
              type: "STOCK_IN",
              previousQuantity,
              changeQuantity: item.quantity,
              newQuantity: getEffectiveQuantity(product),
              reason: `Stock intake ${referenceNumber}${data.invoiceNumber ? ` (Invoice: ${data.invoiceNumber})` : ""}`,
              reference: referenceNumber,
              referenceModel: "StockEntry",
              user: user.id,
              userName: user.name,
            },
          ],
          { session }
        );
      }

      const [entry] = await StockEntry.create(
        [
          {
            referenceNumber,
            supplier: data.supplier || undefined,
            supplierName,
            shop: data.shop || undefined,
            shopName,
            lineItems,
            totalItems: totals.totalItems,
            totalQuantity: totals.totalQuantity,
            totalCost: totals.totalCost,
            status: data.status || "RECEIVED",
            paymentStatus,
            paymentMethod: data.paymentMethod,
            amountPaid: data.amountPaid || 0,
            amountDue,
            dueDate: data.dueDate ? new Date(data.dueDate as string) : undefined,
            invoiceNumber: data.invoiceNumber,
            notes: data.notes,
            entryDate: data.entryDate ? new Date(data.entryDate as string) : new Date(),
            receivedDate:
              data.status === "RECEIVED"
                ? data.receivedDate
                  ? new Date(data.receivedDate as string)
                  : new Date()
                : undefined,
            user: user.id,
            userName: user.name,
          },
        ],
        { session }
      );

      entryId = entry._id.toString();

      if (supplierDoc) {
        supplierDoc.totalPurchases += totals.totalCost;
        supplierDoc.totalPaid += data.amountPaid || 0;
        supplierDoc.totalDue = Math.max(0, supplierDoc.totalDue + amountDue);
        supplierDoc.lastPurchaseDate = new Date();
        await supplierDoc.save({ session });
      }
    });
  } catch (err) {
    await session.endSession();
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record stock entry",
    };
  }

  await session.endSession();

  await createNotification({
    type: "STOCK_RECEIVED",
    title: "Stock received",
    message: `New stock intake ${referenceNumber} recorded`,
    link: `/stock-entries/${entryId}`,
  });

  try {
    const stillLow = await Product.find({
      _id: { $in: data.lineItems.map((i) => i.product) },
      $expr: {
        $lte: [
          {
            $cond: [
              { $eq: ["$orientation", "LEFT_RIGHT"] },
              { $add: [{ $ifNull: ["$quantityLeft", 0] }, { $ifNull: ["$quantityRight", 0] }] },
              "$quantity",
            ],
          },
          "$reorderLevel",
        ],
      },
    })
    .select("name productCode price orientation quantity quantityLeft quantityRight reorderLevel")
      .lean();
    for (const p of stillLow) {
      await createNotification({
        type: getEffectiveQuantity(p) <= 0 ? "OUT_OF_STOCK" : "STILL_LOW_AFTER_INTAKE",
        title:
          getEffectiveQuantity(p) <= 0
            ? `${p.name} still out of stock after intake`
            : `${p.name} still below reorder level`,
        message:
          getEffectiveQuantity(p) <= 0
            ? `Intake recorded but stock is still 0. Reorder from supplier.`
            : `After intake, only ${getEffectiveQuantity(p)} units remain (reorder level ${p.reorderLevel}).`,
        link: `/inventory/${p._id}`,
        metadata: {
          productId: p._id.toString(),
          quantity: getEffectiveQuantity(p),
          reorderLevel: p.reorderLevel,
          referenceNumber,
        },
      });
    }
  } catch (err) {
    console.error("still-low check failed", err);
  }

  await logActivity(user, {
    action: "STOCK_IN",
    module: "INVENTORY",
    description: `Recorded stock intake ${referenceNumber}`,
    metadata: { entryId, referenceNumber, totalCost: undefined },
  });

  revalidatePath("/inventory");
  revalidatePath("/stock-entries");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/reports/stock-entries");
  revalidatePath("/reports/supplier-purchases");

  return { success: true, id: entryId, referenceNumber };
}

export async function updateStockEntry(id: string, input: StockEntryUpdateInput) {
  const user = await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  const data = stockEntryUpdateSchema.parse(input);

  await connectDB();
  const session = await mongoose.startSession();
  let referenceNumber = "";

  try {
    await session.withTransaction(async () => {
      const entry = await StockEntry.findById(id).session(session);
      if (!entry) throw new Error("Stock entry not found");
      if (entry.status === "CANCELLED") {
        throw new Error("Cancelled entries cannot be edited");
      }
      referenceNumber = entry.referenceNumber;

      if (data.lineItems) {
        const productIds = data.lineItems.map((i) => i.product);
        const products = await Product.find({ _id: { $in: productIds } }).session(session);
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        const oldByProduct = new Map<string, IStockLineItem>();
        for (const li of entry.lineItems) {
          oldByProduct.set(li.product.toString(), li);
        }
        const newByProduct = new Map<string, (typeof data.lineItems)[number]>();
        for (const li of data.lineItems) {
          newByProduct.set(li.product, li);
        }

        const allProductIds = new Set<string>([...oldByProduct.keys(), ...newByProduct.keys()]);
        for (const pid of allProductIds) {
          const oldLi = oldByProduct.get(pid);
          const newLi = newByProduct.get(pid);
          const product = productMap.get(pid);
          if (!product && newLi) throw new Error(`Product not found: ${pid}`);

          if (product && oldLi && !newLi) {
            const previousQuantity = getEffectiveQuantity(product);
            const update = subtractStockLine(product, oldLi.side ?? "SINGLE", oldLi.quantity);
            product.quantity = update.quantity;
            if (update.quantityLeft !== undefined) product.quantityLeft = update.quantityLeft;
            if (update.quantityRight !== undefined) product.quantityRight = update.quantityRight;
            await product.save({ session });
            await InventoryTransaction.create(
              [
                {
                  product: product._id,
                  productName: product.name,
                  type: "ADJUSTMENT",
                  previousQuantity,
                  changeQuantity: -oldLi.quantity,
                  newQuantity: product.quantity,
                  reason: `Stock entry edit reversal (${entry.referenceNumber})`,
                  reference: entry.referenceNumber,
                  referenceModel: "StockEntry",
                  user: user.id,
                  userName: user.name,
                },
              ],
              { session }
            );
          } else if (product && !oldLi && newLi) {
            const previousQuantity = getEffectiveQuantity(product);
            const update = addStockLine(product, newLi.side ?? "SINGLE", newLi.quantity);
            product.quantity = update.quantity;
            if (update.quantityLeft !== undefined) product.quantityLeft = update.quantityLeft;
            if (update.quantityRight !== undefined) product.quantityRight = update.quantityRight;
            await product.save({ session });
            await InventoryTransaction.create(
              [
                {
                  product: product._id,
                  productName: product.name,
                  type: "STOCK_IN",
                  previousQuantity,
                  changeQuantity: newLi.quantity,
                  newQuantity: product.quantity,
                  reason: `Stock entry edit addition (${entry.referenceNumber})`,
                  reference: entry.referenceNumber,
                  referenceModel: "StockEntry",
                  user: user.id,
                  userName: user.name,
                },
              ],
              { session }
            );
          } else if (product && oldLi && newLi) {
            const diff = newLi.quantity - oldLi.quantity;
            if (diff !== 0) {
              const previousQuantity = getEffectiveQuantity(product);
              const update = diff > 0
                ? addStockLine(product, newLi.side ?? "SINGLE", diff)
                : subtractStockLine(product, oldLi.side ?? "SINGLE", -diff);
              product.quantity = update.quantity;
              if (update.quantityLeft !== undefined) product.quantityLeft = update.quantityLeft;
              if (update.quantityRight !== undefined) product.quantityRight = update.quantityRight;
              await product.save({ session });
              await InventoryTransaction.create(
                [
                  {
                    product: product._id,
                    productName: product.name,
                    type: "STOCK_IN",
                    previousQuantity,
                    changeQuantity: diff,
                    newQuantity: product.quantity,
                    reason: `Stock entry edit (${entry.referenceNumber})`,
                    reference: entry.referenceNumber,
                    referenceModel: "StockEntry",
                    user: user.id,
                    userName: user.name,
                  },
                ],
                { session }
              );
            }
          }
        }

        entry.lineItems = data.lineItems.map((li) => {
          const product = productMap.get(li.product);
          const previousQuantity = product ? product.quantity - li.quantity : 0;
          return {
            product: new mongoose.Types.ObjectId(li.product),
            productName: product?.name || "",
            productCode: product?.productCode || "",
            side: li.side,
            quantity: li.quantity,
            unitCost: li.unitCost,
            totalCost: li.quantity * li.unitCost,
            previousQuantity,
            newQuantity: previousQuantity + li.quantity,
          };
        });
      }

      if (data.supplier !== undefined) {
        if (entry.supplier && entry.supplier.toString() !== data.supplier) {
          const oldSup = await Supplier.findById(entry.supplier).session(session);
          if (oldSup) {
            oldSup.totalPurchases = Math.max(0, oldSup.totalPurchases - entry.totalCost);
            oldSup.totalDue = Math.max(0, oldSup.totalDue - entry.amountDue);
            await oldSup.save({ session });
          }
        }
        if (data.supplier) {
          const newSup = await Supplier.findById(data.supplier).session(session);
          if (newSup) {
            entry.supplierName = newSup.companyName;
            entry.supplier = newSup._id;
          }
        } else {
          entry.supplier = undefined;
          entry.supplierName = undefined;
        }
      }

      if (data.shop !== undefined) {
        if (data.shop) {
          const shopDoc = await Shop.findById(data.shop).session(session);
          if (shopDoc) {
            entry.shop = shopDoc._id;
            entry.shopName = shopDoc.name;
          }
        } else {
          entry.shop = undefined;
          entry.shopName = undefined;
        }
      }

      if (data.invoiceNumber !== undefined) entry.invoiceNumber = data.invoiceNumber;
      if (data.notes !== undefined) entry.notes = data.notes;
      if (data.entryDate) entry.entryDate = new Date(data.entryDate as string);
      if (data.status) entry.status = data.status;
      if (data.dueDate) entry.dueDate = new Date(data.dueDate as string);
      if (data.paymentMethod !== undefined) entry.paymentMethod = data.paymentMethod;

      const totals = computeTotals(
        entry.lineItems.map((li) => ({ quantity: li.quantity, unitCost: li.unitCost }))
      );
      entry.totalItems = totals.totalItems;
      entry.totalQuantity = totals.totalQuantity;
      entry.totalCost = totals.totalCost;

      if (data.amountPaid !== undefined) {
        if (entry.supplier && data.supplier === undefined) {
          const sup = await Supplier.findById(entry.supplier).session(session);
          if (sup) {
            const supplierDelta = (data.amountPaid || 0) - entry.amountPaid;
            sup.totalPaid = Math.max(0, sup.totalPaid + supplierDelta);
          }
        }
        entry.amountPaid = data.amountPaid;
      }

      entry.amountDue = Math.max(0, entry.totalCost - entry.amountPaid);
      if (data.paymentStatus) {
        entry.paymentStatus = data.paymentStatus;
      } else {
        entry.paymentStatus = computePaymentStatus(entry.totalCost, entry.amountPaid);
      }

      await entry.save({ session });

      if (entry.supplier) {
        const sup = await Supplier.findById(entry.supplier).session(session);
        if (sup) {
          const entries = await StockEntry.find({
            supplier: sup._id,
            status: { $ne: "CANCELLED" },
          }).session(session);
          sup.totalPurchases = entries.reduce((s, e) => s + e.totalCost, 0);
          sup.totalPaid = entries.reduce((s, e) => s + e.amountPaid, 0);
          sup.totalDue = Math.max(0, sup.totalPurchases - sup.totalPaid);
          await sup.save({ session });
        }
      }
    });
  } catch (err) {
    await session.endSession();
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update stock entry",
    };
  }

  await session.endSession();

  await logActivity(user, {
    action: "UPDATE",
    module: "INVENTORY",
    description: `Updated stock entry ${referenceNumber}`,
    metadata: { entryId: id, referenceNumber },
  });

  revalidatePath("/stock-entries");
  revalidatePath(`/stock-entries/${id}`);
  revalidatePath("/inventory");
  revalidatePath("/reports/stock-entries");
  revalidatePath("/reports/supplier-purchases");
  return { success: true };
}

export async function cancelStockEntry(id: string, reason: string) {
  const user = await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  await connectDB();
  const session = await mongoose.startSession();
  let referenceNumber = "";

  try {
    await session.withTransaction(async () => {
      const entry = await StockEntry.findById(id).session(session);
      if (!entry) throw new Error("Stock entry not found");
      if (entry.status === "CANCELLED") {
        throw new Error("Entry is already cancelled");
      }
      referenceNumber = entry.referenceNumber;

      for (const li of entry.lineItems) {
        const product = await Product.findById(li.product).session(session);
        if (product) {
          const previousQuantity = getEffectiveQuantity(product);
          const update = subtractStockLine(product, li.side ?? "SINGLE", li.quantity);
          product.quantity = update.quantity;
          if (update.quantityLeft !== undefined) product.quantityLeft = update.quantityLeft;
          if (update.quantityRight !== undefined) product.quantityRight = update.quantityRight;
          await product.save({ session });
          await InventoryTransaction.create(
            [
              {
                product: product._id,
                productName: product.name,
                type: "ADJUSTMENT",
                previousQuantity,
                changeQuantity: -li.quantity,
                newQuantity: product.quantity,
                reason: `Stock intake ${entry.referenceNumber} cancelled: ${reason}`,
                reference: entry.referenceNumber,
                referenceModel: "StockEntry",
                user: user.id,
                userName: user.name,
              },
            ],
            { session }
          );
        }
      }

      entry.status = "CANCELLED";
      entry.cancelledAt = new Date();
      entry.cancelledBy = new mongoose.Types.ObjectId(user.id);
      entry.cancelledByName = user.name;
      entry.cancelReason = reason;
      await entry.save({ session });

      if (entry.supplier) {
        const sup = await Supplier.findById(entry.supplier).session(session);
        if (sup) {
          sup.totalPurchases = Math.max(0, sup.totalPurchases - entry.totalCost);
          sup.totalDue = Math.max(0, sup.totalDue - entry.amountDue);
          sup.totalPaid = Math.max(0, sup.totalPaid - entry.amountPaid);
          await sup.save({ session });
        }
      }
    });
  } catch (err) {
    await session.endSession();
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel stock entry",
    };
  }

  await session.endSession();

  await logActivity(user, {
    action: "CANCEL",
    module: "INVENTORY",
    description: `Cancelled stock entry ${referenceNumber}: ${reason}`,
    metadata: { entryId: id, referenceNumber, reason },
  });

  revalidatePath("/stock-entries");
  revalidatePath(`/stock-entries/${id}`);
  revalidatePath("/inventory");
  return { success: true };
}

export async function recordSupplierPayment(
  entryId: string,
  amount: number,
  method: "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CHEQUE"
) {
  const user = await requirePermission(PERMISSIONS.MANAGE_SUPPLIERS);
  if (amount <= 0) return { success: false, error: "Amount must be positive" };

  await connectDB();
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const entry = await StockEntry.findById(entryId).session(session);
      if (!entry) throw new Error("Stock entry not found");
      if (entry.status === "CANCELLED") throw new Error("Cannot pay a cancelled entry");
      const remaining = entry.totalCost - entry.amountPaid;
      if (amount > remaining + 0.01) {
        throw new Error(`Payment exceeds outstanding balance of ${formatCurrency(remaining)}`);
      }

      entry.amountPaid += amount;
      entry.amountDue = Math.max(0, entry.totalCost - entry.amountPaid);
      entry.paymentMethod = method;
      entry.paymentStatus =
        entry.amountDue <= 0.01 ? "PAID" : entry.amountPaid > 0 ? "PARTIAL" : "UNPAID";
      await entry.save({ session });

      if (entry.supplier) {
        const sup = await Supplier.findById(entry.supplier).session(session);
        if (sup) {
          sup.totalPaid += amount;
          sup.totalDue = Math.max(0, sup.totalDue - amount);
          await sup.save({ session });
        }
      }
    });
  } catch (err) {
    await session.endSession();
    return {
      success: false,
      error: err instanceof Error ? err.message : "Payment failed",
    };
  }

  await session.endSession();

  await logActivity(user, {
    action: "PAYMENT",
    module: "INVENTORY",
    description: `Recorded supplier payment of ${formatCurrency(amount)}`,
    metadata: { entryId, amount, method },
  });

  revalidatePath("/stock-entries");
  revalidatePath(`/stock-entries/${entryId}`);
  revalidatePath("/reports/supplier-purchases");
  return { success: true };
}

export async function getStockEntries(opts?: {
  search?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  supplier?: string;
  status?: string;
  paymentStatus?: string;
  shop?: string;
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
      { invoiceNumber: { $regex: opts.search, $options: "i" } },
      { supplierName: { $regex: opts.search, $options: "i" } },
      { "lineItems.productName": { $regex: opts.search, $options: "i" } },
      { notes: { $regex: opts.search, $options: "i" } },
    ];
  }
  if (opts?.from || opts?.to) {
    filter.entryDate = {};
    if (opts.from) (filter.entryDate as Record<string, Date>).$gte = new Date(opts.from);
    if (opts.to) {
      const to = new Date(opts.to);
      to.setHours(23, 59, 59, 999);
      (filter.entryDate as Record<string, Date>).$lte = to;
    }
  }
  if (opts?.supplier && opts.supplier !== "all") filter.supplier = opts.supplier;
  if (opts?.status && opts.status !== "all") filter.status = opts.status;
  if (opts?.paymentStatus && opts.paymentStatus !== "all")
    filter.paymentStatus = opts.paymentStatus;
  if (opts?.shop && opts.shop !== "all") filter.shop = opts.shop;

  const [items, total] = await Promise.all([
    StockEntry.find(filter).sort({ entryDate: -1 }).skip(skip).limit(limit).lean(),
    StockEntry.countDocuments(filter),
  ]);

  return {
    items: safeJSON<unknown[]>(items),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getStockEntry(id: string) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const entry = await StockEntry.findById(id).lean();
  return entry ? safeJSON<unknown>(entry) : null;
}

export async function getStockIntakeReport(opts: { from: string; to: string }) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const from = new Date(opts.from);
  from.setHours(0, 0, 0, 0);
  const to = new Date(opts.to);
  to.setHours(23, 59, 59, 999);

  const baseFilter = {
    entryDate: { $gte: from, $lte: to },
    status: { $ne: "CANCELLED" },
  };

  const entries = await StockEntry.find(baseFilter).sort({ entryDate: 1 }).lean();

  const dailyMap = new Map<
    string,
    { date: string; entries: number; quantity: number; cost: number; suppliers: Set<string> }
  >();
  const supplierMap = new Map<
    string,
    { supplierId?: string; supplierName: string; entries: number; quantity: number; cost: number }
  >();
  const productMap = new Map<
    string,
    { productId: string; productName: string; productCode: string; quantity: number; cost: number; entries: number }
  >();
  const paymentMap = { PAID: 0, PARTIAL: 0, PENDING: 0, UNPAID: 0 } as Record<string, number>;

  for (const e of entries) {
    const dateKey = new Date(e.entryDate).toISOString().slice(0, 10);
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { date: dateKey, entries: 0, quantity: 0, cost: 0, suppliers: new Set() });
    }
    const d = dailyMap.get(dateKey)!;
    d.entries += 1;
    d.quantity += e.totalQuantity;
    d.cost += e.totalCost;
    if (e.supplierName) d.suppliers.add(e.supplierName);

    const supplierKey = e.supplierName || "Unspecified";
    if (!supplierMap.has(supplierKey)) {
      supplierMap.set(supplierKey, {
        supplierId: e.supplier?.toString(),
        supplierName: supplierKey,
        entries: 0,
        quantity: 0,
        cost: 0,
      });
    }
    const s = supplierMap.get(supplierKey)!;
    s.entries += 1;
    s.quantity += e.totalQuantity;
    s.cost += e.totalCost;

    for (const li of e.lineItems) {
      const pid = li.product.toString();
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          productId: pid,
          productName: li.productName,
          productCode: li.productCode,
          quantity: 0,
          cost: 0,
          entries: 0,
        });
      }
      const p = productMap.get(pid)!;
      p.quantity += li.quantity;
      p.cost += li.totalCost;
      p.entries += 1;
    }

    paymentMap[e.paymentStatus] = (paymentMap[e.paymentStatus] || 0) + 1;
  }

  const summary = {
    entries: entries.length,
    quantity: entries.reduce((s, e) => s + e.totalQuantity, 0),
    cost: entries.reduce((s, e) => s + e.totalCost, 0),
    paid: entries.reduce((s, e) => s + e.amountPaid, 0),
    due: entries.reduce((s, e) => s + e.amountDue, 0),
    cancelled: 0,
  };

  return {
    from: opts.from,
    to: opts.to,
    summary,
    daily: Array.from(dailyMap.values()).map((d) => ({
      ...d,
      suppliers: d.suppliers.size,
    })),
    suppliers: Array.from(supplierMap.values()).sort((a, b) => b.cost - a.cost),
    products: Array.from(productMap.values()).sort((a, b) => b.cost - a.cost),
    paymentBreakdown: paymentMap,
  };
}

export async function getStockIntakeSummary() {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const aggregate = async (from: Date) => {
    const res = await StockEntry.aggregate([
      { $match: { entryDate: { $gte: from, $lte: now }, status: { $ne: "CANCELLED" } } },
      {
        $group: {
          _id: null,
          entries: { $sum: 1 },
          quantity: { $sum: "$totalQuantity" },
          cost: { $sum: "$totalCost" },
        },
      },
    ]);
    return res[0] || { entries: 0, quantity: 0, cost: 0 };
  };

  const [today, week, month] = await Promise.all([
    aggregate(startOfDay),
    aggregate(startOfWeek),
    aggregate(startOfMonth),
  ]);

  const [pending, outstandingAgg] = await Promise.all([
    StockEntry.countDocuments({ status: "PENDING" }),
    StockEntry.aggregate([
      {
        $match: {
          status: { $ne: "CANCELLED" },
          paymentStatus: { $in: ["PENDING", "PARTIAL", "UNPAID"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountDue" } } },
    ]),
  ]);

  return {
    today,
    week,
    month,
    pending,
    outstanding: outstandingAgg[0]?.total || 0,
  };
}

export async function getRecentStockEntries(limit = 5) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const items = await StockEntry.find({ status: { $ne: "CANCELLED" } })
    .sort({ entryDate: -1 })
    .limit(limit)
    .select("referenceNumber supplierName totalQuantity totalCost status entryDate createdAt")
    .lean();
  return safeJSON<unknown[]>(items);
}

export async function getSupplierPurchaseReport(opts: { from: string; to: string; supplierId?: string }) {
  await requirePermission(PERMISSIONS.MANAGE_SUPPLIERS);
  await connectDB();
  const from = new Date(opts.from);
  from.setHours(0, 0, 0, 0);
  const to = new Date(opts.to);
  to.setHours(23, 59, 59, 999);

  const match: Record<string, unknown> = {
    entryDate: { $gte: from, $lte: to },
  };
  if (opts.supplierId && opts.supplierId !== "all") match.supplier = opts.supplierId;

  const allEntries = await StockEntry.find(match).sort({ entryDate: -1 }).lean();

  const supplierMap = new Map<
    string,
    {
      supplierId: string;
      supplierName: string;
      phone?: string;
      entries: number;
      products: number;
      quantity: number;
      cost: number;
      paid: number;
      due: number;
    }
  >();

  for (const e of allEntries) {
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

  const supplierIds = Array.from(supplierMap.keys());
  if (supplierIds.length > 0) {
    const suppliers = await Supplier.find({ _id: { $in: supplierIds } })
      .select("phone contactPerson totalDue")
      .lean();
    for (const s of suppliers) {
      const entry = supplierMap.get(s._id.toString());
      if (entry) {
        entry.phone = s.phone;
      }
    }
  }

  const summary = {
    suppliers: supplierMap.size,
    entries: allEntries.length,
    cost: allEntries.reduce((s, e) => s + e.totalCost, 0),
    paid: allEntries.reduce((s, e) => s + e.amountPaid, 0),
    due: allEntries.reduce((s, e) => s + e.amountDue, 0),
  };

  return {
    from: opts.from,
    to: opts.to,
    summary,
    rows: Array.from(supplierMap.values()).sort((a, b) => b.cost - a.cost),
    entries: safeJSON<unknown[]>(allEntries),
  };
}

export async function getStockEntryProducts() {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const products = await Product.find({ status: "ACTIVE" })
    .select("name productCode quantity quantityLeft quantityRight reorderLevel orientation")
    .sort({ name: 1 })
    .lean();
  return safeJSON<unknown[]>(products);
}

export async function getLowStockReport(opts?: {
  category?: string;
  shop?: string;
  search?: string;
}) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();

  const filter: Record<string, unknown> = { status: "ACTIVE" };
  if (opts?.category && opts.category !== "all") filter.category = opts.category;
  if (opts?.shop && opts.shop !== "all") filter.shop = opts.shop;
  if (opts?.search) {
    filter.$or = [
      { name: { $regex: opts.search, $options: "i" } },
      { productCode: { $regex: opts.search, $options: "i" } },
      { brand: { $regex: opts.search, $options: "i" } },
    ];
  }

  const products = await Product.find(filter)
    .populate("category", "name")
    .populate("supplier", "companyName phone")
    .sort({ quantity: 1 })
    .lean();

  const lowStock = products.filter((p) => {
    const q = getEffectiveQuantity(p);
    return q > 0 && q <= p.reorderLevel;
  });
  const outOfStock = products.filter((p) => getEffectiveQuantity(p) <= 0);
  const inStock = products.filter((p) => getEffectiveQuantity(p) > p.reorderLevel);

  const estimatedReorderCost = 0;
  const outOfStockReorderCost = 0;

  return {
    items: safeJSON<unknown[]>([...outOfStock, ...lowStock]),
    allProducts: safeJSON<unknown[]>(products),
    summary: {
      total: products.length,
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      inStock: inStock.length,
      estimatedReorderCost,
      outOfStockReorderCost,
    },
  };
}

export async function getLowStockNotifications() {
  const user = await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();

  const lowStockProducts = await Product.find({
    status: "ACTIVE",
    $expr: {
      $lte: [
        {
          $cond: [
            { $eq: ["$orientation", "LEFT_RIGHT"] },
            { $add: [{ $ifNull: ["$quantityLeft", 0] }, { $ifNull: ["$quantityRight", 0] }] },
            "$quantity",
          ],
        },
        "$reorderLevel",
      ],
    },
  })
    .select("_id name productCode quantity reorderLevel supplier")
    .populate("supplier", "companyName")
    .sort({ quantity: 1 })
    .limit(10)
    .lean();

  if (lowStockProducts.length === 0) return;

  for (const p of lowStockProducts) {
    const isOut = p.quantity <= 0;
    await createNotification({
      type: isOut ? "OUT_OF_STOCK" : "LOW_STOCK",
      title: isOut ? `${p.name} is out of stock` : `${p.name} is below reorder level`,
      message: isOut
        ? `Reorder immediately — current stock 0, reorder level ${p.reorderLevel}`
        : `Only ${p.quantity} left (reorder level ${p.reorderLevel})`,
      link: `/inventory/${p._id}`,
      metadata: { productId: p._id.toString(), quantity: p.quantity, reorderLevel: p.reorderLevel },
    });
  }

  await logActivity(user, {
    action: "REORDER_ALERT_SCAN",
    module: "INVENTORY",
    description: `Generated reorder alerts for ${lowStockProducts.length} products`,
    metadata: { count: lowStockProducts.length },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/reports/low-stock");
}

export interface BulkImportRow {
  productCode?: string;
  quantity?: number;
  unitCost?: number;
}

export interface BulkImportResult {
  success: boolean;
  referenceNumber?: string;
  entryId?: string;
  inserted?: number;
  failed?: number;
  errors?: { row: number; reason: string }[];
  error?: string;
}

export async function bulkCreateStockEntry(input: {
  supplier?: string;
  shop?: string;
  invoiceNumber?: string;
  notes?: string;
  entryDate?: string;
  paymentStatus?: "PAID" | "PARTIAL" | "PENDING" | "UNPAID";
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CHEQUE" | "CREDIT";
  amountPaid?: number;
  dueDate?: string;
  rows: BulkImportRow[];
}): Promise<BulkImportResult> {
  const user = await requirePermission(PERMISSIONS.CREATE_INVENTORY);
  await connectDB();

  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    return { success: false, error: "No rows provided" };
  }

  const session = await mongoose.startSession();
  let entryId = "";
  let referenceNumber = "";

  try {
    await session.withTransaction(async () => {
      const codes = input.rows
        .map((r) => (r.productCode || "").trim())
        .filter(Boolean);

      if (codes.length === 0) {
        throw new Error("No product codes provided");
      }

      const products = await Product.find({
        productCode: { $in: codes },
      }).session(session);
      const productByCode = new Map(products.map((p) => [p.productCode, p]));

      const lineItems: IStockLineItem[] = [];
      for (let i = 0; i < input.rows.length; i++) {
        const r = input.rows[i];
        const code = (r.productCode || "").trim();
        const qty = Number(r.quantity);
        const cost = Number(r.unitCost);

        if (!code) {
          throw new Error(`Row ${i + 1}: missing product code`);
        }
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error(`Row ${i + 1}: invalid quantity`);
        }
        if (!Number.isFinite(cost) || cost < 0) {
          throw new Error(`Row ${i + 1}: invalid unit cost`);
        }

        const product = productByCode.get(code);
        if (!product) {
          throw new Error(
            `Row ${i + 1}: product not found (${code})`
          );
        }

        const previousQuantity = getEffectiveQuantity(product);
        const update = addStockLine(product, "SINGLE", qty);
        product.quantity = update.quantity;
        if (update.quantityLeft !== undefined) product.quantityLeft = update.quantityLeft;
        if (update.quantityRight !== undefined) product.quantityRight = update.quantityRight;
        await product.save({ session });

        lineItems.push({
          product: product._id,
          productName: product.name,
          productCode: product.productCode,
          side: "SINGLE",
          quantity: qty,
          unitCost: cost,
          totalCost: qty * cost,
          previousQuantity,
          newQuantity: getEffectiveQuantity(product),
        });

        await InventoryTransaction.create(
          [
            {
              product: product._id,
              productName: product.name,
              type: "STOCK_IN",
              previousQuantity,
              changeQuantity: qty,
              newQuantity: getEffectiveQuantity(product),
              reason: `Bulk stock intake${input.invoiceNumber ? ` (Invoice: ${input.invoiceNumber})` : ""}`,
              reference: undefined,
              referenceModel: "StockEntry",
              user: user.id,
              userName: user.name,
            },
          ],
          { session }
        );
      }

      const totals = computeTotals(
        lineItems.map((li) => ({ quantity: li.quantity, unitCost: li.unitCost }))
      );
      const amountDue = Math.max(0, totals.totalCost - (input.amountPaid || 0));
      const paymentStatus = ((): "PAID" | "PARTIAL" | "PENDING" | "UNPAID" => {
        if (input.paymentStatus) return input.paymentStatus;
        if ((input.amountPaid || 0) <= 0) return "UNPAID";
        if ((input.amountPaid || 0) >= totals.totalCost) return "PAID";
        return "PARTIAL";
      })();

      let supplierName: string | undefined;
      if (input.supplier) {
        const sup = await Supplier.findById(input.supplier).session(session);
        if (sup) supplierName = sup.companyName;
      }

      let shopName: string | undefined;
      if (input.shop) {
        const shopDoc = await Shop.findById(input.shop).session(session);
        if (shopDoc) shopName = shopDoc.name;
      }

      referenceNumber = generateStockReferenceNumber();
      const [entry] = await StockEntry.create(
        [
          {
            referenceNumber,
            supplier: input.supplier || undefined,
            supplierName,
            shop: input.shop || undefined,
            shopName,
            lineItems,
            totalItems: totals.totalItems,
            totalQuantity: totals.totalQuantity,
            totalCost: totals.totalCost,
            status: "RECEIVED",
            paymentStatus,
            paymentMethod: input.paymentMethod,
            amountPaid: input.amountPaid || 0,
            amountDue,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            invoiceNumber: input.invoiceNumber,
            notes: input.notes,
            entryDate: input.entryDate ? new Date(input.entryDate) : new Date(),
            receivedDate: new Date(),
            user: user.id,
            userName: user.name,
          },
        ],
        { session }
      );

      entryId = entry._id.toString();

      if (supplierName && input.supplier) {
        const sup = await Supplier.findById(input.supplier).session(session);
        if (sup) {
          sup.totalPurchases += totals.totalCost;
          sup.totalPaid += input.amountPaid || 0;
          sup.totalDue = Math.max(0, sup.totalDue + amountDue);
          sup.lastPurchaseDate = new Date();
          await sup.save({ session });
        }
      }
    });
  } catch (err) {
    await session.endSession();
    return {
      success: false,
      error: err instanceof Error ? err.message : "Bulk import failed",
    };
  }

  await session.endSession();

  await createNotification({
    type: "STOCK_RECEIVED",
    title: "Bulk stock intake",
    message: `New bulk stock intake ${referenceNumber} recorded`,
    link: `/stock-entries/${entryId}`,
    metadata: { type: "bulk_intake", referenceNumber },
  });

  await logActivity(user, {
    action: "STOCK_IN",
    module: "INVENTORY",
    description: `Bulk imported stock intake ${referenceNumber}`,
    metadata: { entryId, referenceNumber },
  });

  revalidatePath("/inventory");
  revalidatePath("/stock-entries");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/reports/stock-entries");
  revalidatePath("/reports/supplier-purchases");
  revalidatePath("/reports/low-stock");

  return {
    success: true,
    referenceNumber,
    entryId,
    inserted: input.rows.length,
    failed: 0,
  };
}
