"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getLowStockNotifications } from "@/actions/stock";

export function SendLowStockAlertsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      try {
        await getLowStockNotifications();
        toast.success("Low-stock alerts created");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send alerts");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={send}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Bell className="h-4 w-4 mr-2" />
      )}
      Send alerts
    </Button>
  );
}
