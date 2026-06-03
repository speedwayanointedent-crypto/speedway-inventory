import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getInventoryReport } from "@/actions/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency, getStockStatus, getEffectiveQuantity } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventory Report" };

export default async function InventoryReportPage() {
  const { products, totals } = await getInventoryReport();
  return (
    <div>
      <PageHeader title="Inventory Report" description="Complete stock overview">
        <Button asChild variant="outline">
          <a href="/api/reports/inventory?format=excel" download>
            <Download className="h-4 w-4" /> Excel
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="/api/reports/inventory?format=pdf" download>
            <Download className="h-4 w-4" /> PDF
          </a>
        </Button>
      </PageHeader>

      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Products</p>
            <p className="text-xl font-bold mt-1">{(products as unknown[]).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Units</p>
            <p className="text-xl font-bold mt-1">{totals.totalUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(totals.totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Selling Value</p>
            <p className="text-xl font-bold mt-1 text-primary">
              {formatCurrency(totals.totalValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(products as Array<{
              _id: string;
              name: string;
              productCode: string;
              category?: { name?: string };
              quantity: number;
              quantityLeft?: number;
              quantityRight?: number;
              orientation?: string;
              reorderLevel: number;
              price: number;
            }>).map((p) => {
              const q = getEffectiveQuantity(p);
              const status = getStockStatus(q, p.reorderLevel);
              return (
                <TableRow key={p._id}>
                  <TableCell>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.productCode}</p>
                  </TableCell>
                  <TableCell className="text-sm">{p.category?.name || "—"}</TableCell>
                  <TableCell className="text-center font-semibold">{q}</TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(p.price)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(q * p.price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
