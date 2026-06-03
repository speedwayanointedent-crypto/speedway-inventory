import type { Metadata } from "next";
import Link from "next/link";
import {
  Plus,
  Package,
  Download,
  Upload,
  AlertTriangle,
  Store,
  Box,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getProducts } from "@/actions/inventory";
import { getShops } from "@/actions/shops";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/layout/pagination";
import { formatCurrency, getStockStatus, truncate, getEffectiveQuantity } from "@/lib/utils";
import { ProductActions } from "@/components/inventory/product-actions";
import { FilterSelect } from "@/components/layout/filter-select";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    search?: string;
    page?: string;
    status?: string;
    category?: string;
    shop?: string;
  }>;
}

interface ProductItem {
  _id: string;
  name: string;
  productCode: string;
  shop?: { name?: string; code?: string };
  storageLocation?: string;
  category?: { name?: string };
  price: number;
  quantity: number;
  reorderLevel: number;
  status: string;
  images?: string[];
}

const STATUS_ACCENTS: Record<string, string> = {
  ACTIVE: "from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
  INACTIVE: "from-slate-500/15 to-slate-500/5 text-slate-500",
  DISCONTINUED: "from-rose-500/15 to-rose-500/5 text-rose-500",
};

export default async function InventoryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const [{ items, total, totalPages }, shops] = await Promise.all([
    getProducts({
      search: sp.search,
      status: sp.status,
      category: sp.category,
      shop: sp.shop,
      page,
      limit: 18,
    }),
    getShops(),
  ]);

  const products = items as ProductItem[];

  const stats = {
    total,
    inStock: products.filter((p) => p.quantity > p.reorderLevel).length,
    lowStock: products.filter((p) => p.quantity > 0 && p.quantity <= p.reorderLevel).length,
    outOfStock: products.filter((p) => p.quantity === 0).length,
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Inventory"
        description={`${total} products across ${shops.length} ${shops.length === 1 ? "location" : "locations"}`}
      >
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link href="/inventory/import">
            <Upload className="h-4 w-4" /> Import
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link href="/api/inventory/export?format=excel">
            <Download className="h-4 w-4" /> Export
          </Link>
        </Button>
        <Button asChild size="sm" className="shadow-lg shadow-primary/20">
          <Link href="/inventory/new">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label="Total" value={stats.total} icon={Box} accent="from-blue-500 to-cyan-500" />
        <StatTile label="In stock" value={stats.inStock} icon={TrendingUp} accent="from-emerald-500 to-teal-500" />
        <StatTile label="Low stock" value={stats.lowStock} icon={AlertTriangle} accent="from-amber-500 to-orange-500" highlight={stats.lowStock > 0} />
        <StatTile label="Out of stock" value={stats.outOfStock} icon={TrendingDown} accent="from-rose-500 to-red-500" highlight={stats.outOfStock > 0} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <SearchInput placeholder="Search by name, code, or location..." />
        <FilterSelect
          label="Shop"
          param="shop"
          value={sp.shop ?? "all"}
          options={[
            { value: "all", label: "All shops" },
            ...shops.map((s) => ({
              value: (s as { _id: string; name: string })._id,
              label: `${(s as { name: string }).name}`,
            })),
          ]}
        />
        <FilterSelect
          label="Status"
          param="status"
          value={sp.status ?? "all"}
          options={[
            { value: "all", label: "All statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "DISCONTINUED", label: "Discontinued" },
          ]}
        />
      </div>

      {products.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={Package}
            title="No products found"
            description={
              sp.search || sp.shop || sp.status
                ? "Try clearing your filters to see more results."
                : "Get started by adding your first product to the inventory."
            }
            action={
              <Button asChild>
                <Link href="/inventory/new">
                  <Plus className="h-4 w-4" /> Add Product
                </Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}

function ProductCard({ product: p }: { product: ProductItem }) {
  const qty = getEffectiveQuantity(p);
  const status = getStockStatus(qty, p.reorderLevel);
  const accent = STATUS_ACCENTS[p.status] || STATUS_ACCENTS.ACTIVE;

  return (
    <div className="group relative">
      <Link
        href={`/inventory/${p._id}`}
        className="block relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div
          className={`relative aspect-[4/3] bg-gradient-to-br ${accent} flex items-center justify-center overflow-hidden`}
        >
          {p.images && p.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.images[0]}
              alt={p.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <Package className="h-12 w-12 sm:h-14 sm:w-14 text-current opacity-50 transition-transform duration-500 group-hover:scale-110" />
          )}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
            <Badge
              variant={status.variant}
              className="text-[10px] h-5 px-1.5 shadow-sm backdrop-blur"
            >
              {status.variant === "warning" && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
              {qty} units
            </Badge>
          </div>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Badge variant="secondary" className="text-[9px] h-5 px-1.5 bg-background/90 backdrop-blur">
              Tap to view
            </Badge>
          </div>
        </div>
        <div className="p-3 sm:p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {truncate(p.name, 40)}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-mono">
                {p.productCode}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Price</p>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(p.price)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Stock</p>
              <p className="text-xs font-medium text-muted-foreground">
                {qty} units
              </p>
            </div>
          </div>

          {(p.shop?.name || p.category?.name) && (
            <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-2 text-[10px] text-muted-foreground truncate">
              {p.shop?.name && (
                <span className="inline-flex items-center gap-1 truncate">
                  <Store className="h-3 w-3 shrink-0" />
                  <span className="truncate">{p.shop.name}</span>
                </span>
              )}
              {p.shop?.name && p.category?.name && <span>·</span>}
              {p.category?.name && <span className="truncate">{p.category.name}</span>}
            </div>
          )}
        </div>
      </Link>
      <div className="absolute top-2 right-2 z-10">
        <ProductActions id={p._id} name={p.name} />
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden p-3.5 sm:p-5 transition-all ${
        highlight ? "ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/5" : ""
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl`}
      />
      <div className="flex items-center justify-between relative">
        <div>
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1 sm:mt-1.5 text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div
          className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center shadow-md`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  );
}
