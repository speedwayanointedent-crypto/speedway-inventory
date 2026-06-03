"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { bulkCreateStockEntry } from "@/actions/stock";
import { formatCurrency } from "@/lib/utils";
import {
  STOCK_PAYMENT_METHOD_LABELS,
  type StockPaymentMethod,
} from "@/lib/constants";

interface ParsedRow {
  productCode?: string;
  quantity?: string;
  unitCost?: string;
}

interface SupplierOption {
  _id: string;
  companyName: string;
}

interface ShopOption {
  _id: string;
  name: string;
  code: string;
}

interface Props {
  suppliers: SupplierOption[];
  shops: ShopOption[];
}

export function BulkStockEntryForm({ suppliers, shops }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<{ row: number; reason: string }[]>([]);
  const [pending, startTransition] = useTransition();
  const [stats, setStats] = useState<{ ok: number; ref: string; id: string } | null>(null);
  const [supplier, setSupplier] = useState("");
  const [shop, setShop] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<StockPaymentMethod>("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const csv = [
      "productCode,quantity,unitCost",
      "SW-100001,25,45",
      "SW-100002,10,32",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "speedway-bulk-stock-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(file: File) {
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const errs: { row: number; reason: string }[] = [];
        res.data.forEach((row, i) => {
          if (!row.productCode) {
            errs.push({ row: i + 2, reason: "Missing product code" });
            return;
          }
          const qty = Number(row.quantity);
          if (!Number.isFinite(qty) || qty <= 0) {
            errs.push({ row: i + 2, reason: "Quantity must be > 0" });
          }
          const cost = Number(row.unitCost);
          if (!Number.isFinite(cost) || cost < 0) {
            errs.push({ row: i + 2, reason: "Unit cost must be ≥ 0" });
          }
        });
        setErrors(errs);
        setRows(res.data);
        setStats(null);
      },
      error: (e) => toast.error(e.message),
    });
  }

  const totals = rows.reduce(
    (acc, r) => {
      const qty = Number(r.quantity) || 0;
      const cost = Number(r.unitCost) || 0;
      acc.quantity += qty;
      acc.cost += qty * cost;
      return acc;
    },
    { quantity: 0, cost: 0 }
  );

  async function commit() {
    if (rows.length === 0) {
      toast.error("Please upload a CSV first");
      return;
    }
    if (errors.length > 0) {
      toast.error("Fix validation errors before submitting");
      return;
    }
    startTransition(async () => {
      try {
        const res = await bulkCreateStockEntry({
          supplier: supplier || undefined,
          shop: shop || undefined,
          invoiceNumber: invoiceNumber || undefined,
          entryDate,
          paymentMethod,
          amountPaid: Number(amountPaid) || 0,
          notes: notes || undefined,
          rows: rows.map((r) => ({
            productCode: r.productCode,
            quantity: Number(r.quantity),
            unitCost: Number(r.unitCost),
          })),
        });
        if (res.success) {
          toast.success(
            `Imported ${res.inserted} products as ${res.referenceNumber}`
          );
          setStats({ ok: res.inserted || 0, ref: res.referenceNumber || "", id: res.entryId || "" });
          setRows([]);
        } else {
          toast.error(res.error || "Import failed");
        }
      } catch {
        toast.error("Network error");
      }
    });
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" className="h-7 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title="Bulk Stock Intake"
        description="Record stock for many products in one intake via CSV upload"
      >
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Template
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label>Supplier</Label>
              <Select value={supplier || "none"} onValueChange={(v) => setSupplier(v === "none" ? "" : v)}>
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
            </div>
            <div>
              <Label>Shop</Label>
              <Select value={shop || "default"} onValueChange={(v) => setShop(v === "default" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Default shop" />
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
              <Label>Entry date</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div>
              <Label>Invoice / Reference #</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Supplier invoice or PO"
              />
            </div>
            <div>
              <Label>Payment method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as StockPaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STOCK_PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount paid now</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 sm:p-8 text-center border-dashed">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-semibold mt-3">Upload a CSV file</p>
          <p className="text-xs text-muted-foreground mt-1">
            Required columns: <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">productCode</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">quantity</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">unitCost</code>
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Choose file
            </Button>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download template
            </Button>
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Card className="border-rose-200">
          <CardContent className="p-4">
            <p className="font-semibold text-sm flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-4 w-4" /> {errors.length} validation error
              {errors.length === 1 ? "" : "s"}
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 max-h-40 overflow-y-auto">
              {errors.slice(0, 20).map((e, i) => (
                <li key={i}>
                  Row {e.row}: {e.reason}
                </li>
              ))}
            </ul>
            {errors.length > 20 && (
              <p className="text-[11px] text-muted-foreground mt-2">
                ...and {errors.length - 20} more
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-semibold text-sm">{rows.length} rows ready</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {totals.quantity} units · {formatCurrency(totals.cost)} total value
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRows([]);
                  setErrors([]);
                }}
                disabled={pending}
              >
                Clear
              </Button>
              <Button
                onClick={commit}
                disabled={pending || errors.length > 0}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Import {rows.length} products
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 25).map((r, i) => {
                  const qty = Number(r.quantity) || 0;
                  const cost = Number(r.unitCost) || 0;
                  return (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono">
                        {r.productCode || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{qty}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(cost)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(qty * cost)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {rows.length > 25 && (
            <p className="p-3 text-xs text-muted-foreground text-center">
              ...and {rows.length - 25} more rows
            </p>
          )}
        </Card>
      )}

      {stats && (
        <Card>
          <CardContent className="p-4 text-sm flex items-center gap-2 flex-wrap">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p>
              <strong>{stats.ok}</strong> products imported as{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded">{stats.ref}</code>
            </p>
            <div className="ml-auto flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/stock-entries/${stats.id}`}>View intake</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/stock-entries">All intakes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
