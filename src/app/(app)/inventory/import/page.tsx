"use client";

import { useState, useTransition } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

interface ParsedRow {
  name?: string;
  productCode?: string;
  sku?: string;
  category?: string;
  costPrice?: string;
  sellingPrice?: string;
  wholesalePrice?: string;
  quantity?: string;
  reorderLevel?: string;
  unitType?: string;
  brand?: string;
  vehicleCompatibility?: string;
  status?: string;
}

export default function ImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<{ row: number; reason: string }[]>([]);
  const [pending, startTransition] = useTransition();
  const [stats, setStats] = useState<{ ok: number; fail: number } | null>(null);

  function downloadTemplate() {
    const csv = [
      "name,productCode,sku,category,costPrice,sellingPrice,wholesalePrice,quantity,reorderLevel,unitType,brand,vehicleCompatibility,status",
      "Brake Pad Front,SW-100001,BRK-10001,Brakes,45,80,70,25,10,Set,SpeedMaster,Toyota Camry 2007-2017,ACTIVE",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "speedway-inventory-template.csv";
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
          if (!row.name || !row.productCode || !row.sku || !row.category) {
            errs.push({ row: i + 2, reason: "Missing required fields" });
          }
        });
        setErrors(errs);
        setRows(res.data);
        setStats(null);
      },
      error: (e) => toast.error(e.message),
    });
  }

  async function commit() {
    if (rows.length === 0) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/inventory/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Imported ${data.inserted} products`);
          setStats({ ok: data.inserted, fail: data.failed || 0 });
          setRows([]);
        } else {
          toast.error(data.error || "Import failed");
        }
      } catch {
        toast.error("Network error");
      }
    });
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="Import Inventory" description="Bulk-add products from a CSV file">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> Template
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-8 text-center border-dashed">
          <input
            id="csv"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-semibold mt-3">Upload a CSV file</p>
          <p className="text-xs text-muted-foreground mt-1">
            Required columns: name, productCode, sku, category, costPrice, sellingPrice
          </p>
          <label htmlFor="csv">
            <Button asChild className="mt-4">
              <span>
                <Upload className="h-4 w-4" /> Choose file
              </span>
            </Button>
          </label>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <p className="font-semibold text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> {errors.length} validation error
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 max-h-40 overflow-y-auto">
              {errors.slice(0, 20).map((e, i) => (
                <li key={i}>
                  Row {e.row}: {e.reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card className="mt-4 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <p className="font-semibold text-sm">{rows.length} rows ready</p>
            <Button onClick={commit} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Import {rows.length} products
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 10).map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{r.name}</TableCell>
                  <TableCell className="text-xs font-mono">{r.productCode}</TableCell>
                  <TableCell className="text-sm">{r.category}</TableCell>
                  <TableCell className="text-right text-sm">{r.costPrice}</TableCell>
                  <TableCell className="text-right text-sm">{r.sellingPrice}</TableCell>
                  <TableCell className="text-right text-sm">{r.quantity}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.status || "ACTIVE"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length > 10 && (
            <p className="p-3 text-xs text-muted-foreground text-center">...and {rows.length - 10} more</p>
          )}
        </Card>
      )}

      {stats && (
        <Card className="mt-4">
          <CardContent className="p-4 text-sm">
            <CheckCircle2 className="h-5 w-5 inline text-success mr-2" />
            {stats.ok} imported{stats.fail > 0 ? `, ${stats.fail} failed` : ""}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
