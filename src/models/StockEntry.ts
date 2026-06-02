import mongoose, { Schema, type Document, type Model } from "mongoose";

export type StockPaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "UNPAID";
export type StockPaymentMethod = "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CHEQUE" | "CREDIT";
export type StockEntryStatus = "RECEIVED" | "PENDING" | "CANCELLED";

export interface IStockLineItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  productCode: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  previousQuantity: number;
  newQuantity: number;
  previousCostPrice?: number;
  newCostPrice?: number;
}

export interface IStockEntry extends Document {
  referenceNumber: string;
  supplier?: mongoose.Types.ObjectId;
  supplierName?: string;
  shop?: mongoose.Types.ObjectId;
  shopName?: string;
  lineItems: IStockLineItem[];
  totalItems: number;
  totalQuantity: number;
  totalCost: number;
  status: StockEntryStatus;
  paymentStatus: StockPaymentStatus;
  paymentMethod?: StockPaymentMethod;
  amountPaid: number;
  amountDue: number;
  dueDate?: Date;
  invoiceNumber?: string;
  notes?: string;
  attachments: string[];
  entryDate: Date;
  receivedDate?: Date;
  user: mongoose.Types.ObjectId;
  userName: string;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledByName?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockLineItemSchema = new Schema<IStockLineItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productCode: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    previousQuantity: { type: Number, required: true, min: 0 },
    newQuantity: { type: Number, required: true, min: 0 },
    previousCostPrice: { type: Number },
    newCostPrice: { type: Number },
  },
  { _id: false }
);

const StockEntrySchema = new Schema<IStockEntry>(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true, trim: true },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", index: true },
    supplierName: { type: String, trim: true, index: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", index: true },
    shopName: { type: String, trim: true },
    lineItems: { type: [StockLineItemSchema], required: true, validate: (v: IStockLineItem[]) => v.length > 0 },
    totalItems: { type: Number, required: true, min: 1, default: 1 },
    totalQuantity: { type: Number, required: true, min: 1, default: 0 },
    totalCost: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["RECEIVED", "PENDING", "CANCELLED"],
      default: "RECEIVED",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PAID", "PARTIAL", "PENDING", "UNPAID"],
      default: "UNPAID",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHEQUE", "CREDIT"],
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    amountDue: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date },
    invoiceNumber: { type: String, trim: true },
    notes: { type: String },
    attachments: { type: [String], default: [] },
    entryDate: { type: Date, default: Date.now, index: true },
    receivedDate: { type: Date },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelledByName: { type: String },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

StockEntrySchema.index({ entryDate: -1 });
StockEntrySchema.index({ supplier: 1, entryDate: -1 });
StockEntrySchema.index({ status: 1, entryDate: -1 });
StockEntrySchema.index({ paymentStatus: 1, entryDate: -1 });
StockEntrySchema.index({ "lineItems.product": 1 });
StockEntrySchema.index({ referenceNumber: "text", invoiceNumber: "text", notes: "text" });

export const StockEntry: Model<IStockEntry> =
  mongoose.models.StockEntry || mongoose.model<IStockEntry>("StockEntry", StockEntrySchema);
