 /* eslint-disable @typescript-eslint/no-require-imports */
if (!process.env.MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set.");
  console.error("    Create a .env.local file in the project root with:");
  console.error("      MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/speedway");
  console.error("    Or use a local MongoDB:");
  console.error("      MONGODB_URI=mongodb://localhost:27017/speedway");
  process.exit(1);
}

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db";
import {
  User,
  Category,
  Product,
  Supplier,
  Customer,
  Sale,
  InventoryTransaction,
  Notification,
  ActivityLog,
  Settings,
  Shop,
} from "../src/models";
import { generateSaleNumber } from "../src/lib/utils";
import { v4 as uuidv4 } from "uuid";

const DEMO_SHOPS = [
  {
    name: "Head Office - Accra",
    code: "ACC-01",
    address: "Spintex Road, Accra",
    city: "Accra",
    region: "Greater Accra",
    phone: "+233 24 000 0000",
    email: "accoffice@speedway.com",
    manager: "Kwame Asante",
    isActive: true,
    isDefault: true,
    notes: "Flagship store & main warehouse",
  },
  {
    name: "Kumasi Branch",
    code: "KSI-01",
    address: "Adum, Kumasi",
    city: "Kumasi",
    region: "Ashanti",
    phone: "+233 32 200 0001",
    email: "kumasi@speedway.com",
    manager: "Akua Mensah",
    isActive: true,
    isDefault: false,
    notes: "Serves the middle belt",
  },
  {
    name: "Takoradi Branch",
    code: "TDI-01",
    address: "Market Circle, Takoradi",
    city: "Takoradi",
    region: "Western",
    phone: "+233 31 200 0002",
    email: "takoradi@speedway.com",
    manager: "Kofi Boateng",
    isActive: true,
    isDefault: false,
    notes: "Western region hub",
  },
  {
    name: "Tema Warehouse",
    code: "TMA-01",
    address: "Heavy Industrial Area, Tema",
    city: "Tema",
    region: "Greater Accra",
    phone: "+233 30 200 0003",
    email: "warehouse@speedway.com",
    manager: "Efua Owusu",
    isActive: true,
    isDefault: false,
    notes: "Bulk storage & wholesale fulfillment",
  },
  {
    name: "Cape Coast Kiosk",
    code: "CCT-01",
    address: "Kotokuraba, Cape Coast",
    city: "Cape Coast",
    region: "Central",
    phone: "+233 33 200 0004",
    manager: "Yaw Adjei",
    isActive: true,
    isDefault: false,
  },
];

const DEMO_CATEGORIES = [
  { name: "Brakes", description: "Brake pads, discs, calipers" },
  { name: "Engine Parts", description: "Pistons, gaskets, filters" },
  { name: "Suspension", description: "Shocks, struts, springs" },
  { name: "Electrical", description: "Batteries, alternators, starters" },
  { name: "Transmission", description: "Clutch kits, gear oils" },
  { name: "Body Parts", description: "Mirrors, lights, bumpers" },
  { name: "Tyres & Wheels", description: "Tyres, rims, valves" },
  { name: "Oils & Fluids", description: "Engine oil, brake fluid, coolant" },
  { name: "Accessories", description: "Floor mats, seat covers" },
  { name: "Tools", description: "Wrenches, jacks, diagnostic tools" },
];

const DEMO_SUPPLIERS = [
  { companyName: "AutoParts GH Ltd", contactPerson: "Kwame Mensah", phone: "+233 24 111 2222", email: "sales@autopartsgh.com" },
  { companyName: "Global Spare Parts Co.", contactPerson: "Akua Asante", phone: "+233 20 333 4444", email: "info@globalspareparts.com" },
  { companyName: "Motors Direct", contactPerson: "Yaw Boateng", phone: "+233 27 555 6666", email: "orders@motorsdirect.com" },
  { companyName: "Quality Parts Africa", contactPerson: "Efua Osei", phone: "+233 24 777 8888", email: "support@qualityparts.africa" },
  { companyName: "Vehicle Components Ltd", contactPerson: "Kofi Adjei", phone: "+233 20 999 0000", email: "contact@vcltd.com" },
  { companyName: "Speedy Motors Supply", contactPerson: "Ama Darko", phone: "+233 27 123 4567", email: "ama@speedymotors.com" },
  { companyName: "Continental Parts", contactPerson: "Kojo Owusu", phone: "+233 24 890 1234", email: "kojo@continentalparts.com" },
  { companyName: "Express Auto", contactPerson: "Adwoa Sarpong", phone: "+233 20 234 5678", email: "adwoa@expressauto.com" },
  { companyName: "Nana Yaw Motors", contactPerson: "Nana Yaw", phone: "+233 27 345 6789" },
  { companyName: "Kingsway Auto Spares", contactPerson: "Yaa Asantewa", phone: "+233 24 456 7890", email: "yaa@kingsway.com" },
];

