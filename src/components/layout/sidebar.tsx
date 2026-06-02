"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Receipt,
  RotateCcw,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  PackagePlus,
  ClipboardList,
  Wrench,
  X,
  ShieldCheck,
  Activity,
  Store,
  Sparkles,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_CONFIG, PERMISSIONS, type Permission } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission | Permission[];
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { label: "POS", href: "/pos", icon: ShoppingCart, permission: PERMISSIONS.CREATE_SALES },
      { label: "Sales", href: "/sales", icon: Receipt },
      { label: "Returns", href: "/returns", icon: RotateCcw, permission: PERMISSIONS.PROCESS_RETURNS },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Products", href: "/inventory", icon: Package, permission: PERMISSIONS.VIEW_INVENTORY },
      { label: "Stock Intake", href: "/stock-entries", icon: PackagePlus, permission: PERMISSIONS.VIEW_INVENTORY },
      { label: "Bulk Intake", href: "/stock-entries/bulk", icon: ClipboardList, permission: PERMISSIONS.CREATE_INVENTORY },
      { label: "Supplier Returns", href: "/supplier-returns", icon: Undo2, permission: PERMISSIONS.EDIT_INVENTORY },
      { label: "Categories", href: "/categories", icon: ClipboardList, permission: PERMISSIONS.VIEW_INVENTORY },
      { label: "Bulk Import", href: "/inventory/import", icon: PackagePlus, permission: PERMISSIONS.CREATE_INVENTORY },
    ],
  },
  {
    label: "Contacts",
    items: [
      { label: "Customers", href: "/customers", icon: Users, permission: PERMISSIONS.MANAGE_CUSTOMERS },
      { label: "Suppliers", href: "/suppliers", icon: Truck, permission: PERMISSIONS.MANAGE_SUPPLIERS },
    ],
  },
  {
    label: "Analytics",
    items: [{ label: "Reports", href: "/reports", icon: BarChart3, permission: PERMISSIONS.VIEW_REPORTS }],
  },
  {
    label: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Shops & Locations", href: "/admin/shops", icon: Store, adminOnly: true },
      { label: "Users", href: "/admin/users", icon: ShieldCheck, adminOnly: true },
      { label: "Activity Logs", href: "/admin/activity", icon: Activity, adminOnly: true },
      { label: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
    ],
  },
];

interface SidebarProps {
  user: { name: string; email: string; role: string; permissions: Permission[] };
  onClose?: () => void;
}

export function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const canSeeItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return false;
    if (!item.permission) return true;
    const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
    return perms.some((p) => user.permissions.includes(p));
  };

  return (
    <aside className="flex h-full w-full flex-col bg-card border-r border-border/60">
      <div className="flex h-14 sm:h-16 items-center justify-between border-b border-border/60 px-4 sm:px-5 bg-gradient-to-br from-card to-muted/30">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <Wrench className="h-4 w-4" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">{APP_CONFIG.shortName}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Anointed Enterprise</span>
          </div>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden h-9 w-9" aria-label="Close menu">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {NAV.map((group) => {
            const items = group.items.filter(canSeeItem);
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-gradient-to-r from-primary to-blue-600 text-primary-foreground shadow-md shadow-primary/20"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                            active && "text-primary-foreground"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                        {active && (
                          <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border/60 p-3 space-y-2 bg-gradient-to-br from-muted/30 to-card">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-gradient-to-br from-primary/10 to-blue-500/5 border border-primary/10">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user.name}</p>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 mt-0.5">
              {user.role}
            </Badge>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:bg-destructive/15 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
