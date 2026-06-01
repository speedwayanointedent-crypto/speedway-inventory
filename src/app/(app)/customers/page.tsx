import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { getCustomers } from "@/actions/customers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/layout/pagination";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomerActions } from "@/components/customers/customer-actions";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { items, total, totalPages } = await getCustomers({
    search: sp.search,
    page,
    limit: 20,
  });

  return (
    <div>
      <PageHeader title="Customers" description={`${total} customers`}>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="h-4 w-4" /> Add Customer
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput placeholder="Search by name, phone, email..." />
      </div>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add customers to track sales and build relationships."
            action={
              <Button asChild>
                <Link href="/customers/new">
                  <Plus className="h-4 w-4" /> Add Customer
                </Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as Array<{
                _id: string;
                name: string;
                phone: string;
                email?: string;
                companyName?: string;
                isWholesale?: boolean;
                totalSpending: number;
                lastPurchaseDate?: string;
              }>).map((c) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <Link href={`/customers/${c._id}`} className="flex items-center gap-2 group">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary">{c.name}</p>
                        {c.email && (
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{c.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.companyName || "—"}
                  </TableCell>
                  <TableCell>
                    {c.isWholesale ? (
                      <Badge variant="info">Wholesale</Badge>
                    ) : (
                      <Badge variant="outline">Retail</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(c.totalSpending)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <CustomerActions id={c._id} name={c.name} />
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