const DEMO_CUSTOMERS = [
  { name: "Kwame Asante", phone: "+233 24 100 0001", email: "kwame@example.com", address: "East Legon, Accra", isWholesale: true, companyName: "Asante Auto Works" },
  { name: "Akua Mensah", phone: "+233 20 100 0002", address: "Tema", isWholesale: true, companyName: "Mensah Garage" },
  { name: "Kofi Boateng", phone: "+233 27 100 0003", address: "Kumasi" },
  { name: "Efua Owusu", phone: "+233 24 100 0004", email: "efua@example.com", address: "Takoradi", companyName: "Owusu Motors" },
  { name: "Yaw Adjei", phone: "+233 20 100 0005", address: "Cape Coast", isWholesale: true, companyName: "Adjei Auto" },
  { name: "Ama Sarpong", phone: "+233 27 100 0006", email: "ama@example.com", address: "Accra New Town" },
  { name: "Kojo Darko", phone: "+233 24 100 0007", address: "Madina" },
  { name: "Adwoa Kumi", phone: "+233 20 100 0008", email: "adwoa@example.com", address: "Kasoa", isWholesale: true, companyName: "Kumi Trading" },
  { name: "Kwesi Tetteh", phone: "+233 27 100 0009", address: "Spintex" },
  { name: "Yaa Asantewa", phone: "+233 24 100 0010", email: "yaa@example.com", address: "Airport Residential", companyName: "Asantewa Co." },
];

type ProductOrientation = "SINGLE" | "LEFT_RIGHT";

type ProductSeed = {
  name: string;
  category: string;
  brand: string;
  vehicle: string[];
  sell: number;
  /**
   * For SINGLE products: total quantity.
   * For LEFT_RIGHT products: total quantity (fallback if leftQty/rightQty are not provided).
   */
  qty: number;
  orientation?: ProductOrientation;
  /**
   * For LEFT_RIGHT products: exact left quantity.
   */
  leftQty?: number;
  /**
   * For LEFT_RIGHT products: exact right quantity.
   */
  rightQty?: number;
};

const PRODUCT_NAMES: ProductSeed[] = [
  { name: "Front Brake Pad Set", category: "Brakes", brand: "Bosch", vehicle: ["Toyota Camry 2007-2017", "Toyota Corolla 2009-2019"], sell: 80, qty: 50, orientation: "SINGLE" },
  { name: "Rear Brake Dtomaisc", category: "Brakes", brand: "Brembo", vehicle: ["Honda Accord 2008-2015"], sell: 200, qty: 18, orientation: "SINGLE" },
  { name: "Brake Caliper Front", category: "Brakes", brand: "TRW", vehicle: ["Hyundai Elantra 2011-2016"], sell: 320, qty: 8, orientation: "SINGLE" },
  { name: "Engine Oil Filter", category: "Engine Parts", brand: "Mann", vehicle: ["Universal"], sell: 25, qty: 200, orientation: "SINGLE" },
  { name: "Air Filter", category: "Engine Parts", brand: "K&N", vehicle: ["Toyota Hilux 2015-2023"], sell: 55, qty: 65, orientation: "SINGLE" },
  { name: "Spark Plug Set (4)", category: "Engine Parts", brand: "NGK", vehicle: ["Nissan Altima 2013-2018"], sell: 65, qty: 75, orientation: "SINGLE" },
  { name: "Head Gasket", category: "Engine Parts", brand: "Cometic", vehicle: ["Toyota Corolla 2009-2019"], sell: 150, qty: 12, orientation: "SINGLE" },
  // LEFT_RIGHT: specify exact left/right quantities
  { name: "Front Shock Absorber (L/R)", category: "Suspension", brand: "KYB", vehicle: ["Toyota Camry 2007-2017"], sell: 165, qty: 22, orientation: "LEFT_RIGHT", leftQty: 12, rightQty: 10 },
];

