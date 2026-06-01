import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProduct, getProductHistory } from "@/actions/inventory";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const typeVariant: Record<
  string,
  { label: string; variant: "default" | "success" | "destructive" | "warning" | "info" | "secondary" }
> = {
  STOCK_IN: { label: "Stock In", variant: "success" },
  STOCK_OUT: { label: "Stock Out", variant: "destructive" },
  SALE: { label: "Sale", variant: "info" },
  ADJUSTMENT: { label: "Adjustment", variant: "secondary" },
  DAMAGED: { label: "Damaged", variant: "destructive" },
  RETURN: { label: "Return", variant: "warning" },
};

export default async function ProductHistoryPage({ params }: Props) {
  const { id } = await params;
  const [product, history] = await Promise.all([getProduct(id), getProductHistory(id)]);
  if (!product) notFound();
  const p = product as { name: string };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/inventory/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Stock History</h1>
          <p className="text-xs text-muted-foreground">{p.name}</p>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-center">Before</TableHead>
              <TableHead className="text-center">Change</TableHead>
              <TableHead className="text-center">After</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(history as Array<{
              _id: string;
              type: string;
              userName: string;
              previousQuantity: number;
              changeQuantity: number;
              newQuantity: number;
              reason?: string;
              createdAt: string;
            }>).map((h) => {
              const t = typeVariant[h.type] ?? { label: h.type, variant: "default" as const };
              return (
                <TableRow key={h._id}>
                  <TableCell className="text-xs">{formatDate(h.createdAt, true)}</TableCell>
                  <TableCell>
                    <Badge variant={t.variant}>{t.label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{h.userName}</TableCell>
                  <TableCell className="text-center text-sm">{h.previousQuantity}</TableCell>
                  <TableCell
                    className={`text-center text-sm font-semibold ${h.changeQuantity > 0 ? "text-success" : "text-destructive"}`}
                  >
                    {h.changeQuantity > 0 ? "+" : ""}
                    {h.changeQuantity}
                  </TableCell>
                  <TableCell className="text-center text-sm font-semibold">{h.newQuantity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{h.reason || "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {(history as unknown[]).length === 0 && (
          <p className="p-12 text-center text-sm text-muted-foreground">No transactions yet</p>
        )}
      </Card>
    </div>
  );
}
