import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { NotificationType } from "@/lib/constants";

export interface INotification extends Document {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  user?: mongoose.Types.ObjectId;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: [
        "LOW_STOCK",
        "OUT_OF_STOCK",
        "SALE_COMPLETED",
        "RETURN_CREATED",
        "INVENTORY_ADDED",
        "STOCK_RECEIVED",
        "REORDER_ALERT",
        "STILL_LOW_AFTER_INTAKE",
        "SYSTEM_ALERT",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
