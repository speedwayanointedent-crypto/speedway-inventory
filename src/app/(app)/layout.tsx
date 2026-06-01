import { requireAuth } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { getNotifications } from "@/actions/notifications";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const { unreadCount } = await getNotifications(0).catch(() => ({ unreadCount: 0 }));
  return (
    <AppShell user={user} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
