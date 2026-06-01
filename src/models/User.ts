import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { Role, Permission } from "@/lib/constants";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  permissions: Permission[];
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["ADMIN", "STAFF"], default: "STAFF", required: true },
    permissions: [{ type: String }],
    phone: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ resetToken: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
