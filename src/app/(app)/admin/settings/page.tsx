import type { Metadata } from "next";
import { Settings as SettingsIcon } from "lucide-react";
import { getSettings } from "@/actions/admin";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = (await getSettings()) as Record<string, unknown>;
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="System Settings"
        description="Configure company, currency, tax, receipts, and notifications"
        icon={SettingsIcon}
      />
      <SettingsForm
        settings={{
          companyName: (settings.companyName as string) || "",
          address: (settings.address as string) || "",
          phone: (settings.phone as string) || "",
          email: (settings.email as string) || "",
          logo: settings.logo as string | undefined,
          taxId: settings.taxId as string | undefined,
          currency: (settings.currency as string) || "GHS",
          currencySymbol: (settings.currencySymbol as string) || "GH₵",
          taxRate: (settings.taxRate as number) ?? 12.5,
          receiptFooter: (settings.receiptFooter as string) || "",
          enableLowStockAlerts: (settings.enableLowStockAlerts as boolean) ?? true,
          enableEmailReceipts: (settings.enableEmailReceipts as boolean) ?? true,
          enableDailyReports: (settings.enableDailyReports as boolean) ?? false,
          receiptPrefix: (settings.receiptPrefix as string) || "SW",
          theme: ((settings.theme as "light" | "dark" | "system") || "system"),
        }}
      />
    </div>
  );
}
