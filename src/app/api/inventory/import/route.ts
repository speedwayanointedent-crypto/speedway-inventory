import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product, Category, Shop, InventoryTransaction } from "@/models";
import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/constants";
import { logActivity } from "@/lib/activity";

interface ImportRow {
  name?: string;
  productCode?: string;
  category?: string;
  price?: string | number;
  quantity?: string | number;
  reorderLevel?: string | number;
  brand?: string;
  vehicleCompatibility?: string;
  status?: string;
  shop?: string;
  storageLocation?: string;
}

export async function POST(req: Request) {
  const user = await requirePermission(PERMISSIONS.CREATE_INVENTORY);
  await connectDB();
  const { rows } = (await req.json()) as { rows: ImportRow[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ success: false, error: "No rows provided" });
  }

  let inserted = 0;
  let failed = 0;
  const categoriesCache = new Map<string, string>();
  const shopsCache = new Map<string, string>();

  let defaultShop = await Shop.findOne({ isDefault: true });
  if (!defaultShop) {
    defaultShop = await Shop.findOne({ isActive: true });
  }

  for (const row of rows) {
    try {
      if (!row.name || !row.productCode || !row.category) {
        failed++;
        continue;
      }
      const price = Number(row.price) || 0;
      const qty = Number(row.quantity) || 0;
      const reorder = Number(row.reorderLevel) || 10;
      const vehicle = (row.vehicleCompatibility || "")
        .split(/[,;|]/)
        .map((v) => v.trim())
        .filter(Boolean);

      let categoryId = categoriesCache.get(row.category.toLowerCase());
      if (!categoryId) {
        let cat = await Category.findOne({ name: { $regex: `^${row.category}$`, $options: "i" } });
        if (!cat) {
          cat = await Category.create({
            name: row.category,
            slug: row.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
          });
        }
        categoryId = cat._id.toString();
        categoriesCache.set(row.category.toLowerCase(), categoryId);
      }

      let shopId: string | undefined;
      if (row.shop) {
        const key = row.shop.toLowerCase().trim();
        shopId = shopsCache.get(key);
        if (!shopId) {
          let shop = await Shop.findOne({
            $or: [
              { name: { $regex: `^${row.shop}$`, $options: "i" } },
              { code: row.shop.toUpperCase() },
            ],
          });
          if (!shop) {
            shop = await Shop.create({
              name: row.shop.trim(),
              code: row.shop
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, "-")
                .slice(0, 12)
                .replace(/^-+|-+$/g, ""),
              isActive: true,
            });
          }
          shopId = shop._id.toString();
          shopsCache.set(key, shopId);
        }
      } else if (defaultShop) {
        shopId = defaultShop._id.toString();
      }

      if (!shopId) {
        failed++;
        continue;
      }

      const product = await Product.create({
        name: row.name.trim(),
        productCode: row.productCode.trim(),
        category: categoryId,
        shop: shopId,
        storageLocation: row.storageLocation?.trim() || undefined,
        price,
        quantity: qty,
        reorderLevel: reorder,
        brand: row.brand,
        vehicleCompatibility: vehicle,
        status: (row.status as "ACTIVE" | "INACTIVE" | "DISCONTINUED") || "ACTIVE",
        createdBy: user.id,
      });

      if (qty > 0) {
        await InventoryTransaction.create({
          product: product._id,
          productName: product.name,
          type: "STOCK_IN",
          previousQuantity: 0,
          changeQuantity: qty,
          newQuantity: qty,
          reason: "Initial stock from CSV import",
          user: user.id,
          userName: user.name,
        });
      }

      inserted++;
    } catch (err) {
      console.error("import row error", err);
      failed++;
    }
  }

  await logActivity(user, {
    action: "IMPORT_INVENTORY",
    module: "INVENTORY",
    description: `Imported ${inserted} products from CSV`,
  });

  return NextResponse.json({ success: true, inserted, failed });
}
