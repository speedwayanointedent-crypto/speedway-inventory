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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_CONFIG, PERMISSIONS, type Permission } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      { label: "Stock Entry", href: "/stock-entries", icon: PackagePlus, permission: PERMISSIONS.CREATE_INVENTORY },
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
    <aside className="flex h-full w-full flex-col bg-card border-r">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
            <Wrench className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">{APP_CONFIG.shortName}</span>
            <span className="text-[10px] text-muted-foreground">Wholesale POS</span>
          </div>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
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
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
