"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSettings } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface SettingsFormProps {
  settings: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
    taxId?: string;
    currency: string;
    currencySymbol: string;
    taxRate: number;
    receiptFooter: string;
    enableLowStockAlerts: boolean;
    enableEmailReceipts: boolean;
    enableDailyReports: boolean;
    receiptPrefix: string;
    theme: "light" | "dark" | "system";
  };
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(settings);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = (await updateSettings(form)) as { success: boolean; error?: string };
      if (res.success) {
        toast.success("Settings saved");
        router.refresh();
      } else {
        toast.error(res.error || "Save failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold">Company Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input id="taxId" value={form.taxId ?? ""} onChange={(e) => update("taxId", e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={form.logo ?? ""}
                onChange={(e) => update("logo", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold">Currency & Tax</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency Code *</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => update("currency", e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currencySymbol">Currency Symbol *</Label>
              <Input
                id="currencySymbol"
                value={form.currencySymbol}
                onChange={(e) => update("currencySymbol", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxRate">Tax Rate (%) *</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.taxRate}
                onChange={(e) => update("taxRate", Number(e.target.value))}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold">Receipts</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="receiptPrefix">Receipt Number Prefix *</Label>
              <Input
                id="receiptPrefix"
                value={form.receiptPrefix}
                onChange={(e) => update("receiptPrefix", e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
            <Textarea
              id="receiptFooter"
              rows={2}
              value={form.receiptFooter}
              onChange={(e) => update("receiptFooter", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="font-semibold">Preferences</h2>
          <ToggleRow
            label="Low stock email alerts"
            description="Send a daily summary of low/out-of-stock items."
            checked={form.enableLowStockAlerts}
            onChange={(v) => update("enableLowStockAlerts", v)}
          />
          <ToggleRow
            label="Email digital receipts"
            description="Automatically email a receipt link on every sale."
            checked={form.enableEmailReceipts}
            onChange={(v) => update("enableEmailReceipts", v)}
          />
          <ToggleRow
            label="Daily sales report email"
            description="Send a daily summary of sales to admins."
            checked={form.enableDailyReports}
            onChange={(v) => update("enableDailyReports", v)}
          />
          <div className="space-y-1.5 pt-2">
            <Label>Default theme</Label>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={form.theme === t ? "default" : "outline"}
                  onClick={() => update("theme", t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-md border">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
