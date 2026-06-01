import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { getSuppliers } from "@/actions/suppliers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/layout/pagination";
import { formatCurrency } from "@/lib/utils";
import { SupplierActions } from "@/components/suppliers/supplier-actions";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { items, total, totalPages } = await getSuppliers({
    search: sp.search,
    page,
    limit: 20,
  });

  return (
    <div>
      <PageHeader title="Suppliers" description={`${total} suppliers`}>
        <Button asChild>
          <Link href="/suppliers/new">
            <Plus className="h-4 w-4" /> Add Supplier
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput placeholder="Search suppliers..." />
      </div>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No suppliers"
            description="Add suppliers to track stock sources and purchase history."
            action={
              <Button asChild>
                <Link href="/suppliers/new">
                  <Plus className="h-4 w-4" /> Add Supplier
                </Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as Array<{
                _id: string;
                companyName: string;
                contactPerson: string;
                phone: string;
                email?: string;
                totalPurchases: number;
              }>).map((s) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <Link
                      href={`/suppliers/${s._id}`}
                      className="font-medium hover:text-primary"
                    >
                      {s.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{s.contactPerson}</TableCell>
                  <TableCell className="text-sm">{s.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.email || "—"}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(s.totalPurchases)}
                  </TableCell>
                  <TableCell>
                    <SupplierActions id={s._id} name={s.companyName} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
