"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Customer, Sale } from "@/models";
import { requirePermission } from "@/lib/session";
import { customerSchema, customerUpdateSchema, type CustomerInput } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { safeJSON } from "@/lib/utils";

export async function createCustomer(input: CustomerInput) {
  const user = await requirePermission(PERMISSIONS.MANAGE_CUSTOMERS);
  const data = customerSchema.parse(input);
  await connectDB();
  const customer = await Customer.create(data);
  await logActivity(user, {
    action: "CREATE",
    module: "CUSTOMER",
    description: `Created customer: ${customer.name}`,
  });
  revalidatePath("/customers");
  return { success: true, id: customer._id.toString() };
}

export async function updateCustomer(id: string, input: Partial<CustomerInput>) {
  const user = await requirePermission(PERMISSIONS.MANAGE_CUSTOMERS);
  const data = customerUpdateSchema.parse(input);
  await connectDB();
  await Customer.findByIdAndUpdate(id, data);
  await logActivity(user, {
    action: "UPDATE",
    module: "CUSTOMER",
    description: `Updated customer ${id}`,
  });
  revalidatePath("/customers");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const user = await requirePermission(PERMISSIONS.MANAGE_CUSTOMERS);
  await connectDB();
  await Customer.findByIdAndUpdate(id, { isActive: false });
  await logActivity(user, {
    action: "DELETE",
    module: "CUSTOMER",
    description: `Deleted customer ${id}`,
  });
  revalidatePath("/customers");
  return { success: true };
}

export async function getCustomers(opts?: {
  search?: string;
  wholesale?: boolean;
  page?: number;
  limit?: number;
}) {
  await requirePermission(PERMISSIONS.MANAGE_CUSTOMERS);
  await connectDB();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = { isActive: true };
  if (opts?.wholesale) filter.isWholesale = true;
  if (opts?.search) {
    filter.$or = [
      { name: { $regex: opts.search, $options: "i" } },
      { phone: { $regex: opts.search, $options: "i" } },
      { email: { $regex: opts.search, $options: "i" } },
      { companyName: { $regex: opts.search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Customer.countDocuments(filter),
  ]);
  return { items: safeJSON<unknown[]>(items), total, page, totalPages: Math.ceil(total / limit) };
}

export async function getCustomer(id: string) {
  await requirePermission(PERMISSIONS.MANAGE_CUSTOMERS);
  await connectDB();
  const customer = await Customer.findById(id).lean();
  if (!customer) return null;
  const sales = await Sale.find({ customer: id }).sort({ createdAt: -1 }).limit(20).lean();
  return { customer: safeJSON<unknown>(customer), sales: safeJSON<unknown[]>(sales) };
}

export async function searchCustomersForPOS(query: string) {
  await requirePermission(PERMISSIONS.CREATE_SALES);
  await connectDB();
  if (!query || query.length < 1) {
    const recent = await Customer.find({ isActive: true })
      .sort({ lastPurchaseDate: -1, createdAt: -1 })
      .limit(10)
      .lean();
    return safeJSON<unknown[]>(recent);
  }
  const items = await Customer.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
      { companyName: { $regex: query, $options: "i" } },
    ],
  })
    .limit(10)
    .lean();
  return safeJSON<unknown[]>(items);
}
