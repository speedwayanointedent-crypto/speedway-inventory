import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IShop extends Document {
  name: string;
  code: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  email?: string;
  manager?: string;
  isActive: boolean;
  isDefault: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    region: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    manager: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    isDefault: { type: Boolean, default: false, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

ShopSchema.index({ name: 1, isActive: 1 });

ShopSchema.pre("save", async function (next) {
  if (this.isModified("isDefault") && this.isDefault) {
    await mongoose
      .model<IShop>("Shop")
      .updateMany({ _id: { $ne: this._id } }, { $set: { isDefault: false } });
  }
  next();
});

export const Shop: Model<IShop> =
  mongoose.models.Shop || mongoose.model<IShop>("Shop", ShopSchema);
