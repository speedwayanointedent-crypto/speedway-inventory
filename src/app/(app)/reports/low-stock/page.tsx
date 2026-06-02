import Link from "next/link";
import {
  AlertTriangle,
  PackageX,
  CheckCircle2,
  TrendingUp,
  Building2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { FilterSelect } from "@/components/layout/filter-select";
import { getLowStockReport } from "@/actions/stock";
import { SendLowStockAlertsButton } from "@/components/inventory/send-low-stock-alerts-button";
import { formatCurrency, getStockStatus } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string; shop?: string }>;
}

export default async function LowStockReportPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const data = await getLowStockReport({
    search: sp.search,
    category: sp.category,
    shop: sp.shop,
  });

  const list = data.items as Array<{
    _id: string;
    name: string;
    productCode: string;
    sku: string;
    quantity: number;
    reorderLevel: number;
    costPrice: number;
    sellingPrice: number;
    supplier?: { companyName: string; phone?: string };
    category?: { name: string };
  }>;

  const allProducts = data.allProducts as Array<{ category?: { name: string } }>;
  const categories = Array.from(
    new Set(
      allProducts
        .map((p) => p.category?.name)
        .filter((c): c is string => Boolean(c))
    )
  ).sort();

  const summary = data.summary;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Low Stock & Reorder Report"
        description="Products at or below reorder level — action required to avoid stockouts"
      >
        <SendLowStockAlertsButton />
        <Button asChild size="sm" className="shadow-lg shadow-amber-500/20">
          <Link href="/inventory?status=low-stock">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Open in inventory
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          className={
            summary.outOfStock > 0
              ? "ring-1 ring-rose-500/40 shadow-lg shadow-rose-500/5"
              : ""
          }
        >
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Out of Stock
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-rose-600">
                  {summary.outOfStock}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 text-white flex items-center justify-center">
                <PackageX className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Low Stock
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-amber-600">
                  {summary.lowStock}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  In Stock
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-emerald-600">
                  {summary.inStock}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Est. Reorder Cost
                </p>
                <p className="text-base sm:text-xl font-bold mt-1">
                  {formatCurrency(summary.estimatedReorderCost + summary.outOfStockReorderCost)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  To bring all to 2× reorder level
                </p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <SearchInput placeholder="Search products..." />
            </div>
            <div>
              <FilterSelect
                label="Category"
                param="category"
                value={sp.category || ""}
                options={[
                  { value: "all", label: "All categories" },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Products requiring reorder
              </CardTitle>
              <CardDescription className="text-xs">
                {list.length} {list.length === 1 ? "product" : "products"} at or below reorder level
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="/api/reports/inventory?format=excel" download>
                <Download className="h-4 w-4 mr-2" />
                Export all
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500/30 mb-3" />
              <p className="text-sm text-muted-foreground">All products are well-stocked</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Product
                      </th>
                      <th className="p-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Category
                      </th>
                      <th className="p-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                        Stock
                      </th>
                      <th className="p-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                        Reorder Level
                      </th>
                      <th className="p-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                        Need
                      </th>
                      <th className="p-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Supplier
                      </th>
                      <th className="p-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                        Reorder Cost
                      </th>
                      <th className="p-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => {
                      const status = getStockStatus(p.quantity, p.reorderLevel);
                      const need = Math.max(0, p.reorderLevel * 2 - p.quantity);
                      const cost = need * p.costPrice;
                      return (
                        <tr key={p._id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3">
                            <Link
                              href={`/inventory/${p._id}`}
                              className="font-medium hover:underline text-primary"
                            >
                              {p.name}
                            </Link>
                            <p className="text-[10px] text-muted-foreground">
                              {p.productCode} · {p.sku}
                            </p>
                          </td>
                          <td className="p-3 text-xs">
                            {p.category?.name || "—"}
                          </td>
                          <td className="p-3 text-right tabular-nums font-bold">
                            {p.quantity}
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            {p.reorderLevel}
                          </td>
                          <td className="p-3 text-right tabular-nums text-emerald-600 font-medium">
                            +{need}
                          </td>
                          <td className="p-3 text-xs">
                            {p.supplier ? (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {p.supplier.companyName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right tabular-nums font-medium">
                            {formatCurrency(cost)}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                status.variant === "destructive"
                                  ? "destructive"
                                  : status.variant === "warning"
                                  ? "warning"
                                  : "success"
                              }
                              className="text-[10px]"
                            >
                              {status.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y">
                {list.map((p) => {
                  const status = getStockStatus(p.quantity, p.reorderLevel);
                  const need = Math.max(0, p.reorderLevel * 2 - p.quantity);
                  const cost = need * p.costPrice;
                  return (
                    <Link
                      key={p._id}
                      href={`/inventory/${p._id}`}
                      className="block p-3 hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.productCode} · {p.reorderLevel} reorder
                          </p>
                          {p.supplier && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Building2 className="h-2.5 w-2.5" />
                              {p.supplier.companyName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold tabular-nums">{p.quantity}</p>
                          <Badge
                            variant={
                              status.variant === "destructive"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-[10px] mt-1"
                          >
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <span className="text-[11px] text-emerald-600 font-medium">
                          +{need} needed
                        </span>
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(cost)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
