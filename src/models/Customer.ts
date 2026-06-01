import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  companyName?: string;
  notes?: string;
  totalSpending: number;
  outstandingBalance: number;
  lastPurchaseDate?: Date;
  isWholesale: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    companyName: { type: String, trim: true },
    notes: { type: String },
    totalSpending: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    lastPurchaseDate: { type: Date },
    isWholesale: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: "text", phone: "text", companyName: "text" });

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
