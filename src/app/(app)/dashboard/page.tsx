import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  AlertTriangle,
  PackageX,
  Wallet,
  ArrowUpRight,
  ShoppingBag,
  Activity as ActivityIcon,
  Plus,
  Receipt as ReceiptIcon,
  ArrowRight,
} from "lucide-react";
import { getDashboardMetrics } from "@/actions/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate, getInitials, truncate } from "@/lib/utils";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";

export const metadata: Metadata = { title: "Dashboard" };

interface StatProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  href?: string;
  accent?: string;
}

function StatCard({ title, value, change, icon: Icon, trend = "neutral", href, accent = "from-primary to-blue-600" }: StatProps) {
  const Wrapper: React.ElementType = href ? Link : "div";
  const wrapperProps = href ? { href } : {};
  return (
    <Wrapper {...(wrapperProps as { href: string })} className="block group">
      <Card className="relative overflow-hidden h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-border/60">
        <div
          className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-25`}
        />
        <CardContent className="p-4 sm:p-5 relative">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                {title}
              </p>
              <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold tracking-tight truncate">
                {value}
              </p>
              {change && (
                <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-[10px] sm:text-xs">
                  {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />}
                  {trend === "down" && <TrendingDown className="h-3 w-3 text-destructive shrink-0" />}
                  <span
                    className={
                      trend === "up"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : trend === "down"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }
                  >
                    {change}
                  </span>
                </div>
              )}
            </div>
            <div
              className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center shadow-md`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardMetrics();

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back — here's what's happening today.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button asChild variant="outline" size="sm" className="h-10 sm:h-9">
            <Link href="/inventory/new">
              <Plus className="h-4 w-4" /> New Product
            </Link>
          </Button>
          <Button asChild size="sm" className="h-10 sm:h-9 shadow-lg shadow-primary/20">
            <Link href="/pos">
              <ShoppingCart className="h-4 w-4" /> New Sale
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(data.sales.today.total)}
          change={`${data.sales.today.count} transactions`}
          icon={Wallet}
          trend="up"
          href="/sales"
          accent="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Weekly Sales"
          value={formatCurrency(data.sales.week.total)}
          change={`${data.sales.week.count} transactions`}
          icon={TrendingUp}
          trend="up"
          href="/sales"
          accent="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Monthly Sales"
          value={formatCurrency(data.sales.month.total)}
          change={`${data.sales.month.count} transactions`}
          icon={ShoppingBag}
          trend="up"
          href="/sales"
          accent="from-violet-500 to-fuchsia-500"
        />
        <StatCard
          title="Yearly Sales"
          value={formatCurrency(data.sales.year.total)}
          change={`${data.sales.year.count} transactions`}
          icon={TrendingUp}
          trend="up"
          href="/sales"
          accent="from-amber-500 to-orange-500"
        />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Products"
          value={String(data.inventory.totalProducts)}
          icon={Package}
          href="/inventory"
          accent="from-slate-500 to-zinc-500"
        />
        <StatCard
          title="Low Stock"
          value={String(data.inventory.lowStock)}
          icon={AlertTriangle}
          trend={data.inventory.lowStock > 0 ? "down" : "neutral"}
          href="/inventory?status=low-stock"
          accent="from-amber-500 to-orange-500"
        />
        <StatCard
          title="Out of Stock"
          value={String(data.inventory.outOfStock)}
          icon={PackageX}
          trend={data.inventory.outOfStock > 0 ? "down" : "neutral"}
          href="/inventory?status=out-of-stock"
          accent="from-rose-500 to-red-500"
        />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(
            (data.inventory.value as { sellingValue: number }).sellingValue || 0
          )}
          icon={Wallet}
          href="/reports/inventory"
          accent="from-indigo-500 to-blue-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Sales Trend (30 days)</CardTitle>
              <CardDescription className="text-xs">Revenue across the past month</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/reports/sales">
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <SalesTrendChart data={data.salesTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <ActivityIcon className="h-4 w-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {(data.activity as Array<{
              userName: string;
              description: string;
              module: string;
              createdAt: string;
            }>).length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No recent activity</p>
            )}
            {(data.activity as Array<{
              userName: string;
              description: string;
              module: string;
              createdAt: string;
            }>).slice(0, 6).map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm p-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-blue-600 text-primary-foreground">
                    {getInitials(a.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-2 leading-snug">{a.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {a.userName} · {formatDate(a.createdAt, true)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Top Products</CardTitle>
              <CardDescription className="text-xs">Best sellers</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/inventory">
                View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {(data.topProducts as Array<{
              _id: string;
              name: string;
              totalSold: number;
              quantity: number;
              sellingPrice: number;
            }>).length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No sales yet</p>
            )}
            {(data.topProducts as Array<{
              _id: string;
              name: string;
              totalSold: number;
              quantity: number;
              sellingPrice: number;
            }>).map((p, i) => (
              <div key={p._id} className="flex items-center justify-between gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/15 to-blue-500/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{truncate(p.name, 28)}</p>
                    <p className="text-[11px] text-muted-foreground">{p.totalSold} sold</p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {formatCurrency(p.sellingPrice)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Top Customers</CardTitle>
              <CardDescription className="text-xs">By total spending</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/customers">
                View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {(data.topCustomers as Array<{
              _id: string;
              name: string;
              totalSpending: number;
            }>).length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No customers yet</p>
            )}
            {(data.topCustomers as Array<{
              _id: string;
              name: string;
              totalSpending: number;
            }>).map((c) => (
              <div key={c._id} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                    {getInitials(c.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatCurrency(c.totalSpending)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <ReceiptIcon className="h-4 w-4" /> Recent Sales
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/sales">
                View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {(data.recentTransactions as Array<{
              _id: string;
              saleNumber: string;
              customerName: string;
              total: number;
              status: string;
              createdAt: string;
            }>).length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No sales yet</p>
            )}
            {(data.recentTransactions as Array<{
              _id: string;
              saleNumber: string;
              customerName: string;
              total: number;
              status: string;
              createdAt: string;
            }>).slice(0, 5).map((s) => (
              <Link
                key={s._id}
                href={`/sales/${s._id}`}
                className="flex items-center justify-between gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/40 active:bg-muted/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{s.customerName}</p>
                  <p className="text-[10px] text-muted-foreground">{s.saleNumber}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{formatCurrency(s.total)}</p>
                  <Badge
                    variant={s.status === "COMPLETED" ? "success" : "outline"}
                    className="text-[9px] h-4 px-1.5"
                  >
                    {s.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
