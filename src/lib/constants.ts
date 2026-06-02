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

export const USER_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

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
  "STOCK_RECEIVED",
  "SUPPLIER_PAYMENT_DUE",
  "REORDER_ALERT",
  "STILL_LOW_AFTER_INTAKE",
  "SYSTEM_ALERT",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const STOCK_PAYMENT_STATUS = ["PAID", "PARTIAL", "PENDING", "UNPAID"] as const;
export type StockPaymentStatus = (typeof STOCK_PAYMENT_STATUS)[number];

export const STOCK_PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "MOBILE_MONEY",
  "CHEQUE",
  "CREDIT",
] as const;
export type StockPaymentMethod = (typeof STOCK_PAYMENT_METHODS)[number];

export const STOCK_PAYMENT_METHOD_LABELS: Record<StockPaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  MOBILE_MONEY: "Mobile Money",
  CHEQUE: "Cheque",
  CREDIT: "Credit",
};

export const STOCK_ENTRY_STATUS = ["RECEIVED", "PENDING", "CANCELLED"] as const;
export type StockEntryStatus = (typeof STOCK_ENTRY_STATUS)[number];

export const STOCK_ENTRY_STATUS_LABELS: Record<StockEntryStatus, string> = {
  RECEIVED: "Received",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
};

export const SUPPLIER_RETURN_STATUS = [
  "PENDING",
  "APPROVED",
  "IN_TRANSIT",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;
export type SupplierReturnStatus = (typeof SUPPLIER_RETURN_STATUS)[number];

export const SUPPLIER_RETURN_STATUS_LABELS: Record<SupplierReturnStatus, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  IN_TRANSIT: "In Transit",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const SUPPLIER_RETURN_REASONS = [
  "DEFECTIVE",
  "WRONG_ITEM",
  "OVERSTOCK",
  "QUALITY_ISSUE",
  "DAMAGED_IN_TRANSIT",
  "EXPIRED",
  "OTHER",
] as const;
export type SupplierReturnReason = (typeof SUPPLIER_RETURN_REASONS)[number];

export const SUPPLIER_RETURN_REASON_LABELS: Record<SupplierReturnReason, string> = {
  DEFECTIVE: "Defective / Faulty",
  WRONG_ITEM: "Wrong Item Delivered",
  OVERSTOCK: "Overstocked",
  QUALITY_ISSUE: "Quality Issue",
  DAMAGED_IN_TRANSIT: "Damaged in Transit",
  EXPIRED: "Expired",
  OTHER: "Other",
};

export const SUPPLIER_RETURN_RESOLUTION = [
  "REFUND",
  "REPLACEMENT",
  "CREDIT_NOTE",
  "PENDING",
] as const;
export type SupplierReturnResolution = (typeof SUPPLIER_RETURN_RESOLUTION)[number];

export const SUPPLIER_RETURN_RESOLUTION_LABELS: Record<SupplierReturnResolution, string> = {
  REFUND: "Refund",
  REPLACEMENT: "Replacement",
  CREDIT_NOTE: "Credit Note",
  PENDING: "Pending Decision",
};
