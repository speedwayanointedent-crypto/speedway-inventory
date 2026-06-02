"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Supplier } from "@/models";
import { requireAuth, requirePermission } from "@/lib/session";
import { supplierSchema, type SupplierInput } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { safeJSON } from "@/lib/utils";

export async function createSupplier(input: SupplierInput) {
  const user = await requirePermission(PERMISSIONS.MANAGE_SUPPLIERS);
  const data = supplierSchema.parse(input);
  await connectDB();
  const supplier = await Supplier.create(data);
  await logActivity(user, {
    action: "CREATE",
    module: "SUPPLIER",
    description: `Created supplier: ${supplier.companyName}`,
  });
  revalidatePath("/suppliers");
  return { success: true, id: supplier._id.toString() };
}

export async function updateSupplier(id: string, input: Partial<SupplierInput>) {
  const user = await requirePermission(PERMISSIONS.MANAGE_SUPPLIERS);
  const data = supplierSchema.partial().parse(input);
  await connectDB();
  await Supplier.findByIdAndUpdate(id, data);
  await logActivity(user, {
    action: "UPDATE",
    module: "SUPPLIER",
    description: `Updated supplier ${id}`,
  });
  revalidatePath("/suppliers");
  return { success: true };
}

export async function deleteSupplier(id: string) {
  const user = await requirePermission(PERMISSIONS.MANAGE_SUPPLIERS);
  await connectDB();
  await Supplier.findByIdAndUpdate(id, { isActive: false });
  await logActivity(user, {
    action: "DELETE",
    module: "SUPPLIER",
    description: `Deleted supplier ${id}`,
  });
  revalidatePath("/suppliers");
  return { success: true };
}

export async function getSuppliers(opts?: { search?: string; page?: number; limit?: number }) {
  await requirePermission(PERMISSIONS.MANAGE_SUPPLIERS);
  await connectDB();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = { isActive: true };
  if (opts?.search) {
    filter.$or = [
      { companyName: { $regex: opts.search, $options: "i" } },
      { contactPerson: { $regex: opts.search, $options: "i" } },
      { phone: { $regex: opts.search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Supplier.countDocuments(filter),
  ]);
  return { items: safeJSON<unknown[]>(items), total, page, totalPages: Math.ceil(total / limit) };
}

export async function getSuppliersForSelect() {
  await requireAuth();
  await connectDB();
  const items = await Supplier.find({ isActive: true })
    .select("companyName contactPerson phone totalDue")
    .sort({ companyName: 1 })
    .lean();
  return safeJSON<unknown[]>(items);
}

export async function getSupplier(id: string) {
  await requirePermission(PERMISSIONS.MANAGE_SUPPLIERS);
  await connectDB();
  const supplier = await Supplier.findById(id).lean();
  return supplier ? safeJSON<unknown>(supplier) : null;
}