const PAYMENT_METHODS = ["CASH", "MOBILE_MONEY", "BANK_TRANSFER"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

async function main() {
  console.log("🌱 Seeding database...");
  await connectDB();

  console.log("→ Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Shop.deleteMany({}),
  ]);

  console.log("→ Users");
  const adminPass = await bcrypt.hash("Admin@123456", 10);
  const staffPass = await bcrypt.hash("Staff@123456", 10);

  const [admin, staff] = await User.create([
    {
      name: "Admin User",
      email: "admin@speedway.com",
      password: adminPass,
      role: "ADMIN",
      phone: "+233 24 000 0000",
      status: "ACTIVE",
      permissions: [],
      isActive: true,
    },
    {
      name: "Staff User",
      email: "staff@speedway.com",
      password: staffPass,
      role: "STAFF",
      phone: "+233 24 111 1111",
      status: "ACTIVE",
      permissions: [],
      isActive: true,
    },
  ]);

  console.log("→ Settings");
  await Settings.create({
    companyName: "SpeedWay Anointed Enterprise",
    address: "Spintex Road, Accra, Ghana",
    phone: "+233 24 000 0000",
    email: "speedwayanointedent@gmail.com",
    currency: "GHS",
    currencySymbol: "GH₵",
    taxRate: 12.5,
    receiptFooter: "Thank you for shopping with SpeedWay Anointed Enterprise. Drive safe!",
    enableLowStockAlerts: true,
    enableEmailReceipts: true,
    enableDailyReports: false,
    receiptPrefix: "SW",
  });

  console.log("→ Shops");
  const shops = await Shop.insertMany(DEMO_SHOPS);
  const defaultShop = shops.find((s) => s.isDefault) ?? shops[0];
  const shopByCode = new Map(shops.map((s) => [s.code, s]));

  console.log("→ Categories");
  const categories = await Category.insertMany(
    DEMO_CATEGORIES.map((c) => ({
      ...c,
      slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    }))
  );
  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  console.log("→ Suppliers");
  const suppliers = await Supplier.insertMany(DEMO_SUPPLIERS);

  console.log("→ Customers");
  const customers = await Customer.insertMany(DEMO_CUSTOMERS);

  console.log("→ Products");

  // Drop legacy/removed unique index that may still exist in the database (e.g. { sku: 1 } with unique=true).
  // Current Product schema no longer defines `sku`, but older deployments may have created a unique index on it.
  const productCollection = Product.collection;
  const indexes = await productCollection.indexes();
  const skuIndexes = indexes.filter(
    (idx) => idx?.key && Object.keys(idx.key).some((k) => k === "sku")
  );

  for (const idx of skuIndexes) {
    const indexName = idx?.name;
    if (!indexName) continue;

    try {
      await productCollection.dropIndex(indexName);
      console.log(`→ Dropped legacy index: ${indexName}`);
    } catch (err) {
      console.log(
        `→ Could not drop index ${indexName} (continuing):`,
        err instanceof Error ? err.message : err
      );
    }
  }

  const products = await Product.insertMany(
    PRODUCT_NAMES.map((p, idx) => {
      const cat = categoryByName.get(p.category);
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const shop = shops[Math.floor(Math.random() * shops.length)];

      const aisle = ["A", "B", "C", "D"][Math.floor(Math.random() * 4)];
      const shelf = Math.floor(Math.random() * 6) + 1;
      const bin = Math.floor(Math.random() * 8) + 1;

      const orientation = p.orientation ?? (idx % 5 === 0 ? "LEFT_RIGHT" : "SINGLE");
      const images: string[] = [];

      const quantityLeft =
        orientation === "LEFT_RIGHT"
          ? p.leftQty ?? Math.floor(p.qty / 2)
          : 0;

      const quantityRight =
        orientation === "LEFT_RIGHT"
          ? p.rightQty ?? p.qty - Math.floor(p.qty / 2)
          : 0;

      return {
        name: p.name,
        productCode: `SW-${Math.floor(100000 + Math.random() * 900000)}`,
        category: cat?._id,
        shop: shop._id,
        storageLocation: `Aisle ${aisle} · Shelf ${shelf} · Bin ${bin}`,
        brand: p.brand,
        vehicleCompatibility: p.vehicle,
        price: p.sell,
        supplier: supplier._id,
        reorderLevel: Math.max(5, Math.floor(p.qty * 0.2)),
        status: "ACTIVE",
        images,
        orientation,
        totalSold: 0,
        createdBy: admin._id,
        quantity: orientation === "SINGLE" ? p.qty : 0,
        quantityLeft,
        quantityRight,
        // storage handling
      };
    })
  );

  console.log("→ Inventory transactions");
  await InventoryTransaction.insertMany(
    products.map((p) => {
      const qty =
        (p.quantity ?? 0) + (p.quantityLeft ?? 0) + (p.quantityRight ?? 0);

      return {
        product: p._id,
        productName: p.name,
        type: "STOCK_IN",
        previousQuantity: 0,
        changeQuantity: qty,
        newQuantity: qty,
        reason: "Initial seed stock",
        user: admin._id,
        userName: admin.name,
      };
    })
  );

  console.log("→ Sales (last 30 days)");
  const salesToCreate: Array<Record<string, unknown>> = [];
  for (let day = 0; day < 30; day++) {
    const numSales = Math.floor(Math.random() * 6) + 2;
    for (let i = 0; i < numSales; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const cashier = Math.random() > 0.6 ? staff : admin;
      const numItems = Math.floor(Math.random() * 3) + 1;

      const items: Array<{
        product: typeof products[0]["_id"];
        productName: string;
        productCode: string;
        quantity: number;
        unitPrice: number;
        costPrice: number;
        discount: number;
        subtotal: number;
      }> = [];

      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;

        // Current schema has a single `price` field.
        const unitPrice = prod.price;

        const lineSubtotal = unitPrice * qty;

        items.push({
          product: prod._id,
          productName: prod.name,
          productCode: prod.productCode,
          quantity: qty,
          unitPrice,
          // If you later add explicit cost fields back to Product, update this.
          costPrice: Math.round(unitPrice * 0.6 * 100) / 100,
          discount: 0,
          subtotal: lineSubtotal,
        });

        subtotal += lineSubtotal;
      }

      const tax = subtotal * 0.125;
      const total = subtotal + tax;

      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));

      const payment = [
        "CASH",
        "MOBILE_MONEY",
        "BANK_TRANSFER",
      ][Math.floor(Math.random() * 3)] as "CASH" | "MOBILE_MONEY" | "BANK_TRANSFER";

      salesToCreate.push({
        saleNumber: generateSaleNumber(),
        publicId: uuidv4(),
        customer: customer._id,
        customerName: customer.name,
        items,
        subtotal,
        totalDiscount: 0,
        taxRate: 12.5,
        tax,
        total,
        amountPaid: total,
        change: 0,
        paymentMethod: payment,
        payments: [{ method: payment, amount: total }],
        staff: cashier._id,
        staffName: cashier.name,
        status: "COMPLETED",
        isWholesale: customer.isWholesale,
        refundedAmount: 0,
        createdAt: date,
        updatedAt: date,
      });
    }
  }
  await Sale.insertMany(salesToCreate);

  console.log("→ Customer spending");
  for (const c of customers) {
    const sales = await Sale.find({ customer: c._id });
    const total = sales.reduce((s, x) => s + x.total, 0);
    const lastDate = sales.length > 0 ? sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt : undefined;
    c.totalSpending = total;
    if (lastDate) c.lastPurchaseDate = lastDate;
    await c.save();
  }

  console.log("→ Notifications");
  await Notification.insertMany([
    { type: "LOW_STOCK", title: "Low stock", message: "Rear Brake Disc now has 18 units", link: "/inventory" },
    { type: "LOW_STOCK", title: "Low stock", message: "Alternator Assembly now has 6 units", link: "/inventory" },
    { type: "SYSTEM_ALERT", title: "Welcome", message: "Your SpeedWay database is ready." },
  ]);

  console.log("✅ Seed complete");
  console.log("");
  console.log("Demo accounts:");
  console.log("  Admin: admin@speedway.com / Admin@123456");
  console.log("  Staff: staff@speedway.com / Staff@123456");
  console.log("");
  console.log(`Created ${shops.length} shop locations:`);
  for (const s of shops) {
    console.log(`  - ${s.name} (${s.code})${s.isDefault ? " [default]" : ""}`);
  }
  await mongoose.disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\n❌  Seed failed:", e?.message ?? e);
    if (e?.stack) console.error(e.stack);
    process.exit(1);
  });
