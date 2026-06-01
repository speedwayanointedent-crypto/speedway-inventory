"use server";

import { connectDB } from "@/lib/db";
import { Sale, Product, Customer, Notification, ActivityLog } from "@/models";
import { requireAuth } from "@/lib/session";
import { safeJSON } from "@/lib/utils";

function getDateRange(period: "today" | "week" | "month" | "year") {
  const now = new Date();
  const start = new Date();
  if (period === "today") start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(now.getDate() - 7);
  if (period === "month") start.setMonth(now.getMonth() - 1);
  if (period === "year") start.setFullYear(now.getFullYear() - 1);
  return { start, end: now };
}

async function aggregateSales(start: Date, end: Date) {
  const result = await Sale.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $in: ["COMPLETED", "PARTIAL_REFUND"] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$total" },
        count: { $sum: 1 },
        refunded: { $sum: "$refundedAmount" },
      },
    },
  ]);
  return result[0] || { total: 0, count: 0, refunded: 0 };
}

export async function getDashboardMetrics() {
  await requireAuth();
  await connectDB();

  const today = getDateRange("today");
  const week = getDateRange("week");
  const month = getDateRange("month");
  const year = getDateRange("year");

  const [todayStats, weekStats, monthStats, yearStats] = await Promise.all([
    aggregateSales(today.start, today.end),
    aggregateSales(week.start, week.end),
    aggregateSales(month.start, month.end),
    aggregateSales(year.start, year.end),
  ]);

  const [totalProducts, lowStock, outOfStock] = await Promise.all([
    Product.countDocuments({ status: "ACTIVE" }),
    Product.countDocuments({
      status: "ACTIVE",
      $expr: { $and: [{ $gt: ["$quantity", 0] }, { $lte: ["$quantity", "$reorderLevel"] }] },
    }),
    Product.countDocuments({ status: "ACTIVE", quantity: 0 }),
  ]);

  const topProducts = await Product.find({ status: "ACTIVE" })
    .sort({ totalSold: -1 })
    .limit(5)
    .select("name totalSold quantity sellingPrice")
    .lean();

  const topCustomers = await Customer.find({ isActive: true })
    .sort({ totalSpending: -1 })
    .limit(5)
    .select("name totalSpending lastPurchaseDate")
    .lean();

  const recentTransactions = await Sale.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .select("saleNumber customerName total status createdAt paymentMethod")
    .lean();

  const salesTrend = await Sale.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        status: { $in: ["COMPLETED", "PARTIAL_REFUND"] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: "$total" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const inventoryValue = await Product.aggregate([
    { $match: { status: "ACTIVE" } },
    {
      $group: {
        _id: null,
        costValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
        sellingValue: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } },
      },
    },
  ]);

  const recentNotifications = await Notification.find({ isRead: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentActivity = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .select("userName action module description createdAt")
    .lean();

  return {
    sales: {
      today: { total: todayStats.total, count: todayStats.count },
      week: { total: weekStats.total, count: weekStats.count },
      month: { total: monthStats.total, count: monthStats.count },
      year: { total: yearStats.total, count: yearStats.count },
    },
    inventory: {
      totalProducts,
      lowStock,
      outOfStock,
      value: inventoryValue[0] || { costValue: 0, sellingValue: 0 },
    },
    topProducts: safeJSON<unknown[]>(topProducts),
    topCustomers: safeJSON<unknown[]>(topCustomers),
    recentTransactions: safeJSON<unknown[]>(recentTransactions),
    salesTrend: salesTrend.map((d) => ({ date: d._id, total: d.total, count: d.count })),
    notifications: safeJSON<unknown[]>(recentNotifications),
    activity: safeJSON<unknown[]>(recentActivity),
  };
}

export async function getSalesReport(opts: { from: string; to: string }) {
  await requireAuth();
  await connectDB();
  const from = new Date(opts.from);
  const to = new Date(opts.to);

  const sales = await Sale.find({
    createdAt: { $gte: from, $lte: to },
    status: { $in: ["COMPLETED", "PARTIAL_REFUND"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const summary = sales.reduce(
    (acc, s) => {
      acc.total += s.total;
      acc.discount += s.totalDiscount;
      acc.tax += s.tax;
      acc.refunded += s.refundedAmount;
      acc.count += 1;
      return acc;
    },
    { total: 0, discount: 0, tax: 0, refunded: 0, count: 0 }
  );

  return { sales: safeJSON<unknown[]>(sales), summary };
}

export async function getInventoryReport() {
  await requireAuth();
  await connectDB();
  const products = await Product.find({ status: "ACTIVE" })
    .populate("category", "name")
    .sort({ quantity: 1 })
    .lean();
  const totals = products.reduce(
    (acc, p) => {
      acc.totalCost += p.quantity * p.costPrice;
      acc.totalValue += p.quantity * p.sellingPrice;
      acc.totalUnits += p.quantity;
      return acc;
    },
    { totalCost: 0, totalValue: 0, totalUnits: 0 }
  );
  return { products: safeJSON<unknown[]>(products), totals };
}

export async function getProfitReport(opts: { from: string; to: string }) {
  await requireAuth();
  await connectDB();
  const from = new Date(opts.from);
  const to = new Date(opts.to);

  const sales = await Sale.find({
    createdAt: { $gte: from, $lte: to },
    status: { $in: ["COMPLETED", "PARTIAL_REFUND"] },
  }).lean();

  let totalRevenue = 0;
  let totalCost = 0;
  for (const sale of sales) {
    for (const item of sale.items) {
      totalRevenue += item.subtotal;
      totalCost += item.costPrice * item.quantity;
    }
  }
  const grossProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return { totalRevenue, totalCost, grossProfit, margin, transactions: sales.length };
}
