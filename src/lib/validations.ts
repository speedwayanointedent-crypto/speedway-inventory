import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const newPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["ADMIN", "STAFF"]),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).optional(),
});

export const userUpdateSchema = userSchema.partial().extend({
  isActive: z.boolean().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  productCode: z.string().min(1, "Product code is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  vehicleCompatibility: z.array(z.string()).default([]),
  description: z.string().optional(),
  costPrice: z.coerce.number().min(0, "Cost price must be positive"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be positive"),
  wholesalePrice: z.coerce.number().min(0, "Wholesale price must be positive"),
  quantity: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(10),
  unitType: z.string().default("Piece"),
  supplier: z.string().optional(),
  images: z.array(z.string()).default([]),
  shop: z.string().min(1, "Shop location is required"),
  storageLocation: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]).default("ACTIVE"),
});

const productBaseShape = {
  name: z.string().min(2, "Product name is required").optional(),
  productCode: z.string().min(1, "Product code is required").optional(),
  sku: z.string().min(1, "SKU is required").optional(),
  barcode: z.string().optional(),
  category: z.string().min(1, "Category is required").optional(),
  brand: z.string().optional(),
  vehicleCompatibility: z.array(z.string()).optional(),
  description: z.string().optional(),
  costPrice: z.coerce.number().min(0, "Cost price must be positive").optional(),
  sellingPrice: z.coerce.number().min(0, "Selling price must be positive").optional(),
  wholesalePrice: z.coerce.number().min(0, "Wholesale price must be positive").optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  reorderLevel: z.coerce.number().int().min(0).optional(),
  unitType: z.string().optional(),
  supplier: z.string().optional(),
  images: z.array(z.string()).optional(),
  shop: z.string().min(1, "Shop location is required").optional(),
  storageLocation: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]).optional(),
};

export const productUpdateSchema = z.object(productBaseShape);

export const shopSchema = z.object({
  name: z.string().min(2, "Shop name is required"),
  code: z
    .string()
    .min(2, "Code is required")
    .max(12, "Code must be 12 characters or less")
    .regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, or hyphens")
    .transform((s) => s.toUpperCase()),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  manager: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  notes: z.string().optional(),
});

const shopBaseShape = {
  name: z.string().min(2, "Shop name is required").optional(),
  code: z
    .string()
    .min(2)
    .max(12)
    .regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, or hyphens")
    .transform((s) => s.toUpperCase())
    .optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  manager: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  notes: z.string().optional(),
};

export const shopUpdateSchema = z.object(shopBaseShape);

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(7, "Phone number is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: "You must accept the terms to continue",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ShopInput = z.infer<typeof shopSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  parent: z.string().optional(),
});

export const supplierSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  phone: z.string().min(7, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Customer name is required"),
  phone: z.string().min(7, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  companyName: z.string().optional(),
  notes: z.string().optional(),
  isWholesale: z.boolean().default(false),
});

const customerBaseShape = {
  name: z.string().min(2, "Customer name is required").optional(),
  phone: z.string().min(7, "Phone number is required").optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  companyName: z.string().optional(),
  notes: z.string().optional(),
  isWholesale: z.boolean().optional(),
};

export const customerUpdateSchema = z.object(customerBaseShape);

export const stockEntrySchema = z.object({
  product: z.string().min(1, "Product is required"),
  quantityAdded: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  purchaseCost: z.coerce.number().min(0),
  supplier: z.string().optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
  entryDate: z.string().or(z.date()).optional(),
});

export const saleItemSchema = z.object({
  product: z.string(),
  productName: z.string(),
  productCode: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  costPrice: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  subtotal: z.number(),
});

export const saleSchema = z.object({
  customer: z.string().optional(),
  customerName: z.string().min(1),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  subtotal: z.number().min(0),
  totalDiscount: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  amountPaid: z.number().min(0),
  change: z.number().default(0),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "MIXED"]),
  payments: z
    .array(
      z.object({
        method: z.enum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "MIXED"]),
        amount: z.number().min(0),
        reference: z.string().optional(),
      })
    )
    .optional(),
  notes: z.string().optional(),
  isWholesale: z.boolean().default(false),
});

export const returnSchema = z.object({
  sale: z.string().min(1),
  items: z
    .array(
      z.object({
        product: z.string(),
        productName: z.string(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
        subtotal: z.number().min(0),
      })
    )
    .min(1),
  reason: z.string().min(2, "Reason is required"),
  type: z.enum(["FULL", "PARTIAL"]).default("PARTIAL"),
  restoreInventory: z.boolean().default(true),
  notes: z.string().optional(),
});

export const settingsSchema = z.object({
  companyName: z.string().min(2),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  logo: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().optional().default("GHS"),
  currencySymbol: z.string().optional().default("GH₵"),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
  receiptFooter: z.string().optional().default(""),
  enableLowStockAlerts: z.boolean().optional().default(true),
  enableEmailReceipts: z.boolean().optional().default(true),
  enableDailyReports: z.boolean().optional().default(true),
  receiptPrefix: z.string().optional().default("SW"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
});

export const settingsUpdateSchema = z.object({
  companyName: z.string().min(2).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  logo: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  receiptFooter: z.string().optional(),
  enableLowStockAlerts: z.boolean().optional(),
  enableEmailReceipts: z.boolean().optional(),
  enableDailyReports: z.boolean().optional(),
  receiptPrefix: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type StockEntryInput = z.infer<typeof stockEntrySchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
