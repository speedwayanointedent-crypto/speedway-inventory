import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { getCustomer } from "@/actions/customers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCustomer(id);
  if (!result || !result.customer) notFound();
  const c = result.customer as {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    companyName?: string;
    isWholesale: boolean;
    totalSpending: number;
    outstandingBalance: number;
    lastPurchaseDate?: string;
  };
  const sales = result.sales as Array<{
    _id: string;
    saleNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }>;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{c.name}</h1>
            <p className="text-xs text-muted-foreground">{c.phone}</p>
          </div>
          {c.isWholesale && <Badge variant="info">Wholesale</Badge>}
        </div>
        <Button asChild>
          <Link href={`/customers/${id}/edit`}>
            <Edit className="h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(c.totalSpending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(c.outstandingBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Last Purchase</p>
            <p className="text-sm font-semibold mt-1">
              {c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold mt-1">{sales.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2 text-sm">
          <h3 className="text-sm font-semibold mb-2">Contact</h3>
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span>{c.phone}</span>
          </div>
          {c.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span>{c.email}</span>
            </div>
          )}
          {c.companyName && (
            <div className="flex items-center gap-2">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span>{c.companyName}</span>
            </div>
          )}
          {c.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{c.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold">Recent Purchases</h3>
          </div>
          {sales.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No purchases yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>
                      <Link href={`/sales/${s._id}`} className="text-sm font-mono hover:text-primary">
                        {s.saleNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(s.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(s.createdAt, true)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
