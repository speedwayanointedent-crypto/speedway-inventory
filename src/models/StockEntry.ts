import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IStockEntry extends Document {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantityAdded: number;
  purchaseCost: number;
  totalCost: number;
  supplier?: mongoose.Types.ObjectId;
  supplierName?: string;
  invoiceNumber?: string;
  notes?: string;
  entryDate: Date;
  user: mongoose.Types.ObjectId;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockEntrySchema = new Schema<IStockEntry>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, required: true },
    quantityAdded: { type: Number, required: true, min: 1 },
    purchaseCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String },
    invoiceNumber: { type: String, trim: true },
    notes: { type: String },
    entryDate: { type: Date, default: Date.now, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
  },
  { timestamps: true }
);

StockEntrySchema.index({ entryDate: -1 });

export const StockEntry: Model<IStockEntry> =
  mongoose.models.StockEntry || mongoose.model<IStockEntry>("StockEntry", StockEntrySchema);
