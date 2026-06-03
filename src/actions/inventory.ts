"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Product, Category, InventoryTransaction } from "@/models";
import { requireAuth, requirePermission } from "@/lib/session";
import { productSchema, productUpdateSchema, categorySchema, type ProductInput, type CategoryInput } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { safeJSON } from "@/lib/utils";

export async function createProduct(input: ProductInput) {
  const user = await requirePermission(PERMISSIONS.CREATE_INVENTORY);
  const data = productSchema.parse(input);

  await connectDB();
  const product = await Product.create({ ...data, createdBy: user.id });

  if (data.quantity > 0) {
    await InventoryTransaction.create({
      product: product._id,
      productName: product.name,
      type: "STOCK_IN",
      previousQuantity: 0,
      changeQuantity: data.quantity,
      newQuantity: data.quantity,
      reason: "Initial stock",
      user: user.id,
      userName: user.name,
    });
  }

  await createNotification({
    type: "INVENTORY_ADDED",
    title: "New product added",
    message: `${product.name} added to inventory`,
    link: `/inventory/${product._id}`,
  });

  await logActivity(user, {
    action: "CREATE",
    module: "INVENTORY",
    description: `Created product: ${product.name}`,
    metadata: { productId: product._id.toString() },
  });

  revalidatePath("/inventory");
  return { success: true, id: product._id.toString() };
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const user = await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  await connectDB();

  const existing = await Product.findById(id);
  if (!existing) return { success: false, error: "Product not found" };

  const oldQty = existing.quantity;
  const data = productUpdateSchema.parse(input);
  const updated = await Product.findByIdAndUpdate(id, data, { new: true });

  if (data.quantity !== undefined && data.quantity !== oldQty) {
    await InventoryTransaction.create({
      product: id,
      productName: updated!.name,
      type: "ADJUSTMENT",
      previousQuantity: oldQty,
      changeQuantity: data.quantity - oldQty,
      newQuantity: data.quantity,
      reason: "Manual adjustment",
      user: user.id,
      userName: user.name,
    });
  }

  if (updated && updated.quantity <= updated.reorderLevel && updated.quantity > 0) {
    await createNotification({
      type: "LOW_STOCK",
      title: "Low stock alert",
      message: `${updated.name} is running low (${updated.quantity} left)`,
      link: `/inventory/${updated._id}`,
    });
  }

  await logActivity(user, {
    action: "UPDATE",
    module: "INVENTORY",
    description: `Updated product: ${updated?.name}`,
    metadata: { productId: id },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  return { success: true };
}

export async function deleteProduct(id: string) {
  const user = await requirePermission(PERMISSIONS.DELETE_INVENTORY);
  await connectDB();
  const product = await Product.findById(id);
  if (!product) return { success: false, error: "Not found" };

  await Product.findByIdAndUpdate(id, { status: "DISCONTINUED" });

  await logActivity(user, {
    action: "DELETE",
    module: "INVENTORY",
    description: `Discontinued product: ${product.name}`,
    metadata: { productId: id },
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function adjustStock(
  productId: string,
  newQuantity: number,
  reason: string,
  type: "ADJUSTMENT" | "DAMAGED" = "ADJUSTMENT"
) {
  const user = await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  await connectDB();
  const product = await Product.findById(productId);
  if (!product) return { success: false, error: "Not found" };

  const previousQuantity = product.quantity;
  product.quantity = newQuantity;
  await product.save();

  await InventoryTransaction.create({
    product: productId,
    productName: product.name,
    type,
    previousQuantity,
    changeQuantity: newQuantity - previousQuantity,
    newQuantity,
    reason,
    user: user.id,
    userName: user.name,
  });

  await logActivity(user, {
    action: "ADJUST_STOCK",
    module: "INVENTORY",
    description: `Adjusted stock for ${product.name}: ${previousQuantity} → ${newQuantity}`,
    metadata: { productId, type, reason },
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function createCategory(input: CategoryInput) {
  const user = await requirePermission(PERMISSIONS.CREATE_INVENTORY);
  const data = categorySchema.parse(input);
  await connectDB();
  const slug = data.name.toLowerCase().replace(/\s+/g, "-");
  const cat = await Category.create({ ...data, slug });
  revalidatePath("/inventory/categories");
  await logActivity(user, {
    action: "CREATE",
    module: "CATEGORY",
    description: `Created category: ${cat.name}`,
  });
  return { success: true, id: cat._id.toString() };
}

export async function getProducts(opts?: {
  search?: string;
  category?: string;
  status?: string;
  shop?: string;
  page?: number;
  limit?: number;
  sort?: string;
}) {
  await requireAuth();
  await connectDB();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  if (opts?.search) {
    filter.$or = [
      { name: { $regex: opts.search, $options: "i" } },
      { productCode: { $regex: opts.search, $options: "i" } },
      { storageLocation: { $regex: opts.search, $options: "i" } },
      { storageLocation: { $regex: opts.search, $options: "i" } },
    ];
  }
  if (opts?.category && opts.category !== "all") filter.category = opts.category;
  if (opts?.status && opts.status !== "all") filter.status = opts.status;
  if (opts?.shop && opts.shop !== "all") filter.shop = opts.shop;

  const sort: Record<string, 1 | -1> =
    opts?.sort === "name" ? { name: 1 } : opts?.sort === "stock" ? { quantity: 1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name")
      .populate("shop", "name code city")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { items: safeJSON<unknown[]>(items), total, page, totalPages: Math.ceil(total / limit) };
}

export async function getProduct(id: string) {
  await requireAuth();
  await connectDB();
  const product = await Product.findById(id)
    .populate("category", "name")
    .populate("supplier", "companyName")
    .populate("shop", "name code city address")
    .lean();
  if (!product) return null;
  return safeJSON<unknown>(product);
}

export async function getProductHistory(id: string, limit = 50) {
  await requireAuth();
  await connectDB();
  const history = await InventoryTransaction.find({ product: id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return safeJSON<unknown[]>(history);
}
