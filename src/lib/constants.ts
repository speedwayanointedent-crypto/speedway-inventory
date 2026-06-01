export const APP_CONFIG = {
  name: "SpeedWay Anointed Enterprise",
  shortName: "SpeedWay",
  description:
    "Enterprise wholesale spare parts inventory and POS management system for SpeedWay Anointed Enterprise.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  email: "speedwayanointedent@gmail.com",
  phone: "+233 XX XXX XXXX",
  currency: "GHS",
  currencySymbol: "GH₵",
  taxRate: 0.125,
  receiptFooter: "Thank you for shopping with SpeedWay Anointed Enterprise. Drive safe!",
} as const;

export const ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  VIEW_INVENTORY: "VIEW_INVENTORY",
  CREATE_INVENTORY: "CREATE_INVENTORY",
  EDIT_INVENTORY: "EDIT_INVENTORY",
  DELETE_INVENTORY: "DELETE_INVENTORY",
  CREATE_SALES: "CREATE_SALES",
  VIEW_REPORTS: "VIEW_REPORTS",
  MANAGE_CUSTOMERS: "MANAGE_CUSTOMERS",
  MANAGE_SUPPLIERS: "MANAGE_SUPPLIERS",
  GENERATE_RECEIPTS: "GENERATE_RECEIPTS",
  PROCESS_RETURNS: "PROCESS_RETURNS",
  MANAGE_USERS: "MANAGE_USERS",
  MANAGE_SETTINGS: "MANAGE_SETTINGS",
  VIEW_ACTIVITY_LOGS: "VIEW_ACTIVITY_LOGS",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),
  STAFF: [
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.GENERATE_RECEIPTS,
    PERMISSIONS.VIEW_REPORTS,
  ],
};

export const PAYMENT_METHODS = ["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "MIXED"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  MOBILE_MONEY: "Mobile Money",
  BANK_TRANSFER: "Bank Transfer",
  MIXED: "Mixed Payment",
};

export const SALE_STATUS = ["COMPLETED", "REFUNDED", "CANCELLED", "PARTIAL_REFUND"] as const;
export type SaleStatus = (typeof SALE_STATUS)[number];

export const TRANSACTION_TYPES = [
  "STOCK_IN",
  "STOCK_OUT",
  "SALE",
  "ADJUSTMENT",
  "DAMAGED",
  "RETURN",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const UNIT_TYPES = [
  "Piece",
  "Set",
  "Pair",
  "Box",
  "Pack",
  "Carton",
  "Litre",
  "Kilogram",
  "Metre",
] as const;

export const PRODUCT_STATUS = ["ACTIVE", "INACTIVE", "DISCONTINUED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[number];

export const NOTIFICATION_TYPES = [
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "SALE_COMPLETED",
  "RETURN_CREATED",
  "INVENTORY_ADDED",
  "SYSTEM_ALERT",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
