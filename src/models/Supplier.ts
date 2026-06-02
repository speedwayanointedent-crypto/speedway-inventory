import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISupplier extends Document {
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
  lastPurchaseDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    companyName: { type: String, required: true, trim: true, index: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    notes: { type: String },
    totalPurchases: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalDue: { type: Number, default: 0 },
    lastPurchaseDate: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SupplierSchema.index({ companyName: "text", contactPerson: "text" });
SupplierSchema.index({ totalDue: -1 });

export const Supplier: Model<ISupplier> =
  mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);
