"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  CreditCard,
  Wallet,
  Banknote,
  Smartphone,
  Receipt,
  Percent,
  CheckCircle2,
  Phone,
  Tag,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, truncate } from "@/lib/utils";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/constants";
import { searchProductsForPOS, createSale } from "@/actions/sales";

interface Product {
  _id: string;
  name: string;
  productCode: string;
  sellingPrice: number;
  wholesalePrice: number;
  costPrice: number;
  quantity: number;
  unitType: string;
}

interface CartItem {
  product: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  stock: number;
  unitType: string;
}

const PAYMENT_ICONS: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = {
  CASH: Banknote,
  MOBILE_MONEY: Smartphone,
  BANK_TRANSFER: CreditCard,
  MIXED: Wallet,
};

const PAYMENT_ACCENT: Record<PaymentMethod, string> = {
  CASH: "from-emerald-500 to-teal-500",
  MOBILE_MONEY: "from-amber-500 to-orange-500",
  BANK_TRANSFER: "from-blue-500 to-indigo-500",
  MIXED: "from-violet-500 to-fuchsia-500",
};

export function POSClient({ taxRate }: { taxRate: number }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [products, setProducts] = React.useState<Product[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [payOpen, setPayOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("CASH");
  const [amountPaid, setAmountPaid] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [discountPct, setDiscountPct] = React.useState(0);
  const [isWholesale, setIsWholesale] = React.useState(false);
  const [enableTax, setEnableTax] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchProductsForPOS(query);
        setProducts(result as Product[]);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const addToCart = (p: Product) => {
    if (p.quantity <= 0) return toast.error("Out of stock");
    setCart((prev) => {
      const existing = prev.find((i) => i.product === p._id);
      if (existing) {
        if (existing.quantity >= p.quantity) {
          toast.error("Cannot exceed stock");
          return prev;
        }
        return prev.map((i) =>
          i.product === p._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product: p._id,
          productName: p.name,
          productCode: p.productCode,
          quantity: 1,
          unitPrice: isWholesale ? p.wholesalePrice : p.sellingPrice,
          costPrice: p.costPrice,
          discount: 0,
          stock: p.quantity,
          unitType: p.unitType,
        },
      ];
    });
    searchRef.current?.focus();
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product !== id) return i;
          const nq = i.quantity + delta;
          if (nq <= 0) return null;
          if (nq > i.stock) {
            toast.error("Insufficient stock");
            return i;
          }
          return { ...i, quantity: nq };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updatePrice = (id: string, price: number) => {
    setCart((prev) =>
      prev.map((i) => (i.product === id ? { ...i, unitPrice: Math.max(0, price) } : i))
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.product !== id));

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const totalDiscount = (subtotal * discountPct) / 100;
  const afterDiscount = subtotal - totalDiscount;
  const taxAmount = enableTax ? afterDiscount * taxRate : 0;
  const total = afterDiscount + taxAmount;
  const paid = parseFloat(amountPaid) || 0;
  const change = paid - total;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const openPayment = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    setAmountPaid(total.toFixed(2));
    setCustomerName("");
    setCustomerPhone("");
    setPayOpen(true);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (paid < total) return toast.error("Insufficient payment");
    setSubmitting(true);
    try {
      const items = cart.map((i) => ({
        product: i.product,
        productName: i.productName,
        productCode: i.productCode,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        costPrice: i.costPrice,
        discount: i.discount,
        subtotal: i.unitPrice * i.quantity,
      }));
      const finalName = customerName.trim() || "Walk-in Customer";
      const res = await createSale({
        customerName: finalName,
        items,
        subtotal,
        totalDiscount,
        taxRate: enableTax ? taxRate : 0,
        tax: taxAmount,
        total,
        amountPaid: paid,
        change,
        paymentMethod,
        payments: [{ method: paymentMethod, amount: paid }],
        isWholesale,
      });
      if (res.success) {
        toast.success(`Sale ${res.saleNumber} completed`, {
          description: `${finalName} · ${formatCurrency(total)}`,
        });
        if (res.publicId) {
          window.open(`/receipt/${res.publicId}`, "_blank");
        }
        setCart([]);
        setAmountPaid("");
        setDiscountPct(0);
        setCustomerName("");
        setCustomerPhone("");
        setPayOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Sale failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-4 -m-4 sm:-m-6 p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-4 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, code, SKU or barcode..."
              className="pl-9 h-11"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border h-11">
            <Switch checked={isWholesale} onCheckedChange={setIsWholesale} id="wholesale" />
            <Label htmlFor="wholesale" className="text-xs cursor-pointer whitespace-nowrap">
              Wholesale Pricing
            </Label>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-15rem)]">
              {searching && <p className="p-6 text-sm text-muted-foreground">Searching...</p>}
              {!searching && products.length === 0 && (
                <div className="p-12 text-center">
                  <Receipt className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {query ? "No products match your search" : "Start typing to search products"}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 p-3">
                {products.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => addToCart(p)}
                    disabled={p.quantity <= 0}
                    className="text-left rounded-md border bg-card hover:bg-accent hover:border-primary transition p-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="aspect-square rounded bg-muted/40 mb-2 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Receipt className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="text-xs font-semibold leading-tight truncate" title={p.name}>
                      {truncate(p.name, 32)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {p.productCode}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(isWholesale ? p.wholesalePrice : p.sellingPrice)}
                      </span>
                      <Badge variant={p.quantity > 10 ? "outline" : "warning"} className="text-[9px]">
                        {p.quantity}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col h-[calc(100vh-7rem)] sticky top-20">
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 sm:p-4 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart
            </h2>
            {cartCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </Badge>
            )}
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {cart.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Cart is empty</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  Search and tap products to add
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {cart.map((i) => (
                  <div key={i.product} className="border rounded-md p-2 space-y-1.5 hover:border-border/80 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{i.productName}</p>
                        <p className="text-[10px] text-muted-foreground">{i.productCode}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 -mt-1"
                        onClick={() => removeItem(i.product)}
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQty(i.product, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-bold w-7 text-center">{i.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQty(i.product, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={i.unitPrice}
                        onChange={(e) => updatePrice(i.product, parseFloat(e.target.value) || 0)}
                        className="h-7 w-20 text-xs text-right"
                      />
                      <span className="text-xs font-bold w-20 text-right">
                        {formatCurrency(i.unitPrice * i.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-3 space-y-2 text-xs bg-gradient-to-br from-muted/30 to-card">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs flex items-center gap-1">
                <Percent className="h-3 w-3" /> Discount %
              </Label>
              <Input
                type="number"
                value={discountPct}
                onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)}
                className="h-7 w-16 text-xs"
                min={0}
                max={100}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs cursor-pointer flex items-center gap-2">
                <Switch id="tax" checked={enableTax} onCheckedChange={setEnableTax} />
                Apply Tax ({(taxRate * 100).toFixed(1)}%)
              </Label>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span>-{formatCurrency(totalDiscount)}</span>
            </div>
            {enableTax && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <Button
              className="w-full h-11 mt-2 shadow-lg shadow-primary/20"
              size="lg"
              disabled={cart.length === 0}
              onClick={openPayment}
            >
              <CheckCircle2 className="h-4 w-4" /> Charge {formatCurrency(total)}
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 text-primary-foreground">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              Complete sale
            </DialogTitle>
            <DialogDescription>
              Total:{" "}
              <span className="font-bold text-foreground text-base">{formatCurrency(total)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Customer (optional)
              </p>
              <div className="space-y-1.5">
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name (leave blank for walk-in)"
                    className="h-9 pl-8 text-sm"
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number (optional)"
                    className="h-9 pl-8 text-sm"
                    inputMode="tel"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Payment method
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = PAYMENT_ICONS[m];
                  const active = paymentMethod === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`relative overflow-hidden border rounded-lg p-3 text-left transition ${
                        active
                          ? "border-primary ring-2 ring-primary/30"
                          : "hover:border-foreground/30"
                      }`}
                    >
                      {active && (
                        <div
                          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${PAYMENT_ACCENT[m]} opacity-10`}
                        />
                      )}
                      <div className="relative">
                        <div
                          className={`h-7 w-7 rounded-md flex items-center justify-center mb-1.5 ${
                            active
                              ? `bg-gradient-to-br ${PAYMENT_ACCENT[m]} text-white`
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-xs font-semibold leading-tight">
                          {PAYMENT_METHOD_LABELS[m]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs">Amount paid</Label>
              <Input
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="h-12 text-lg font-bold"
              />
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000]
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                  .map((v, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmountPaid(v.toFixed(2))}
                      className="h-9 text-xs"
                    >
                      {v.toFixed(0)}
                    </Button>
                  ))}
              </div>
            </div>

            <div className="rounded-lg border bg-gradient-to-br from-muted/50 to-card p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium">{formatCurrency(paid)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1.5 mt-1.5">
                <span>Change</span>
                <span className={change < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}>
                  {formatCurrency(Math.max(0, change))}
                </span>
              </div>
            </div>

            <Button
              className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
              onClick={handleCompleteSale}
              loading={submitting}
              disabled={paid < total}
            >
              <CheckCircle2 className="h-4 w-4" /> Complete sale · {formatCurrency(total)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
