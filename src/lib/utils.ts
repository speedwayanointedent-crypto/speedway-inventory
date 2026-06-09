import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "GHS"): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function generateSaleNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `SW-${ymd}-${random}`;
}

export function generateProductCode(prefix = "SW"): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
}

export function generateStockReferenceNumber(prefix = "STK"): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${ymd}-${random}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function truncate(str: string, length = 40): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getEffectiveQuantity(product: {
  orientation?: string;
  quantity: number;
  quantityLeft?: number;
  quantityRight?: number;
}): number {
  if (product.orientation === "LEFT_RIGHT") {
    return (product.quantityLeft ?? 0) + (product.quantityRight ?? 0);
  }
  return product.quantity;
}

export function addStockLine(
  product: { orientation?: string; quantity: number; quantityLeft?: number; quantityRight?: number },
  side: "SINGLE" | "LEFT" | "RIGHT",
  qty: number
): { quantity: number; quantityLeft?: number; quantityRight?: number } {
  if (product.orientation === "LEFT_RIGHT" && side !== "SINGLE") {
    const left = side === "LEFT" ? (product.quantityLeft ?? 0) + qty : product.quantityLeft ?? 0;
    const right = side === "RIGHT" ? (product.quantityRight ?? 0) + qty : product.quantityRight ?? 0;
    return { quantity: left + right, quantityLeft: left, quantityRight: right };
  }
  return { quantity: product.quantity + qty };
}

export function subtractStockLine(
  product: { orientation?: string; quantity: number; quantityLeft?: number; quantityRight?: number },
  side: "SINGLE" | "LEFT" | "RIGHT",
  qty: number
): { quantity: number; quantityLeft?: number; quantityRight?: number } {
  if (product.orientation === "LEFT_RIGHT" && side !== "SINGLE") {
    const left = side === "LEFT" ? Math.max(0, (product.quantityLeft ?? 0) - qty) : product.quantityLeft ?? 0;
    const right = side === "RIGHT" ? Math.max(0, (product.quantityRight ?? 0) - qty) : product.quantityRight ?? 0;
    return { quantity: left + right, quantityLeft: left, quantityRight: right };
  }
  return { quantity: Math.max(0, product.quantity - qty) };
}

export function getStockStatus(quantity: number, reorderLevel: number) {
  if (quantity <= 0) return { label: "Out of Stock", variant: "destructive" as const };
  if (quantity <= reorderLevel) return { label: "Low Stock", variant: "warning" as const };
  return { label: "In Stock", variant: "success" as const };
}

export function safeJSON<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
