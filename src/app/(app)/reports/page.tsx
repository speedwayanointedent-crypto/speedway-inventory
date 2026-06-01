import type { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Truck,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Reports" };

const REPORTS = [
  {
    href: "/reports/sales",
    icon: TrendingUp,
    title: "Sales Reports",
    description: "Daily, weekly, monthly, yearly sales with custom date range.",
  },
  {
    href: "/reports/inventory",
    icon: Package,
    title: "Inventory Reports",
    description: "Stock levels, low stock, out of stock, inventory value.",
  },
  {
    href: "/reports/profit",
    icon: DollarSign,
    title: "Profit & Loss",
    description: "Revenue, cost, gross profit, and margin analysis.",
  },
  {
    href: "/customers",
    icon: Users,
    title: "Customer Reports",
    description: "Top customers, purchase history, outstanding balances.",
  },
  {
    href: "/suppliers",
    icon: Truck,
    title: "Supplier Reports",
    description: "Purchase history per supplier.",
  },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate professional reports and export to PDF, Excel or CSV"
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="h-full hover:border-primary transition">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mt-3">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
