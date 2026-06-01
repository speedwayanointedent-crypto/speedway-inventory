import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Package, Download, Upload, AlertTriangle, Store } from "lucide-react";
import { getProducts } from "@/actions/inventory";
import { getShops } from "@/actions/shops";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/layout/pagination";
import { formatCurrency, getStockStatus } from "@/lib/utils";
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
      limit: 15,
    }),
    getShops(),
  ]);

  return (
    <div>
      <PageHeader title="Inventory" description={`${total} products across ${shops.length} ${shops.length === 1 ? "location" : "locations"}`}>
        <Button asChild variant="outline">
          <Link href="/inventory/import">
            <Upload className="h-4 w-4" /> Import
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/api/inventory/export?format=excel">
            <Download className="h-4 w-4" /> Export
          </Link>
        </Button>
        <Button asChild>
          <Link href="/inventory/new">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </Button>
      </PageHeader>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <SearchInput placeholder="Search by name, code, SKU, barcode, location..." />
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

      <Card className="p-0 overflow-hidden">
        {items.length === 0 ? (
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
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y">
              {(items as Array<{
                _id: string;
                name: string;
                productCode: string;
                sku: string;
                shop?: { name?: string; code?: string };
                storageLocation?: string;
                category?: { name?: string };
                sellingPrice: number;
                quantity: number;
                reorderLevel: number;
                unitType: string;
              }>).map((p) => {
                const status = getStockStatus(p.quantity, p.reorderLevel);
                return (
                  <Link
                    key={p._id}
                    href={`/inventory/${p._id}`}
                    className="block p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.productCode} · {p.sku}
                        </div>
                      </div>
                      <Badge variant={status.variant} className="shrink-0">
                        {p.quantity}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {p.shop && (
                        <span className="inline-flex items-center gap-1">
                          <Store className="h-3 w-3" /> {p.shop.name}
                        </span>
                      )}
                      {p.category?.name && <span>· {p.category.name}</span>}
                      {p.storageLocation && <span>· {p.storageLocation}</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-semibold">{formatCurrency(p.sellingPrice)}</span>
                      <span className="text-xs text-muted-foreground">
                        {status.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Selling</TableHead>
                    <TableHead className="text-right">Wholesale</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as Array<{
                    _id: string;
                    name: string;
                    productCode: string;
                    sku: string;
                    category?: { name?: string };
                    shop?: { name?: string; code?: string };
                    storageLocation?: string;
                    costPrice: number;
                    sellingPrice: number;
                    wholesalePrice: number;
                    quantity: number;
                    reorderLevel: number;
                    unitType: string;
                  }>).map((p) => {
                    const status = getStockStatus(p.quantity, p.reorderLevel);
                    return (
                      <TableRow key={p._id}>
                        <TableCell>
                          <Link
                            href={`/inventory/${p._id}`}
                            className="font-medium hover:text-primary"
                          >
                            {p.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {p.productCode} · {p.sku}
                          </p>
                        </TableCell>
                        <TableCell>
                          {p.shop ? (
                            <div className="text-sm">
                              <div className="inline-flex items-center gap-1 font-medium">
                                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                {p.shop.name}
                              </div>
                              {p.storageLocation && (
                                <div className="text-xs text-muted-foreground">
                                  {p.storageLocation}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{p.category?.name || "—"}</TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(p.costPrice)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(p.sellingPrice)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(p.wholesalePrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{p.quantity}</span>
                          <span className="text-xs text-muted-foreground ml-1">{p.unitType}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.variant === "warning" && (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ProductActions id={p._id} name={p.name} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
