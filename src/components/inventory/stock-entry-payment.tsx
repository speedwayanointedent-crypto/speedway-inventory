"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordSupplierPayment } from "@/actions/stock";
import { STOCK_PAYMENT_METHOD_LABELS, type StockPaymentMethod } from "@/lib/constants";

interface Props {
  entryId: string;
  amountDue: number;
}

export function StockEntryPayment({ entryId, amountDue }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [amount, setAmount] = React.useState(amountDue.toFixed(2));
  const [method, setMethod] = React.useState<Exclude<StockPaymentMethod, "CREDIT">>("CASH");

  if (amountDue <= 0.01) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    if (amt > amountDue + 0.01) {
      toast.error(`Amount exceeds outstanding balance`);
      return;
    }
    setPending(true);
    try {
      const res = await recordSupplierPayment(entryId, amt, method);
      if (res.success) {
        toast.success(`Payment of ${amt.toFixed(2)} recorded`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed");
      }
    } finally {
      setPending(false);
    }
  }

  type PayableMethod = Exclude<StockPaymentMethod, "CREDIT">;

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="shadow-lg shadow-primary/20">
        <Wallet className="h-4 w-4" /> Record payment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record supplier payment</DialogTitle>
            <DialogDescription>
              Outstanding balance: <span className="font-semibold">{amountDue.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min={0.01}
                max={amountDue}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label>Payment method</Label>
              <Select
                value={method}
                onValueChange={(v) => setMethod(v as PayableMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STOCK_PAYMENT_METHOD_LABELS) as StockPaymentMethod[])
                    .filter((m) => m !== "CREDIT")
                    .map((m) => (
                      <SelectItem key={m} value={m}>
                        {STOCK_PAYMENT_METHOD_LABELS[m]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Save payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
