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
}

function StatCard({ title, value, change, icon: Icon, trend = "neutral", href }: StatProps) {
  const Wrapper = href ? Link : "div";
  return (
    <Wrapper href={href as string} className="block">
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {title}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
              {change && (
                <div className="mt-2 flex items-center gap-1 text-xs">
                  {trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
                  {trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
                  <span
                    className={
                      trend === "up"
                        ? "text-success"
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
            <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="h-5 w-5" />
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
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back — here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/inventory/new">
              <Plus className="h-4 w-4" /> New Product
            </Link>
          </Button>
          <Button asChild>
            <Link href="/pos">
              <ShoppingCart className="h-4 w-4" /> New Sale
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(data.sales.today.total)}
          change={`${data.sales.today.count} transactions`}
          icon={Wallet}
          trend="up"
          href="/sales"
        />
        <StatCard
          title="Weekly Sales"
          value={formatCurrency(data.sales.week.total)}
          change={`${data.sales.week.count} transactions`}
          icon={TrendingUp}
          trend="up"
          href="/sales"
        />
        <StatCard
          title="Monthly Sales"
          value={formatCurrency(data.sales.month.total)}
          change={`${data.sales.month.count} transactions`}
          icon={ShoppingBag}
          trend="up"
          href="/sales"
        />
        <StatCard
          title="Yearly Sales"
          value={formatCurrency(data.sales.year.total)}
          change={`${data.sales.year.count} transactions`}
          icon={TrendingUp}
          trend="up"
          href="/sales"
        />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Products"
          value={String(data.inventory.totalProducts)}
          icon={Package}
          href="/inventory"
        />
        <StatCard
          title="Low Stock"
          value={String(data.inventory.lowStock)}
          icon={AlertTriangle}
          trend={data.inventory.lowStock > 0 ? "down" : "neutral"}
          href="/inventory?status=low-stock"
        />
        <StatCard
          title="Out of Stock"
          value={String(data.inventory.outOfStock)}
          icon={PackageX}
          trend={data.inventory.outOfStock > 0 ? "down" : "neutral"}
          href="/inventory?status=out-of-stock"
        />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(
            (data.inventory.value as { sellingValue: number }).sellingValue || 0
          )}
          icon={Wallet}
          href="/reports/inventory"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Trend (30 days)</CardTitle>
            <CardDescription>Revenue and transactions across the past month</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesTrendChart data={data.salesTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-4 w-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.activity as Array<{
              userName: string;
              description: string;
              module: string;
              createdAt: string;
            }>).length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
            {(data.activity as Array<{
              userName: string;
              description: string;
              module: string;
              createdAt: string;
            }>).slice(0, 6).map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(a.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.description}</p>
                  <p className="text-[10px] text-muted-foreground">
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best sellers</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/inventory">
                View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.topProducts as Array<{
              _id: string;
              name: string;
              totalSold: number;
              quantity: number;
              sellingPrice: number;
            }>).length === 0 && <p className="text-sm text-muted-foreground">No sales yet</p>}
            {(data.topProducts as Array<{
              _id: string;
              name: string;
              totalSold: number;
              quantity: number;
              sellingPrice: number;
            }>).map((p, i) => (
              <div key={p._id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded bg-muted text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{truncate(p.name, 28)}</p>
                    <p className="text-xs text-muted-foreground">{p.totalSold} sold</p>
                  </div>
                </div>
                <Badge variant="outline">{formatCurrency(p.sellingPrice)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>By total spending</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/customers">
                View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.topCustomers as Array<{
              _id: string;
              name: string;
              totalSpending: number;
            }>).length === 0 && <p className="text-sm text-muted-foreground">No customers yet</p>}
            {(data.topCustomers as Array<{
              _id: string;
              name: string;
              totalSpending: number;
            }>).map((c) => (
              <div key={c._id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(c.totalSpending)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ReceiptIcon className="h-4 w-4" /> Recent Sales
              </CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/sales">
                View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.recentTransactions as Array<{
              _id: string;
              saleNumber: string;
              customerName: string;
              total: number;
              status: string;
              createdAt: string;
            }>).length === 0 && <p className="text-sm text-muted-foreground">No sales yet</p>}
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
                className="flex items-center justify-between gap-3 hover:bg-accent/50 -mx-2 px-2 py-1.5 rounded"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.customerName}</p>
                  <p className="text-[10px] text-muted-foreground">{s.saleNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(s.total)}</p>
                  <Badge variant={s.status === "COMPLETED" ? "success" : "outline"} className="text-[9px]">
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
