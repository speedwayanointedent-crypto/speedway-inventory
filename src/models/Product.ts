import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ProductStatus } from "@/lib/constants";

export interface IProduct extends Document {
  name: string;
  productCode: string;
  sku: string;
  barcode?: string;
  category: mongoose.Types.ObjectId;
  brand?: string;
  vehicleCompatibility: string[];
  description?: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  quantity: number;
  reorderLevel: number;
  unitType: string;
  supplier?: mongoose.Types.ObjectId;
  images: string[];
  shop: mongoose.Types.ObjectId;
  storageLocation?: string;
  status: ProductStatus;
  totalSold: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: "text" },
    productCode: { type: String, required: true, unique: true, index: true, trim: true },
    sku: { type: String, required: true, unique: true, index: true, trim: true },
    barcode: { type: String, index: true, sparse: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    brand: { type: String, trim: true },
    vehicleCompatibility: [{ type: String, trim: true }],
    description: { type: String },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    wholesalePrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, default: 0, min: 0, index: true },
    reorderLevel: { type: Number, default: 10, min: 0 },
    unitType: { type: String, default: "Piece" },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" },
    images: [{ type: String }],
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    storageLocation: { type: String, trim: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DISCONTINUED"],
      default: "ACTIVE",
      index: true,
    },
    totalSold: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", productCode: "text", sku: "text", barcode: "text" });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ shop: 1, status: 1 });
ProductSchema.index({ quantity: 1, reorderLevel: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
