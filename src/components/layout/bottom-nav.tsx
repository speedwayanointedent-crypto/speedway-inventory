"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/constants";
import { PERMISSIONS } from "@/lib/constants";

interface BottomItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  adminOnly?: boolean;
  matchPrefix?: string;
}

const BOTTOM_NAV: BottomItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    matchPrefix: "/dashboard",
  },
  {
    label: "Sell",
    href: "/pos",
    icon: ShoppingCart,
    permission: PERMISSIONS.CREATE_SALES,
  },
  {
    label: "Stock",
    href: "/inventory",
    icon: Package,
    permission: PERMISSIONS.VIEW_INVENTORY,
    matchPrefix: "/inventory",
  },
  {
    label: "Sales",
    href: "/sales",
    icon: Receipt,
    matchPrefix: "/sales",
  },
  {
    label: "More",
    href: "#more",
    icon: () => <Bell className="h-5 w-5" />,
  },
];

interface BottomNavProps {
  user: { role: string; permissions: Permission[] };
  onMoreClick: () => void;
}

export function BottomNav({ user, onMoreClick }: BottomNavProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const isVisible = (item: BottomItem) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.permission && !user.permissions.includes(item.permission)) return false;
    return true;
  };

  const isActive = (item: BottomItem) => {
    if (item.href === "#more") return false;
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    return pathname === item.href;
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
    >
      <ul className="grid grid-cols-5">
        {BOTTOM_NAV.filter(isVisible).map((item) => {
          const Icon = item.icon;
          if (item.href === "#more") {
            return (
              <li key="more" className="contents">
                <button
                  type="button"
                  onClick={onMoreClick}
                  className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors active:bg-muted"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          }
          const active = isActive(item);
          return (
            <li key={item.href} className="contents">
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors active:bg-muted",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-all",
                    active && "bg-primary/10"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={cn(active && "font-semibold")}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { BOTTOM_NAV };
