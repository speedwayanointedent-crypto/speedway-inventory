import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISettings extends Document {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  taxId?: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  receiptFooter: string;
  theme: "light" | "dark" | "system";
  enableLowStockAlerts: boolean;
  enableEmailReceipts: boolean;
  enableDailyReports: boolean;
  receiptPrefix: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    companyName: { type: String, default: "SpeedWay Anointed Enterprise" },
    address: { type: String, default: "Accra, Ghana" },
    phone: { type: String, default: "+233 XX XXX XXXX" },
    email: { type: String, default: "speedwayanointedent@gmail.com" },
    logo: { type: String },
    taxId: { type: String },
    currency: { type: String, default: "GHS" },
    currencySymbol: { type: String, default: "GH₵" },
    taxRate: { type: Number, default: 12.5 },
    receiptFooter: {
      type: String,
      default: "Thank you for shopping with SpeedWay Anointed Enterprise. Drive safe!",
    },
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    enableLowStockAlerts: { type: Boolean, default: true },
    enableEmailReceipts: { type: Boolean, default: true },
    enableDailyReports: { type: Boolean, default: false },
    receiptPrefix: { type: String, default: "SW" },
  },
  { timestamps: true }
);

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);
