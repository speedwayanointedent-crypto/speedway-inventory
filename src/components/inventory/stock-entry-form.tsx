"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stockEntrySchema, type StockEntryInput } from "@/lib/validations";
import { createStockEntry } from "@/actions/stock";

interface Props {
  products: Array<{ _id: string; name: string; productCode: string }>;
  suppliers: Array<{ _id: string; companyName: string }>;
}

export function StockEntryForm({ products, suppliers }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StockEntryInput>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: {
      product: "",
      quantityAdded: 1,
      purchaseCost: 0,
      supplier: "",
      invoiceNumber: "",
      notes: "",
    },
  });

  const onSubmit = async (data: StockEntryInput) => {
    setSubmitting(true);
    try {
      const res = await createStockEntry(data);
      if (res.success) {
        toast.success("Stock added successfully");
        router.push("/stock-entries");
        router.refresh();
      } else {
        toast.error(res.error || "Failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Product *</Label>
            <Select value={watch("product")} onValueChange={(v) => setValue("product", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name} ({p.productCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product && (
              <p className="text-xs text-destructive mt-1">{errors.product.message}</p>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Quantity Added *</Label>
              <Input type="number" {...register("quantityAdded")} />
              {errors.quantityAdded && (
                <p className="text-xs text-destructive mt-1">{errors.quantityAdded.message}</p>
              )}
            </div>
            <div>
              <Label>Purchase Cost (per unit) *</Label>
              <Input type="number" step="0.01" {...register("purchaseCost")} />
              {errors.purchaseCost && (
                <p className="text-xs text-destructive mt-1">{errors.purchaseCost.message}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>Supplier</Label>
              <Select value={watch("supplier") || ""} onValueChange={(v) => setValue("supplier", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Invoice Number</Label>
              <Input {...register("invoiceNumber")} />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} {...register("notes")} />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          <Save className="h-4 w-4" /> Add Stock
        </Button>
      </div>
    </form>
  );
}
