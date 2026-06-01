import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { TransactionType } from "@/lib/constants";

export interface IInventoryTransaction extends Document {
  product: mongoose.Types.ObjectId;
  productName: string;
  type: TransactionType;
  previousQuantity: number;
  changeQuantity: number;
  newQuantity: number;
  reason?: string;
  reference?: string;
  referenceModel?: string;
  user: mongoose.Types.ObjectId;
  userName: string;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, required: true },
    type: {
      type: String,
      enum: ["STOCK_IN", "STOCK_OUT", "SALE", "ADJUSTMENT", "DAMAGED", "RETURN"],
      required: true,
      index: true,
    },
    previousQuantity: { type: Number, required: true },
    changeQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    reason: { type: String },
    reference: { type: String },
    referenceModel: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

InventoryTransactionSchema.index({ createdAt: -1 });
InventoryTransactionSchema.index({ product: 1, createdAt: -1 });

export const InventoryTransaction: Model<IInventoryTransaction> =
  mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransaction>("InventoryTransaction", InventoryTransactionSchema);
