import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IReturnItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IReturn extends Document {
  returnNumber: string;
  sale: mongoose.Types.ObjectId;
  saleNumber: string;
  items: IReturnItem[];
  totalAmount: number;
  reason: string;
  type: "FULL" | "PARTIAL";
  restoreInventory: boolean;
  user: mongoose.Types.ObjectId;
  userName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema<IReturnItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const ReturnSchema = new Schema<IReturn>(
  {
    returnNumber: { type: String, required: true, unique: true, index: true },
    sale: { type: Schema.Types.ObjectId, ref: "Sale", required: true, index: true },
    saleNumber: { type: String, required: true },
    items: [ReturnItemSchema],
    totalAmount: { type: Number, required: true },
    reason: { type: String, required: true },
    type: { type: String, enum: ["FULL", "PARTIAL"], default: "PARTIAL" },
    restoreInventory: { type: Boolean, default: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

ReturnSchema.index({ createdAt: -1 });

export const Return: Model<IReturn> =
  mongoose.models.Return || mongoose.model<IReturn>("Return", ReturnSchema);
