import { notFound } from "next/navigation";
import Link from "next/link";
import { Edit, History, ArrowLeft, Package } from "lucide-react";
import { getProduct } from "@/actions/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, getStockStatus, calculateProfit } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = (await getProduct(id)) as Record<string, unknown> | null;
  if (!product) notFound();

  const status = getStockStatus(product.quantity as number, product.reorderLevel as number);
  const profit = calculateProfit(product.sellingPrice as number, product.costPrice as number);
  const category = product.category as { name?: string } | undefined;
  const supplier = product.supplier as { companyName?: string } | undefined;
  const shop = product.shop as { name?: string; code?: string; city?: string; address?: string } | undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{product.name as string}</h1>
            <p className="text-xs text-muted-foreground">
              {product.productCode as string} · {product.sku as string}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/inventory/${id}/history`}>
              <History className="h-4 w-4" /> History
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/inventory/${id}/edit`}>
              <Edit className="h-4 w-4" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Category" value={category?.name || "—"} />
              <Field label="Brand" value={(product.brand as string) || "—"} />
              <Field label="Unit Type" value={product.unitType as string} />
              <Field label="Shop" value={shop ? `${shop.name}${shop.city ? ` · ${shop.city}` : ""}` : "—"} />
              <Field
                label="Storage Location"
                value={(product.storageLocation as string) || "—"}
              />
              <Field label="Supplier" value={supplier?.companyName || "—"} />
              <Field label="Barcode" value={(product.barcode as string) || "—"} />
              <Field
                label="Vehicle Compatibility"
                value={(product.vehicleCompatibility as string[])?.join(", ") || "—"}
                colSpan
              />
              {Boolean(product.description) && (
                <Field label="Description" value={String(product.description)} colSpan />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-sm font-semibold">Stock</h3>
              <div className="text-center py-2">
                <p className="text-4xl font-bold">{product.quantity as number}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {product.unitType as string} · Reorder at {product.reorderLevel as number}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-sm font-semibold">Pricing</h3>
              <div className="space-y-2 text-sm">
                <Row label="Cost Price" value={formatCurrency(product.costPrice as number)} />
                <Row label="Selling Price" value={formatCurrency(product.sellingPrice as number)} />
                <Row
                  label="Wholesale Price"
                  value={formatCurrency(product.wholesalePrice as number)}
                />
                <Separator />
                <Row
                  label="Profit"
                  value={formatCurrency(profit.profit)}
                  highlight={profit.profit > 0 ? "success" : "destructive"}
                />
                <Row label="Margin" value={`${profit.margin.toFixed(1)}%`} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-2 text-xs text-muted-foreground">
              <p>Created: {formatDate(product.createdAt as string, true)}</p>
              <p>Updated: {formatDate(product.updatedAt as string, true)}</p>
              <p>Total Sold: {product.totalSold as number}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, colSpan }: { label: string; value: string; colSpan?: boolean }) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "success" | "destructive";
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          highlight === "success"
            ? "font-semibold text-success"
            : highlight === "destructive"
              ? "font-semibold text-destructive"
              : "font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}
