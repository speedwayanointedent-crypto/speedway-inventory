import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IActivityLog extends Document {
  user?: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  action: string;
  module: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  device?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ip: { type: String },
    device: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ user: 1, createdAt: -1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
