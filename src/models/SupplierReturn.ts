import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface ISupplierReturnItem {
  product: Types.ObjectId;
  productName: string;
  productCode: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reason: string;
  restockable: boolean;
  previousQuantity: number;
  newQuantity: number;
}

export interface ISupplierReturn extends Document {
  referenceNumber: string;
  supplier?: Types.ObjectId;
  supplierName?: string;
  originalStockEntry?: Types.ObjectId;
  originalStockEntryRef?: string;
  items: ISupplierReturnItem[];
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  status:
    | "PENDING"
    | "APPROVED"
    | "IN_TRANSIT"
    | "COMPLETED"
    | "REJECTED"
    | "CANCELLED";
  primaryReason: string;
  resolution: "REFUND" | "REPLACEMENT" | "CREDIT_NOTE" | "PENDING";
  expectedRefundAmount: number;
  actualRefundAmount: number;
  trackingNumber?: string;
  returnDate: Date;
  shippedDate?: Date;
  completedDate?: Date;
  cancelledDate?: Date;
  cancelledReason?: string;
  approvedBy?: Types.ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
  user: Types.ObjectId;
  userName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierReturnItemSchema = new Schema<ISupplierReturnItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productCode: { type: String, default: "" },
    sku: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    reason: { type: String, default: "DEFECTIVE" },
    restockable: { type: Boolean, default: true },
    previousQuantity: { type: Number, default: 0 },
    newQuantity: { type: Number, default: 0 },
  },
  { _id: false }
);

const SupplierReturnSchema = new Schema<ISupplierReturn>(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", index: true },
    supplierName: { type: String, trim: true, index: true },
    originalStockEntry: { type: Schema.Types.ObjectId, ref: "StockEntry" },
    originalStockEntryRef: { type: String, trim: true },
    items: { type: [SupplierReturnItemSchema], required: true },
    totalItems: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "IN_TRANSIT",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },
    primaryReason: { type: String, default: "DEFECTIVE" },
    resolution: {
      type: String,
      enum: ["REFUND", "REPLACEMENT", "CREDIT_NOTE", "PENDING"],
      default: "PENDING",
    },
    expectedRefundAmount: { type: Number, default: 0 },
    actualRefundAmount: { type: Number, default: 0 },
    trackingNumber: { type: String, trim: true },
    returnDate: { type: Date, default: () => new Date(), index: true },
    shippedDate: { type: Date },
    completedDate: { type: Date },
    cancelledDate: { type: Date },
    cancelledReason: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedByName: { type: String },
    approvedAt: { type: Date },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

SupplierReturnSchema.index({ createdAt: -1 });
SupplierReturnSchema.index({ supplier: 1, returnDate: -1 });
SupplierReturnSchema.index({ status: 1, returnDate: -1 });

export const SupplierReturn: Model<ISupplierReturn> =
  mongoose.models.SupplierReturn ||
  mongoose.model<ISupplierReturn>("SupplierReturn", SupplierReturnSchema);
