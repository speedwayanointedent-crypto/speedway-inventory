import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { PaymentMethod, SaleStatus } from "@/lib/constants";

export interface ISaleItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  subtotal: number;
}

export interface ISale extends Document {
  saleNumber: string;
  publicId: string;
  customer?: mongoose.Types.ObjectId;
  customerName: string;
  items: ISaleItem[];
  subtotal: number;
  totalDiscount: number;
  taxRate: number;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  payments: {
    method: PaymentMethod;
    amount: number;
    reference?: string;
  }[];
  staff: mongoose.Types.ObjectId;
  staffName: string;
  status: SaleStatus;
  notes?: string;
  qrCodeData?: string;
  isWholesale: boolean;
  refundedAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productCode: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    saleNumber: { type: String, required: true, unique: true, index: true },
    publicId: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    customerName: { type: String, required: true },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "MIXED"],
      required: true,
    },
    payments: [
      {
        method: { type: String, enum: ["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "MIXED"] },
        amount: { type: Number },
        reference: { type: String },
      },
    ],
    staff: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    staffName: { type: String, required: true },
    status: {
      type: String,
      enum: ["COMPLETED", "REFUNDED", "CANCELLED", "PARTIAL_REFUND"],
      default: "COMPLETED",
      index: true,
    },
    notes: { type: String },
    qrCodeData: { type: String },
    isWholesale: { type: Boolean, default: false },
    refundedAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SaleSchema.index({ createdAt: -1 });
SaleSchema.index({ status: 1, createdAt: -1 });

export const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);
