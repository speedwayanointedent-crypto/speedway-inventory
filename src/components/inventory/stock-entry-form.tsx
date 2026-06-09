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
  PackagePlus,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Building2,
  Wallet,
  StickyNote,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stockEntrySchema, type StockEntryInput } from "@/lib/validations";
import { createStockEntry, updateStockEntry } from "@/actions/stock";
import { formatCurrency, getStockStatus } from "@/lib/utils";
import { STOCK_PAYMENT_METHOD_LABELS, type StockPaymentMethod } from "@/lib/constants";

interface ProductOption {
  _id: string;
  name: string;
  productCode: string;
  price: number;
  orientation: "SINGLE" | "LEFT_RIGHT";
  quantity: number;
  quantityLeft: number;
  quantityRight: number;
  reorderLevel: number;
}

interface ShopOption {
  _id: string;
  name: string;
  code: string;
}

type EditableLine = {
  product: string;
  side: "SINGLE" | "LEFT" | "RIGHT";
  quantity: number;
  unitCost: number;
};

type Mode = "create" | "edit";

interface Props {
  mode?: Mode;
  entryId?: string;
  defaultValues?: Partial<StockEntryInput>;
  products: ProductOption[];
  shops: ShopOption[];
}

export function StockEntryForm({
  mode = "create",
  entryId,
  defaultValues,
  products,
  shops,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [productSearch, setProductSearch] = React.useState("");
  const [pickerOpenFor, setPickerOpenFor] = React.useState<number | null>(null);

  const productMap = React.useMemo(
    () => new Map(products.map((p) => [p._id, p])),
    [products]
  );

  const form = useForm<StockEntryInput>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: {
      shop: defaultValues?.shop ?? "",
      invoiceNumber: defaultValues?.invoiceNumber ?? "",
      notes: defaultValues?.notes ?? "",
      entryDate: defaultValues?.entryDate ?? new Date().toISOString().slice(0, 10),
      status: defaultValues?.status ?? "RECEIVED",
      paymentStatus: defaultValues?.paymentStatus ?? "UNPAID",
      paymentMethod: defaultValues?.paymentMethod,
      amountPaid: defaultValues?.amountPaid ?? 0,
      dueDate: defaultValues?.dueDate,
      lineItems:
        defaultValues?.lineItems ??
        [{ product: "", side: "SINGLE", quantity: 1, unitCost: 0 }],
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
    name: "lineItems",
  });

  const lineItems = watch("lineItems") as EditableLine[];
  const status = watch("status");
  const paymentStatus = watch("paymentStatus");
  const amountPaid = Number(watch("amountPaid") || 0);

  const totals = React.useMemo(() => {
    const valid = (lineItems || []).filter((li) => li.product && li.quantity > 0);
    const totalQuantity = valid.reduce((s, li) => s + Number(li.quantity || 0), 0);
    const totalCost = valid.reduce(
      (s, li) => s + Number(li.quantity || 0) * Number(li.unitCost || 0),
      0
    );
    return { totalItems: valid.length, totalQuantity, totalCost, amountDue: Math.max(0, totalCost - amountPaid) };
  }, [lineItems, amountPaid]);

  const filteredProducts = React.useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.productCode.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [productSearch, products]);

  function selectProduct(index: number, productId: string) {
    const product = productMap.get(productId);
    if (!product) return;
    const existing = lineItems[index];
    const usedIds = new Set(lineItems.map((li, i) => (i !== index ? li.product : null)).filter(Boolean));
    if (usedIds.has(productId)) {
      toast.error(`${product.name} is already in the list`);
      return;
    }
    const nextSide: EditableLine["side"] =
      product.orientation === "LEFT_RIGHT" ? "LEFT" : "SINGLE";

    update(index, {
      product: productId,
      side: nextSide,
      quantity: existing?.quantity && existing.quantity > 0 ? existing.quantity : 1,
      unitCost: existing?.unitCost ?? 0,
    });
    setPickerOpenFor(null);
    setProductSearch("");
  }

  function addEmptyRow() {
    append({ product: "", side: "SINGLE", quantity: 1, unitCost: 0 });
  }

  function removeRow(index: number) {
    if (fields.length === 1) {
      update(0, { product: "", side: "SINGLE", quantity: 1, unitCost: 0 });
      return;
    }
    remove(index);
  }

  async function onSubmit(data: StockEntryInput) {
    setSubmitting(true);
    try {
      const res = mode === "edit" && entryId
        ? await updateStockEntry(entryId, data)
        : await createStockEntry(data);
      if (res.success) {
        toast.success(mode === "edit" ? "Stock entry updated" : "Stock added successfully");
        router.push(mode === "edit" && entryId ? `/stock-entries/${entryId}` : "/stock-entries");
        router.refresh();
      } else {
        toast.error(res.error || "Failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card>
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Reference</h2>
              <p className="text-xs text-muted-foreground">
                Where the stock goes
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Receiving Shop</Label>
              <Select
                value={watch("shop") || "default"}
                onValueChange={(v) => setValue("shop", v === "default" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">— Default —</SelectItem>
                  {shops.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Invoice / Reference #</Label>
              <Input
                {...register("invoiceNumber")}
                placeholder="Invoice or PO number"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Entry date</Label>
              <Input type="date" {...register("entryDate")} />
              <p className="text-[11px] text-muted-foreground mt-1">
                Backdate for goods received earlier
              </p>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={status || "RECEIVED"}
                onValueChange={(v) =>
                  setValue("status", v as "RECEIVED" | "PENDING" | "CANCELLED")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIVED">Received (in stock)</SelectItem>
                  <SelectItem value="PENDING">Pending arrival</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Mark as pending if stock is in transit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <PackagePlus className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Products received</h2>
                <p className="text-xs text-muted-foreground">
                  Add every item received
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addEmptyRow}>
              <Plus className="h-4 w-4" /> Add row
            </Button>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => {
              const li = lineItems[index];
              const product = li?.product ? productMap.get(li.product) : undefined;
              const statusBadge = product
                ? getStockStatus(product.quantity + (Number(li?.quantity) || 0), product.reorderLevel)
                : null;
              const lineCost = (Number(li?.quantity) || 0) * (Number(li?.unitCost) || 0);
              return (
                <div
                  key={field.id}
                  className="rounded-xl border border-border/60 bg-card overflow-hidden"
                >
                  <div className="grid lg:grid-cols-[1.6fr_0.7fr_0.9fr_0.9fr_0.6fr_auto] gap-2 p-3 items-start">
                    <div className="relative">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Product
                      </Label>
                      <button
                        type="button"
                        onClick={() =>
                          setPickerOpenFor(pickerOpenFor === index ? null : index)
                        }
                        className="w-full mt-1 flex items-center justify-between gap-2 h-9 rounded-md border bg-background px-3 text-sm hover:bg-accent/40 transition-colors text-left"
                      >
                        {product ? (
                          <span className="truncate flex-1">
                            <span className="font-medium">{product.name}</span>{" "}
                            <span className="text-muted-foreground text-xs">
                              · {product.productCode}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Select product…</span>
                        )}
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </button>

                      {pickerOpenFor === index && (
                        <div className="absolute z-30 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-xl max-h-80 overflow-hidden flex flex-col">
                          <div className="p-2 border-b sticky top-0 bg-popover">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                autoFocus
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="Search by name, code, SKU…"
                                className="h-8 pl-7 text-xs"
                              />
                            </div>
                          </div>
                          <div className="overflow-y-auto">
                            {filteredProducts.length === 0 ? (
                              <p className="p-3 text-xs text-muted-foreground text-center">
                                No products match
                              </p>
                            ) : (
                              filteredProducts.map((p) => {
                                const used = lineItems.some(
                                  (x, i) => i !== index && x.product === p._id
                                );
                                return (
                                  <button
                                    key={p._id}
                                    type="button"
                                    disabled={used}
                                    onClick={() => selectProduct(index, p._id)}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-accent/50 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-between gap-2 border-b border-border/30 last:border-0"
                                  >
                                      <span className="min-w-0 flex-1">
                                        <span className="font-medium block truncate">
                                          {p.name}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {p.productCode} · stock{" "}
                                          {p.orientation === "LEFT_RIGHT"
                                            ? `${p.quantityLeft}L / ${p.quantityRight}R`
                                            : `${p.quantity}`}
                                        </span>
                                      </span>
                                    {used && <Badge variant="outline">Added</Badge>}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {product && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                          <span>
                            Current stock:{" "}
                            {product.orientation === "LEFT_RIGHT"
                              ? product.quantityLeft + product.quantityRight
                              : product.quantity}
                          </span>
                          {statusBadge && (
                            <Badge
                              variant={statusBadge.variant}
                              className="text-[9px] h-3.5 px-1"
                            >
                              After:{" "}
                              {product.orientation === "LEFT_RIGHT"
                                ? product.quantityLeft +
                                  product.quantityRight +
                                  (Number(li?.quantity) || 0)
                                : product.quantity + (Number(li?.quantity) || 0)}
                            </Badge>
                          )}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Quantity
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        className="mt-1 h-9"
                        {...register(`lineItems.${index}.quantity` as const)}
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Unit cost
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        className="mt-1 h-9"
                        {...register(`lineItems.${index}.unitCost` as const)}
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Line total
                      </Label>
                      <div className="mt-1 h-9 px-3 flex items-center rounded-md border bg-muted/30 text-sm font-semibold">
                        {formatCurrency(lineCost)}
                      </div>
                    </div>

                    {product?.orientation === "LEFT_RIGHT" && (
                      <div>
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Side
                        </Label>
                        <Select
                          value={li?.side ?? "LEFT"}
                          onValueChange={(v) =>
                            update(index, { ...li, side: v as any })
                          }
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEFT">Left</SelectItem>
                            <SelectItem value="RIGHT">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="pt-5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeRow(index)}
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {errors.lineItems?.[index]?.product && (
                    <p className="px-3 pb-2 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />{" "}
                      {errors.lineItems[index]?.product?.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {errors.lineItems?.root?.message && (
            <p className="text-xs text-destructive">{errors.lineItems.root.message}</p>
          )}
          {!errors.lineItems && (lineItems || []).every((li) => !li.product) && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Pick a product for at least one line
            </p>
          )}

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Items
              </p>
              <p className="font-semibold mt-0.5">{totals.totalItems}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Units
              </p>
              <p className="font-semibold mt-0.5">{totals.totalQuantity}</p>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Total cost
              </p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {formatCurrency(totals.totalCost)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Payment</h2>
              <p className="text-xs text-muted-foreground">
                Track what was paid and what&apos;s owed
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={paymentStatus || "UNPAID"}
                onValueChange={(v) =>
                  setValue("paymentStatus", v as "PAID" | "PARTIAL" | "PENDING" | "UNPAID")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PENDING">Pending (scheduled)</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="PAID">Paid in full</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment method</Label>
              <Select
                value={watch("paymentMethod") || "none"}
                onValueChange={(v) =>
                  setValue("paymentMethod", (v === "none" ? undefined : v) as StockPaymentMethod | undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {(Object.keys(STOCK_PAYMENT_METHOD_LABELS) as StockPaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {STOCK_PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount paid</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                {...register("amountPaid")}
              />
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" {...register("dueDate")} />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="font-semibold mt-0.5">{formatCurrency(totals.totalCost)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid</p>
              <p className="font-semibold mt-0.5 text-emerald-600">{formatCurrency(amountPaid)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Balance</p>
              <p
                className={`font-semibold mt-0.5 ${totals.amountDue > 0 ? "text-amber-600" : "text-emerald-600"}`}
              >
                {formatCurrency(totals.amountDue)}
              </p>
            </div>
          </div>

          <div>
            <Label>
              <StickyNote className="inline h-3 w-3 mr-1" /> Notes
            </Label>
            <Textarea rows={2} {...register("notes")} placeholder="Any extra context about this intake…" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0 bg-background/80 backdrop-blur p-3 -mx-3 sm:mx-0 sm:p-0 border-t sm:border-0 rounded-t-xl sm:rounded-none">
        <p className="text-xs text-muted-foreground hidden sm:block">
          <CheckCircle2 className="inline h-3 w-3 mr-1" />
          All actions are recorded in the activity log
        </p>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={totals.totalItems === 0}>
            <Save className="h-4 w-4" /> {mode === "edit" ? "Save changes" : "Record intake"}
          </Button>
        </div>
      </div>
    </form>
  );
}
