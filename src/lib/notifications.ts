import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import type { NotificationType } from "@/lib/constants";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(payload: NotificationPayload) {
  try {
    await connectDB();
    await Notification.create({
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
      user: payload.userId,
      metadata: payload.metadata,
    });
  } catch (err) {
    console.error("Notification error:", err);
  }
}
