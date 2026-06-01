"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "@/actions/notifications";

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      loading={pending}
      onClick={async () => {
        setPending(true);
        await markAllNotificationsRead();
        setPending(false);
        toast.success("Marked all as read");
        router.refresh();
      }}
    >
      <Check className="h-4 w-4" /> Mark all read
    </Button>
  );
}
