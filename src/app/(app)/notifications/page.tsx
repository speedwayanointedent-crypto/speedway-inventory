import type { Metadata } from "next";
import {
  Bell,
  AlertTriangle,
  PackageX,
  Receipt,
  RotateCcw,
  Package,
  Info,
  PackagePlus,
  Wallet,
} from "lucide-react";
import { getNotifications } from "@/actions/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { NotificationType } from "@/lib/constants";

export const metadata: Metadata = { title: "Notifications" };

const ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  LOW_STOCK: AlertTriangle,
  OUT_OF_STOCK: PackageX,
  SALE_COMPLETED: Receipt,
  RETURN_CREATED: RotateCcw,
  INVENTORY_ADDED: Package,
  STOCK_RECEIVED: PackagePlus,
  SUPPLIER_PAYMENT_DUE: Wallet,
  REORDER_ALERT: AlertTriangle,
  STILL_LOW_AFTER_INTAKE: AlertTriangle,
  SYSTEM_ALERT: Info,
};

const COLORS: Record<NotificationType, string> = {
  LOW_STOCK: "text-warning bg-warning/10",
  OUT_OF_STOCK: "text-destructive bg-destructive/10",
  SALE_COMPLETED: "text-success bg-success/10",
  RETURN_CREATED: "text-orange-500 bg-orange-500/10",
  INVENTORY_ADDED: "text-primary bg-primary/10",
  STOCK_RECEIVED: "text-emerald-600 bg-emerald-500/10",
  SUPPLIER_PAYMENT_DUE: "text-amber-600 bg-amber-500/10",
  REORDER_ALERT: "text-amber-600 bg-amber-500/10",
  STILL_LOW_AFTER_INTAKE: "text-amber-700 bg-amber-500/10",
  SYSTEM_ALERT: "text-muted-foreground bg-muted",
};

export default async function NotificationsPage() {
  const { items, unreadCount } = await getNotifications(100);
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread`}
      >
        {unreadCount > 0 && <MarkAllReadButton />}
      </PageHeader>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="System notifications will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {(items as Array<{
            _id: string;
            type: NotificationType;
            title: string;
            message: string;
            link?: string;
            isRead: boolean;
            createdAt: string;
          }>).map((n) => {
            const Icon = ICONS[n.type];
            const Wrapper = n.link ? Link : "div";
            return (
              <Wrapper
                key={n._id}
                href={n.link as string}
                className={`block ${n.link ? "cursor-pointer" : ""}`}
              >
                <Card className={n.isRead ? "" : "border-primary/40"}>
                  <CardContent className="p-4 flex gap-3 items-start">
                    <div className={`h-9 w-9 rounded-md flex items-center justify-center ${COLORS[n.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{n.title}</p>
                        {!n.isRead && (
                          <Badge variant="info" className="text-[9px] h-4 px-1.5">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(n.createdAt, true)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}
