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
import { searchCustomersForPOS, createCustomer } from "@/actions/customers";

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

interface Customer {
  _id: string;
  name: string;
  phone: string;
  isWholesale?: boolean;
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

export function POSClient({ taxRate }: { taxRate: number }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [products, setProducts] = React.useState<Product[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = React.useState("");
  const [customerResults, setCustomerResults] = React.useState<Customer[]>([]);
  const [customerOpen, setCustomerOpen] = React.useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("CASH");
  const [amountPaid, setAmountPaid] = React.useState("");
  const [discountPct, setDiscountPct] = React.useState(0);
  const [isWholesale, setIsWholesale] = React.useState(false);
  const [enableTax, setEnableTax] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const searchRef = React.useRef<HTMLInputElement>(null);

  const debouncedSearch = React.useRef<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchProductsForPOS(query);
        setProducts(result as Product[]);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => {
      if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    };
  }, [query]);

  React.useEffect(() => {
    (async () => {
      const r = await searchCustomersForPOS("");
      setCustomerResults(r as Customer[]);
    })();
  }, []);

  React.useEffect(() => {
    const t = setTimeout(async () => {
      const r = await searchCustomersForPOS(customerQuery);
      setCustomerResults(r as Customer[]);
    }, 200);
    return () => clearTimeout(t);
  }, [customerQuery]);

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
      const res = await createSale({
        customer: customer?._id,
        customerName: customer?.name ?? "Walk-in Customer",
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
        toast.success(`Sale completed: ${res.saleNumber}`);
        if (res.publicId) {
          window.open(`/receipt/${res.publicId}`, "_blank");
        }
        setCart([]);
        setCustomer(null);
        setAmountPaid("");
        setDiscountPct(0);
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
    <div className="grid lg:grid-cols-[1fr_400px] gap-4 -m-6 p-6 min-h-[calc(100vh-4rem)]">
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
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border">
            <Switch checked={isWholesale} onCheckedChange={setIsWholesale} />
            <Label className="text-xs cursor-pointer">Wholesale Pricing</Label>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-15rem)]">
              {searching && <p className="p-6 text-sm text-muted-foreground">Searching...</p>}
              {!searching && products.length === 0 && (
                <p className="p-12 text-center text-sm text-muted-foreground">
                  No products found. Try a different search.
                </p>
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
                    <div className="aspect-square rounded bg-muted/40 mb-2 flex items-center justify-center group-hover:bg-primary/10">
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
        <Card className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart ({cart.length})
            </h2>
          </div>

          <div className="p-3 border-b">
            {customer ? (
              <div className="flex items-center justify-between bg-primary/5 rounded p-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{customer.name}</p>
                  <p className="text-[10px] text-muted-foreground">{customer.phone}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setCustomer(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setCustomerOpen(true)}
              >
                <User className="h-3 w-3" /> Select customer
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {cart.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Cart is empty</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {cart.map((i) => (
                  <div key={i.product} className="border rounded p-2 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{i.productName}</p>
                        <p className="text-[10px] text-muted-foreground">{i.productCode}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 -mt-1"
                        onClick={() => removeItem(i.product)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQty(i.product, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-bold w-6 text-center">{i.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQty(i.product, 1)}
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

          <div className="border-t p-3 space-y-2 text-xs">
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
                <Switch checked={enableTax} onCheckedChange={setEnableTax} />
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
              className="w-full h-11 mt-2"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => {
                setAmountPaid(total.toFixed(2));
                setPayOpen(true);
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Charge {formatCurrency(total)}
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>Search or add a new customer</DialogDescription>
          </DialogHeader>
          <Input
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            placeholder="Search by name, phone..."
            autoFocus
          />
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {customerResults.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    setCustomer(c);
                    if (c.isWholesale) setIsWholesale(true);
                    setCustomerOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-accent rounded-md flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                  {c.isWholesale && <Badge variant="info">Wholesale</Badge>}
                </button>
              ))}
            </div>
          </ScrollArea>
          <Button
            variant="outline"
            onClick={() => {
              setCustomerOpen(false);
              setNewCustomerOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add new customer
          </Button>
        </DialogContent>
      </Dialog>

      <QuickAddCustomer
        open={newCustomerOpen}
        onOpenChange={setNewCustomerOpen}
        onCreate={(c) => {
          setCustomer(c);
          if (c.isWholesale) setIsWholesale(true);
          setNewCustomerOpen(false);
        }}
      />

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
            <DialogDescription>
              Total: <span className="font-bold text-foreground">{formatCurrency(total)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = PAYMENT_ICONS[m];
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`border rounded-md p-3 text-left transition ${
                      paymentMethod === m
                        ? "border-primary bg-primary/5"
                        : "hover:border-foreground/30"
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1.5" />
                    <p className="text-xs font-semibold">{PAYMENT_METHOD_LABELS[m]}</p>
                  </button>
                );
              })}
            </div>
            <div>
              <Label className="text-xs">Amount Paid</Label>
              <Input
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="h-11 text-lg font-bold"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[total, total + 10, total + 50, total + 100].map((v, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmountPaid(v.toFixed(2))}
                >
                  {v.toFixed(0)}
                </Button>
              ))}
            </div>
            <div className="bg-muted/50 rounded p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium">{formatCurrency(paid)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Change</span>
                <span className={change < 0 ? "text-destructive" : "text-success"}>
                  {formatCurrency(Math.max(0, change))}
                </span>
              </div>
            </div>
            <Button
              className="w-full h-11"
              onClick={handleCompleteSale}
              loading={submitting}
              disabled={paid < total}
            >
              Complete Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickAddCustomer({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreate: (c: Customer) => void;
}) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isWholesale, setIsWholesale] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!name || !phone) return toast.error("Name and phone required");
    setSubmitting(true);
    try {
      const res = await createCustomer({
        name,
        phone,
        isWholesale,
      });
      if (res.success && res.id) {
        toast.success("Customer added");
        onCreate({ _id: res.id, name, phone, isWholesale });
        setName("");
        setPhone("");
        setIsWholesale(false);
      } else {
        toast.error("Failed to create");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isWholesale} onCheckedChange={setIsWholesale} />
            <Label className="cursor-pointer">Wholesale customer</Label>
          </div>
          <Button className="w-full" onClick={submit} loading={submitting}>
            Add Customer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
