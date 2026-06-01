"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { refundSale, cancelSale } from "@/actions/sales";

export function SaleActions({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState<"refund" | "cancel" | null>(null);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const handleRefund = async () => {
    if (!reason) return toast.error("Reason required");
    setPending(true);
    try {
      const res = await refundSale(id, reason);
      if (res.success) {
        toast.success("Sale refunded");
        setOpen(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed");
      }
    } finally {
      setPending(false);
    }
  };

  const handleCancel = async () => {
    setPending(true);
    try {
      const res = await cancelSale(id);
      if (res.success) {
        toast.success("Sale cancelled");
        setOpen(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="destructive">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpen("refund")}>
            <RotateCcw className="h-4 w-4" /> Refund Sale
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("cancel")}>
            <Ban className="h-4 w-4" /> Cancel Sale
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open === "refund"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Sale</DialogTitle>
            <DialogDescription>
              This will restore inventory and mark the sale as refunded. Provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Customer returned item, defective product..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRefund} loading={pending}>
              Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "cancel"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Sale</DialogTitle>
            <DialogDescription>
              Mark this sale as cancelled and restore inventory. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>
              Back
            </Button>
            <Button variant="destructive" onClick={handleCancel} loading={pending}>
              Cancel Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
