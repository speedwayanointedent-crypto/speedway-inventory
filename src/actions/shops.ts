"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Shop } from "@/models";
import { requirePermission } from "@/lib/session";
import { shopSchema, shopUpdateSchema, type ShopInput } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { safeJSON } from "@/lib/utils";

export async function getShops(opts?: { includeInactive?: boolean }) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const filter = opts?.includeInactive ? {} : { isActive: true };
  const items = await Shop.find(filter).sort({ isDefault: -1, name: 1 }).lean();
  return safeJSON<unknown[]>(items);
}

export async function getShop(id: string) {
  await requirePermission(PERMISSIONS.VIEW_INVENTORY);
  await connectDB();
  const shop = await Shop.findById(id).lean();
  if (!shop) return null;
  return safeJSON<unknown>(shop);
}

export async function createShop(input: ShopInput) {
  const user = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
  const data = shopSchema.parse(input);
  await connectDB();

  const existing = await Shop.findOne({ code: data.code });
  if (existing) return { success: false, error: `A shop with code "${data.code}" already exists` };

  if (data.isDefault) {
    await Shop.updateMany({}, { $set: { isDefault: false } });
  }
  const shop = await Shop.create(data);

  await logActivity(user, {
    action: "CREATE",
    module: "SHOP",
    description: `Created shop: ${shop.name}`,
    metadata: { shopId: shop._id.toString() },
  });

  revalidatePath("/admin/shops");
  return { success: true, id: shop._id.toString() };
}

export async function updateShop(id: string, input: Partial<ShopInput>) {
  const user = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
  const data = shopUpdateSchema.parse(input);
  await connectDB();

  if (data.code) {
    const existing = await Shop.findOne({ code: data.code, _id: { $ne: id } });
    if (existing) return { success: false, error: `A shop with code "${data.code}" already exists` };
  }

  if (data.isDefault) {
    await Shop.updateMany({ _id: { $ne: id } }, { $set: { isDefault: false } });
  }

  const updated = await Shop.findByIdAndUpdate(id, data, { new: true });
  if (!updated) return { success: false, error: "Shop not found" };

  await logActivity(user, {
    action: "UPDATE",
    module: "SHOP",
    description: `Updated shop: ${updated.name}`,
    metadata: { shopId: id },
  });

  revalidatePath("/admin/shops");
  return { success: true };
}

export async function deleteShop(id: string) {
  const user = await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
  await connectDB();

  const shop = await Shop.findById(id);
  if (!shop) return { success: false, error: "Shop not found" };
  if (shop.isDefault) {
    return { success: false, error: "Cannot delete the default shop. Reassign default first." };
  }

  await Shop.findByIdAndUpdate(id, { isActive: false });

  await logActivity(user, {
    action: "DELETE",
    module: "SHOP",
    description: `Deactivated shop: ${shop.name}`,
    metadata: { shopId: id },
  });

  revalidatePath("/admin/shops");
  return { success: true };
}
