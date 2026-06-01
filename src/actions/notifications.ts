"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models";
import { requireAuth } from "@/lib/session";
import { safeJSON } from "@/lib/utils";

export async function getNotifications(limit = 30) {
  const user = await requireAuth();
  await connectDB();
  const items = await Notification.find({
    $or: [{ user: user.id }, { user: { $exists: false } }, { user: null }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const unreadCount = await Notification.countDocuments({
    isRead: false,
    $or: [{ user: user.id }, { user: { $exists: false } }, { user: null }],
  });
  return { items: safeJSON<unknown[]>(items), unreadCount };
}

export async function markNotificationRead(id: string) {
  await requireAuth();
  await connectDB();
  await Notification.findByIdAndUpdate(id, { isRead: true });
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const user = await requireAuth();
  await connectDB();
  await Notification.updateMany(
    { isRead: false, $or: [{ user: user.id }, { user: { $exists: false } }, { user: null }] },
    { isRead: true }
  );
  revalidatePath("/notifications");
  return { success: true };
}
