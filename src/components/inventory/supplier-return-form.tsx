"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Save,
  Search,
  X,
  Building2,
  StickyNote,
  ShieldAlert,
  PackageX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  supplierReturnSchema,
  type SupplierReturnInput,
} from "@/lib/validations";
import { createSupplierReturn, updateSupplierReturn } from "@/actions/supplier-returns";
import { formatCurrency } from "@/lib/utils";
import {
  SUPPLIER_RETURN_REASON_LABELS,
  SUPPLIER_RETURN_RESOLUTION_LABELS,
  type SupplierReturnReason,
  type SupplierReturnResolution,
} from "@/lib/constants";

interface ProductOption {
  _id: string;
  name: string;
  productCode: string;
  sku: string;
  costPrice: number;
  quantity: number;
  reorderLevel: number;
}

interface SupplierOption {
  _id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
}

interface StockEntryOption {
  _id: string;
  referenceNumber: string;
  supplier?: string;
  supplierName?: string;
  totalCost: number;
  totalQuantity: number;
  entryDate: string;
}

interface Props {
  mode?: "create" | "edit";
  returnId?: string;
  defaultValues?: Partial<SupplierReturnInput>;
  products: ProductOption[];
  suppliers: SupplierOption[];
  recentEntries: StockEntryOption[];
}

type EditableLine = {
  product: string;
  quantity: number;
  unitCost: number;
  reason: SupplierReturnReason;
  restockable: boolean;
};

