import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/constants";
import { getStockEntryProducts } from "@/actions/stock";
import { getSuppliersForSelect } from "@/actions/suppliers";
import { getReturnableStockEntries } from "@/actions/supplier-returns";
import { SupplierReturnForm } from "@/components/inventory/supplier-return-form";
import { PageHeader } from "@/components/layout/page-header";

export default async function NewSupplierReturnPage() {
  await requirePermission(PERMISSIONS.EDIT_INVENTORY);
  const [products, suppliers, recentEntries] = await Promise.all([
    getStockEntryProducts(),
    getSuppliersForSelect(),
    getReturnableStockEntries(),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="New Supplier Return"
        description="Send defective, overstocked, or wrong items back to a supplier"
      />
      <SupplierReturnForm
        mode="create"
        products={products as any[]}
        suppliers={suppliers as any[]}
        recentEntries={recentEntries as any[]}
      />
    </div>
  );
}
