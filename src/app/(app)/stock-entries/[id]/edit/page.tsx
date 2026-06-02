import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StockEntryForm } from "@/components/inventory/stock-entry-form";
import { getStockEntry, getStockEntryProducts } from "@/actions/stock";
import { getSuppliersForSelect } from "@/actions/suppliers";
import { getShops } from "@/actions/shops";
import { requireAuth } from "@/lib/session";
import { PERMISSIONS } from "@/lib/constants";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Stock Entry" };

export default async function EditStockEntryPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user.permissions.includes(PERMISSIONS.EDIT_INVENTORY)) {
    redirect("/unauthorized");
  }

  const [entry, products, suppliers, shops] = await Promise.all([
    getStockEntry(id),
    getStockEntryProducts(),
    getSuppliersForSelect(),
    getShops(),
  ]);
  if (!entry) notFound();

  const e = entry as Record<string, unknown> & {
    status: string;
    supplier?: string;
    shop?: string;
    invoiceNumber?: string;
    notes?: string;
    entryDate: string;
    paymentStatus: string;
    paymentMethod?: string;
    amountPaid: number;
    dueDate?: string;
    lineItems: Array<{
      product: string;
      quantity: number;
      unitCost: number;
    }>;
  };

  if (e.status === "CANCELLED") {
    redirect(`/stock-entries/${id}`);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={`Edit ${(entry as { referenceNumber: string }).referenceNumber}`}
        description="Adjust quantities, costs, supplier, or payment. Inventory is re-applied automatically."
      />
      <StockEntryForm
        mode="edit"
        entryId={id}
        defaultValues={{
          supplier: e.supplier ?? "",
          shop: e.shop ?? "",
          invoiceNumber: e.invoiceNumber ?? "",
          notes: e.notes ?? "",
          entryDate: new Date(e.entryDate).toISOString().slice(0, 10),
          status: (e.status as "RECEIVED" | "PENDING" | "CANCELLED") ?? "RECEIVED",
          paymentStatus: e.paymentStatus as "PAID" | "PARTIAL" | "PENDING" | "UNPAID",
          paymentMethod: e.paymentMethod as
            | "CASH"
            | "BANK_TRANSFER"
            | "MOBILE_MONEY"
            | "CHEQUE"
            | "CREDIT"
            | undefined,
          amountPaid: e.amountPaid,
          dueDate: e.dueDate ? new Date(e.dueDate).toISOString().slice(0, 10) : undefined,
          lineItems: e.lineItems.map((li) => ({
            product: li.product,
            quantity: li.quantity,
            unitCost: li.unitCost,
            updateCostPrice: false,
          })),
        }}
        products={products as Array<{
          _id: string;
          name: string;
          productCode: string;
          sku: string;
          costPrice: number;
          quantity: number;
          reorderLevel: number;
        }>}
        suppliers={suppliers as Array<{
          _id: string;
          companyName: string;
          contactPerson: string;
          phone: string;
          totalDue?: number;
        }>}
        shops={shops as Array<{ _id: string; name: string; code: string }>}
      />
    </div>
  );
}
