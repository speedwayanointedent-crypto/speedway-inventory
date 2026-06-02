"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelStockEntry } from "@/actions/stock";

interface Props {
  id: string;
  referenceNumber: string;
}

export function StockEntryCancel({ id, referenceNumber }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [reason, setReason] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 3) {
      toast.error("Please provide a reason (at least 3 characters)");
      return;
    }
    setPending(true);
    try {
      const res = await cancelStockEntry(id, reason.trim());
      if (res.success) {
        toast.success("Stock entry cancelled — inventory adjusted");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Ban className="h-4 w-4" /> Cancel entry
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel stock entry {referenceNumber}?</DialogTitle>
            <DialogDescription>
              This will reverse the stock addition for every line item and update supplier balances.
              The entry will be marked as cancelled but kept for audit.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Cancelling will subtract all quantities from inventory. If a product is out of stock,
                quantities will be clamped to zero.
              </p>
            </div>
            <div>
              <Label>Reason for cancellation *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="e.g. Wrong items delivered, supplier recall, duplicate entry…"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Keep entry
              </Button>
              <Button type="submit" variant="destructive" loading={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Cancel entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
