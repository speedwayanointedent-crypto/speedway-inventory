import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Store, MapPin, Star, Phone, Mail } from "lucide-react";
import { getShops } from "@/actions/shops";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { ShopActions } from "@/components/shops/shop-actions";

export const metadata: Metadata = { title: "Shops & Locations" };
export const dynamic = "force-dynamic";

interface Shop {
  _id: string;
  name: string;
  code: string;
  city?: string;
  region?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager?: string;
  isActive: boolean;
  isDefault: boolean;
}

export default async function ShopsPage() {
  const shops = (await getShops({ includeInactive: true })) as Shop[];
  const activeCount = shops.filter((s) => s.isActive).length;
  const cities = new Set(shops.filter((s) => s.city).map((s) => s.city));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shops & Locations"
        description="Manage every branch, warehouse, or kiosk where your products live."
      >
        <Button asChild>
          <Link href="/admin/shops/new">
            <Plus className="h-4 w-4" /> Add Shop
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Total shops" value={shops.length} icon={Store} />
        <Stat label="Active locations" value={activeCount} icon={MapPin} />
        <Stat label="Cities covered" value={cities.size} icon={MapPin} />
      </div>

      <Card className="p-0 overflow-hidden">
        {shops.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No shops yet"
            description="Create your first shop so products know where they live."
            action={
              <Button asChild>
                <Link href="/admin/shops/new">
                  <Plus className="h-4 w-4" /> Add Shop
                </Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((s) => (
                <TableRow key={s._id} className={!s.isActive ? "opacity-60" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                        <Store className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          {s.name}
                          {s.isDefault && (
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.code}</code>
                  </TableCell>
                  <TableCell>
                    {s.city || s.region ? (
                      <div className="text-sm">
                        {s.city}
                        {s.region && <span className="text-muted-foreground"> · {s.region}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs">
                      {s.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" /> {s.email}
                        </div>
                      )}
                      {!s.phone && !s.email && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{s.manager || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {s.isDefault && (
                        <Badge variant="default" className="text-[10px] w-fit">
                          Default
                        </Badge>
                      )}
                      <Badge variant={s.isActive ? "success" : "secondary"} className="text-[10px] w-fit">
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ShopActions shop={s} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