export function SupplierReturnForm({
  mode = "create",
  returnId,
  defaultValues,
  products,
  suppliers,
  recentEntries,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [productSearch, setProductSearch] = React.useState("");
  const [pickerOpenFor, setPickerOpenFor] = React.useState<number | null>(null);

  const productMap = React.useMemo(
    () => new Map(products.map((p) => [p._id, p])),
    [products]
  );

  const form = useForm<SupplierReturnInput>({
    resolver: zodResolver(supplierReturnSchema),
    defaultValues: {
      supplier: defaultValues?.supplier ?? "",
      originalStockEntry: defaultValues?.originalStockEntry ?? "",
      primaryReason: defaultValues?.primaryReason ?? "DEFECTIVE",
      resolution: defaultValues?.resolution ?? "PENDING",
      expectedRefundAmount: defaultValues?.expectedRefundAmount ?? 0,
      status: defaultValues?.status ?? "PENDING",
      trackingNumber: defaultValues?.trackingNumber ?? "",
      returnDate: defaultValues?.returnDate ?? new Date().toISOString().slice(0, 10),
      notes: defaultValues?.notes ?? "",
      items: defaultValues?.items ?? [
        { product: "", quantity: 1, unitCost: 0, reason: "DEFECTIVE", restockable: true },
      ],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const lineItems = watch("items") as EditableLine[];
  const supplier = watch("supplier");
  const originalEntry = watch("originalStockEntry");
  const primaryReason = watch("primaryReason");

  const totals = React.useMemo(() => {
    const valid = (lineItems || []).filter((li) => li.product && li.quantity > 0);
    const totalQuantity = valid.reduce((s, li) => s + Number(li.quantity || 0), 0);
    const totalValue = valid.reduce(
      (s, li) => s + Number(li.quantity || 0) * Number(li.unitCost || 0),
      0
    );
    return { totalItems: valid.length, totalQuantity, totalValue };
  }, [lineItems]);

  const supplierDetails = suppliers.find((s) => s._id === supplier);
  const filteredProducts = React.useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const available = products.filter((p) => p.quantity > 0);
    if (!q) return available.slice(0, 30);
    return available
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.productCode.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [productSearch, products]);

  function selectProduct(index: number, productId: string) {
    const product = productMap.get(productId);
    if (!product) return;
    const existing = lineItems[index];
    const usedIds = new Set(
      lineItems
        .map((li, i) => (i !== index ? li.product : null))
        .filter(Boolean)
    );
    if (usedIds.has(productId)) {
      toast.error(`${product.name} is already in the list`);
      return;
    }
    update(index, {
      product: productId,
      quantity: existing?.quantity && existing.quantity > 0 ? existing.quantity : 1,
      unitCost: product.costPrice,
      reason: existing?.reason ?? (primaryReason as SupplierReturnReason) ?? "DEFECTIVE",
      restockable: existing?.restockable ?? true,
    });
    setPickerOpenFor(null);
    setProductSearch("");
  }

  function addEmptyRow() {
    append({
      product: "",
      quantity: 1,
      unitCost: 0,
      reason: (primaryReason as SupplierReturnReason) ?? "DEFECTIVE",
      restockable: true,
    });
  }

  function removeRow(index: number) {
    if (fields.length === 1) {
      update(0, {
        product: "",
        quantity: 1,
        unitCost: 0,
        reason: (primaryReason as SupplierReturnReason) ?? "DEFECTIVE",
        restockable: true,
      });
      return;
    }
    remove(index);
  }

  function setAllReasons(reason: string) {
    lineItems.forEach((_, idx) => {
      setValue(`items.${idx}.reason`, reason as SupplierReturnReason);
    });
    toast.success("Reason applied to all items");
  }

  async function onSubmit(data: SupplierReturnInput) {
    setSubmitting(true);
    try {
      const res =
        mode === "edit" && returnId
          ? await updateSupplierReturn(returnId, data, { restockItems: true })
          : await createSupplierReturn(data);
      if (res.success) {
        toast.success(
          mode === "edit" ? "Supplier return updated" : "Supplier return recorded"
        );
        router.push(
          mode === "edit" && returnId
            ? `/supplier-returns/${returnId}`
            : "/supplier-returns"
        );
        router.refresh();
      } else {
        toast.error(res.error || "Failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Return Details</h2>
              <p className="text-xs text-muted-foreground">
                Where the stock is going back to and why
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Supplier *</Label>
              <Select
                value={supplier || "none"}
                onValueChange={(v) => setValue("supplier", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unspecified —</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {supplierDetails && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {supplierDetails.contactPerson} · {supplierDetails.phone}
                </p>
              )}
            </div>

            <div>
              <Label>Linked stock entry (optional)</Label>
              <Select
                value={originalEntry || "none"}
                onValueChange={(v) =>
                  setValue("originalStockEntry", v === "none" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="From a specific intake" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {recentEntries.map((e) => (
                    <SelectItem key={e._id} value={e._id}>
                      {e.referenceNumber} · {e.supplierName || "—"} ·{" "}
                      {formatCurrency(e.totalCost)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Reference to the original stock intake, if any
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Primary reason</Label>
              <Select
                value={primaryReason}
                onValueChange={(v) => {
                  setValue("primaryReason", v as SupplierReturnReason);
                  setAllReasons(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPLIER_RETURN_REASON_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Resolution expected</Label>
              <Select
                value={watch("resolution")}
                onValueChange={(v) =>
                  setValue("resolution", v as SupplierReturnResolution)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPLIER_RETURN_RESOLUTION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Return date</Label>
              <Input type="date" {...register("returnDate")} />
            </div>

            <div>
              <Label>Tracking #</Label>
              <Input
                {...register("trackingNumber")}
                placeholder="Optional courier ref"
              />
            </div>
          </div>

          <div>
            <Label>Expected refund / credit value</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("expectedRefundAmount")}
              placeholder="0.00"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Estimated value the supplier will refund or credit (GH₵)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <PackageX className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Items being returned</h2>
                <p className="text-xs text-muted-foreground">
                  {totals.totalItems} {totals.totalItems === 1 ? "product" : "products"} ·{" "}
                  {totals.totalQuantity} units · Total value{" "}
                  {formatCurrency(totals.totalValue)}
                </p>
              </div>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addEmptyRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add item
            </Button>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => {
              const li = lineItems[index];
              const product = li?.product ? productMap.get(li.product) : null;
              const maxQty = product?.quantity ?? 999999;
              const overLimit = li?.quantity > maxQty;
              return (
                <div
                  key={field.id}
                  className={`rounded-lg border bg-card p-3 ${
                    overLimit ? "ring-1 ring-rose-500/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <Label className="text-xs">Product *</Label>
                      {product ? (
                        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 h-9 mt-0.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {product.productCode} · {product.sku}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              update(index, {
                                product: "",
                                quantity: 1,
                                unitCost: 0,
                                reason: (primaryReason as SupplierReturnReason) ?? "DEFECTIVE",
                                restockable: true,
                              })
                            }
                            className="text-muted-foreground hover:text-foreground shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setPickerOpenFor(pickerOpenFor === index ? null : index)
                            }
                            className="w-full text-left rounded-md border h-9 px-3 text-sm flex items-center justify-between bg-background hover:bg-muted/40 mt-0.5"
                          >
                            <span className="text-muted-foreground">
                              Click to select product...
                            </span>
                            <Search className="h-3.5 w-3.5" />
                          </button>
                          {pickerOpenFor === index && (
                            <div className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-md border bg-popover shadow-lg">
                              <div className="sticky top-0 bg-popover p-2 border-b">
                                <Input
                                  value={productSearch}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                  placeholder="Search products..."
                                  className="h-8"
                                  autoFocus
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Only products with stock &gt; 0 are shown
                                </p>
                              </div>
                              <div className="p-1">
                                {filteredProducts.length === 0 ? (
                                  <p className="text-xs text-center text-muted-foreground py-4">
                                    No products in stock
                                  </p>
                                ) : (
                                  filteredProducts.map((p) => {
                                    return (
                                      <button
                                        key={p._id}
                                        type="button"
                                        onClick={() => selectProduct(index, p._id)}
                                        className="w-full text-left p-2 hover:bg-muted rounded-md flex items-center justify-between gap-2"
                                      >
                                        <div className="min-w-0">
                                          <p className="text-sm truncate">{p.name}</p>
                                          <p className="text-[10px] text-muted-foreground">
                                            {p.productCode} · {p.sku} · Cost{" "}
                                            {formatCurrency(p.costPrice)}
                                          </p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                          {p.quantity} in stock
                                        </span>
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="w-20 sm:w-24">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity`)}
                        className="mt-0.5"
                      />
                    </div>

                    <div className="w-28 sm:w-32">
                      <Label className="text-xs">Unit cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unitCost`)}
                        className="mt-0.5"
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Label className="text-xs">Total</Label>
                      <p className="text-sm font-medium tabular-nums h-9 flex items-center">
                        {formatCurrency(
                          Number(li?.quantity || 0) * Number(li?.unitCost || 0)
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-muted-foreground hover:text-rose-500 mt-5 shrink-0"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {product && (
                    <div className="mt-2 pt-2 border-t flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-[140px]">
                        <Label className="text-[10px] text-muted-foreground">Reason</Label>
                        <Select
                          value={li?.reason || "DEFECTIVE"}
                          onValueChange={(v) =>
                            setValue(`items.${index}.reason`, v as SupplierReturnReason)
                          }
                        >
                          <SelectTrigger className="h-8 mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SUPPLIER_RETURN_REASON_LABELS).map(
                              ([k, v]) => (
                                <SelectItem key={k} value={k}>
                                  {v}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 pt-3">
                        <Checkbox
                          id={`restock-${index}`}
                          checked={li?.restockable ?? true}
                          onCheckedChange={(c) =>
                            setValue(`items.${index}.restockable`, Boolean(c))
                          }
                        />
                        <Label
                          htmlFor={`restock-${index}`}
                          className="text-xs cursor-pointer"
                        >
                          Restockable (remove from inventory)
                        </Label>
                      </div>
                      {overLimit && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" />
                          Only {maxQty} in stock
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {errors.items && (
            <p className="text-xs text-rose-500">{errors.items.message as string}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <StickyNote className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Notes</h2>
              <p className="text-xs text-muted-foreground">Optional context</p>
            </div>
          </div>
          <Textarea
            {...register("notes")}
            placeholder="Reference supplier claim number, courier details, etc."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 sm:mx-0 bg-background/95 backdrop-blur border-t sm:border sm:rounded-lg sm:bottom-2 p-3 sm:p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs sm:text-sm">
          <p className="font-semibold">{formatCurrency(totals.totalValue)}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {totals.totalItems} {totals.totalItems === 1 ? "item" : "items"} ·{" "}
            {totals.totalQuantity} units
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || totals.totalItems === 0}>
            <Save className="h-4 w-4 mr-2" />
            {submitting
              ? "Saving..."
              : mode === "edit"
              ? "Update return"
              : "Record return"}
          </Button>
        </div>
      </div>
    </form>
  );
}
