import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  History,
  ArrowLeft,
  Package,
  Box,
  Tag,
  Building2,
  MapPin,
  Truck,
  Barcode,
  Car,
  TrendingUp,
  Wallet,
  CircleDollarSign,
  ShoppingBag,
  Calendar,
  Hash,
  Store,
} from "lucide-react";
import { getProduct } from "@/actions/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, getStockStatus, calculateProfit } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_GRADIENT: Record<string, string> = {
  ACTIVE: "from-emerald-500/20 via-teal-500/10 to-transparent",
  INACTIVE: "from-slate-500/15 via-slate-500/5 to-transparent",
  DISCONTINUED: "from-rose-500/15 via-rose-500/5 to-transparent",
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = (await getProduct(id)) as Record<string, unknown> | null;
  if (!product) notFound();

  const status = getStockStatus(product.quantity as number, product.reorderLevel as number);
  const profit = calculateProfit(product.sellingPrice as number, product.costPrice as number);
  const category = product.category as { name?: string } | undefined;
  const supplier = product.supplier as { companyName?: string } | undefined;
  const shop = product.shop as { name?: string; code?: string; city?: string; address?: string } | undefined;
  const images = (product.images as string[] | undefined) || [];
  const productStatus = String(product.status || "ACTIVE");
  const heroGradient = STATUS_GRADIENT[productStatus] || STATUS_GRADIENT.ACTIVE;

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/inventory" aria-label="Back to inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold truncate">{product.name as string}</h1>
              <Badge variant={status.variant} className="text-[10px] h-5 shrink-0">
                {status.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {product.productCode as string} · {product.sku as string}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href={`/inventory/${id}/history`}>
              <History className="h-4 w-4" /> <span className="hidden sm:inline">History</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="h-9 shadow-lg shadow-primary/20">
            <Link href={`/inventory/${id}/edit`}>
              <Edit className="h-4 w-4" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      <Card className="relative overflow-hidden border-border/60">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${heroGradient} pointer-events-none`}
        />
        <CardContent className="relative p-0">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="aspect-[4/3] md:aspect-auto bg-muted/20 flex items-center justify-center overflow-hidden">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[0]}
                  alt={product.name as string}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
                  <Package className="h-16 w-16 sm:h-20 sm:w-20" />
                  <p className="text-xs">No image</p>
                </div>
              )}
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Selling price
                </p>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mt-1">
                  {formatCurrency(product.sellingPrice as number)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  per {String(product.unitType || "unit").toLowerCase()}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <MiniStat
                  icon={CircleDollarSign}
                  label="Cost"
                  value={formatCurrency(product.costPrice as number)}
                />
                <MiniStat
                  icon={Tag}
                  label="Wholesale"
                  value={formatCurrency(product.wholesalePrice as number)}
                />
                <MiniStat
                  icon={TrendingUp}
                  label="Profit/unit"
                  value={formatCurrency(profit.profit)}
                  accent={profit.profit > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
                />
                <MiniStat
                  icon={TrendingUp}
                  label="Margin"
                  value={`${profit.margin.toFixed(1)}%`}
                  accent={profit.margin > 20 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Box className="h-3.5 w-3.5" /> In stock
                </div>
                <div className="text-right font-semibold">
                  {product.quantity as number} {String(product.unitType || "").toLowerCase()}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" /> Reorder at
                </div>
                <div className="text-right font-semibold">{product.reorderLevel as number}</div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <ShoppingBag className="h-3.5 w-3.5" /> Total sold
                </div>
                <div className="text-right font-semibold">{product.totalSold as number}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold">Product details</h2>
              <p className="text-xs text-muted-foreground">Specifications and metadata</p>
            </div>
            <Separator />
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {category?.name && (
                <DetailField icon={Tag} label="Category" value={category.name} />
              )}
              {Boolean(product.brand) && (
                <DetailField icon={Building2} label="Brand" value={String(product.brand)} />
              )}
              <DetailField icon={Box} label="Unit type" value={String(product.unitType)} />
              {shop && (
                <DetailField
                  icon={Store}
                  label="Shop"
                  value={`${shop.name}${shop.city ? ` · ${shop.city}` : ""}`}
                />
              )}
              {Boolean(product.storageLocation) && (
                <DetailField
                  icon={MapPin}
                  label="Storage location"
                  value={String(product.storageLocation)}
                />
              )}
              {supplier?.companyName && (
                <DetailField icon={Truck} label="Supplier" value={supplier.companyName} />
              )}
              {Boolean(product.barcode) && (
                <DetailField icon={Barcode} label="Barcode" value={String(product.barcode)} mono />
              )}
              {Array.isArray(product.vehicleCompatibility) &&
                (product.vehicleCompatibility as string[]).length > 0 && (
                  <DetailField
                    icon={Car}
                    label="Vehicle compatibility"
                    value={(product.vehicleCompatibility as string[]).join(", ")}
                  />
                )}
              {Boolean(product.description) && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {String(product.description)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Stock status</h3>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">
                  {product.quantity as number}
                </span>
                <span className="text-sm text-muted-foreground">
                  {String(product.unitType).toLowerCase()}
                </span>
              </div>
              <StockBar
                quantity={Number(product.quantity)}
                reorder={Number(product.reorderLevel)}
              />
              <p className="text-xs text-muted-foreground">
                Reorder at {product.reorderLevel as number}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-semibold">Pricing</h3>
              <div className="space-y-2 text-sm">
                <PriceRow label="Cost" value={formatCurrency(product.costPrice as number)} />
                <PriceRow
                  label="Selling"
                  value={formatCurrency(product.sellingPrice as number)}
                  highlight
                />
                <PriceRow
                  label="Wholesale"
                  value={formatCurrency(product.wholesalePrice as number)}
                />
                <Separator />
                <PriceRow
                  label="Profit / unit"
                  value={formatCurrency(profit.profit)}
                  tone={profit.profit > 0 ? "success" : "destructive"}
                />
                <PriceRow label="Margin" value={`${profit.margin.toFixed(1)}%`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Calendar className="h-3.5 w-3.5" />
                Timeline
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-foreground font-medium">
                  {formatDate(product.createdAt as string, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span className="text-foreground font-medium">
                  {formatDate(product.updatedAt as string, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <Badge
                  variant={productStatus === "ACTIVE" ? "success" : productStatus === "DISCONTINUED" ? "destructive" : "outline"}
                  className="text-[9px] h-4 px-1.5"
                >
                  {productStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className={`mt-1 font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className={`mt-1 font-bold text-base ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function PriceRow({
  label,
  value,
  highlight,
  tone,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "success" | "destructive";
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          tone === "success"
            ? "font-semibold text-emerald-600 dark:text-emerald-400"
            : tone === "destructive"
              ? "font-semibold text-destructive"
              : highlight
                ? "font-bold"
                : "font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}

function StockBar({ quantity, reorder }: { quantity: number; reorder: number }) {
  const max = Math.max(reorder * 3, quantity, 10);
  const pct = Math.min(100, Math.max(2, (quantity / max) * 100));
  const reorderPct = Math.min(100, (reorder / max) * 100);
  const healthy = quantity > reorder;
  return (
    <div className="relative h-2.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all ${
          healthy
            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
            : "bg-gradient-to-r from-amber-500 to-rose-500"
        }`}
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute inset-y-0 w-px bg-foreground/30"
        style={{ left: `${reorderPct}%` }}
        title={`Reorder level: ${reorder}`}
      />
    </div>
  );
}
