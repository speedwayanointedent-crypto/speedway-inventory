import mongoose, { Schema, type Document, type Model } from "mongoose";

export type StockPaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "UNPAID";
export type StockPaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "MOBILE_MONEY"
  | "CHEQUE"
  | "CREDIT";
export type StockEntryStatus = "RECEIVED" | "PENDING" | "CANCELLED";

export type StockLineSide = "LEFT" | "RIGHT" | "SINGLE";

export interface IStockLineItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  productCode: string;

  /**
   * Used only for LEFT_RIGHT products. For SINGLE products it will be "SINGLE".
   */
  side: StockLineSide;

  /**
   * For SINGLE products this is the increment quantity.
   * For LEFT_RIGHT products it is the increment quantity for the chosen side.
   */
  quantity: number;

  /**
   * Kept for costing on intake.
   */
  unitCost: number;
  totalCost: number;

  /**
   * For SINGLE products it mirrors previousQuantity/newQuantity.
   * For LEFT_RIGHT products it can be derived from side-specific previous/new.
   */
  previousQuantity: number;
  newQuantity: number;

  previousLeftQuantity?: number;
  newLeftQuantity?: number;
  previousRightQuantity?: number;
  newRightQuantity?: number;
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

const StockLineItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productCode: { type: String, required: true },

    side: {
      type: String,
      enum: ["LEFT", "RIGHT", "SINGLE"],
      required: true,
      index: true,
    },

    quantity: { type: Number, required: true, min: 0 },

    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },

    previousQuantity: { type: Number, required: true, min: 0 },
    newQuantity: { type: Number, required: true, min: 0 },

    previousLeftQuantity: { type: Number, min: 0 },
    newLeftQuantity: { type: Number, min: 0 },
    previousRightQuantity: { type: Number, min: 0 },
    newRightQuantity: { type: Number, min: 0 },
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
    lineItems: {
      type: [StockLineItemSchema],
      required: true,
      validate: (v: IStockLineItem[]) => v.length > 0,
    },
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
  mongoose.models.StockEntry ||
  mongoose.model<IStockEntry>("StockEntry", StockEntrySchema);
