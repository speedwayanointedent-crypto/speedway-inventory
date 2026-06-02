"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  approveSupplierReturn,
  completeSupplierReturn,
  cancelSupplierReturn,
} from "@/actions/supplier-returns";
import { formatCurrency } from "@/lib/utils";

interface Props {
  returnId: string;
  status: string;
  expectedRefundAmount: number;
}

export function SupplierReturnActions({ returnId, status, expectedRefundAmount }: Props) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actualRefund, setActualRefund] = useState(expectedRefundAmount.toString());
  const [resolution, setResolution] = useState<"REFUND" | "REPLACEMENT" | "CREDIT_NOTE">("REFUND");
  const [submitting, setSubmitting] = useState(false);

  async function handleApprove() {
    setSubmitting(true);
    const res = await approveSupplierReturn(returnId);
    setSubmitting(false);
    if (res.success) {
      toast.success("Return approved");
      router.refresh();
    } else {
      toast.error(res.error || "Failed");
    }
  }

  async function handleComplete() {
    setSubmitting(true);
    const res = await completeSupplierReturn(
      returnId,
      Number(actualRefund) || 0,
      resolution
    );
    setSubmitting(false);
    if (res.success) {
      toast.success("Return completed");
      setCompleteOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed");
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      toast.error("Please enter a reason");
      return;
    }
    setSubmitting(true);
    const res = await cancelSupplierReturn(returnId, cancelReason);
    setSubmitting(false);
    if (res.success) {
      toast.success("Return cancelled, stock restored");
      setCancelOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed");
    }
  }

  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED" || status === "IN_TRANSIT";
  const isClosed = status === "COMPLETED" || status === "CANCELLED" || status === "REJECTED";

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {isPending && (
          <Button onClick={handleApprove} disabled={submitting}>
            Approve return
          </Button>
        )}
        {isApproved && (
          <Button onClick={() => setCompleteOpen(true)} disabled={submitting}>
            Complete return
          </Button>
        )}
        {!isClosed && (
          <Button variant="outline" onClick={() => setCancelOpen(true)} disabled={submitting}>
            Cancel return
          </Button>
        )}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this return?</DialogTitle>
            <DialogDescription>
              Cancelling will restore stock quantities for any restockable items.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Reason for cancellation</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="e.g. Supplier agreed to keep the stock"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep return
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={submitting}>
              Cancel return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete return</DialogTitle>
            <DialogDescription>
              Mark the return as completed. If a refund or credit note was issued, enter
              the amount.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Resolution</Label>
              <Select value={resolution} onValueChange={(v) => setResolution(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REFUND">Cash refund received</SelectItem>
                  <SelectItem value="CREDIT_NOTE">Credit note issued</SelectItem>
                  <SelectItem value="REPLACEMENT">Replacement received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount {resolution === "REFUND" ? "refunded" : "credited"}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={actualRefund}
                onChange={(e) => setActualRefund(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Expected: {formatCurrency(expectedRefundAmount)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={submitting}>
              Mark complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
