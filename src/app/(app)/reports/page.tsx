import type { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  TrendingUp,
  DollarSign,
  PackagePlus,
  ArrowUpRight,
  AlertTriangle,
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
    accent: "from-blue-500 to-cyan-500",
  },
  {
    href: "/reports/inventory",
    icon: Package,
    title: "Inventory Reports",
    description: "Stock levels, low stock, out of stock, inventory value.",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    href: "/reports/stock-entries",
    icon: PackagePlus,
    title: "Stock Intake",
    description: "Daily intake aggregation, by product, payment status.",
    accent: "from-violet-500 to-fuchsia-500",
    badge: "New",
  },
  {
    href: "/reports/profit",
    icon: DollarSign,
    title: "Profit & Loss",
    description: "Revenue, cost, gross profit, and margin analysis.",
    accent: "from-pink-500 to-rose-500",
  },
  {
    href: "/reports/low-stock",
    icon: AlertTriangle,
    title: "Low Stock & Reorder",
    description: "Products below reorder point, reorder quantities.",
    accent: "from-amber-500 to-red-500",
    badge: "New",
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
            <Card className="h-full hover:border-primary hover:shadow-lg hover:-translate-y-0.5 transition-all relative overflow-hidden">
              <div
                className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${r.accent} opacity-10 blur-2xl`}
              />
              <CardContent className="p-5 relative">
                <div className="flex items-start justify-between">
                  <div
                    className={`h-10 w-10 rounded-md bg-gradient-to-br ${r.accent} text-white flex items-center justify-center shadow-md`}
                  >
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    {"badge" in r && r.badge && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                        {r.badge}
                      </span>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
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
