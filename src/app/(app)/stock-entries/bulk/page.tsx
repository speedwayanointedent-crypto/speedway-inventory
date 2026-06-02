import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/constants";
import { getSuppliersForSelect } from "@/actions/suppliers";
import { getShopsForSelect } from "@/actions/shops";
import { BulkStockEntryForm } from "@/components/inventory/bulk-stock-entry-form";

export default async function BulkStockEntryPage() {
  await requirePermission(PERMISSIONS.CREATE_INVENTORY);
  const [suppliers, shops] = await Promise.all([
    getSuppliersForSelect(),
    getShopsForSelect(),
  ]);

  return (
    <BulkStockEntryForm
      suppliers={suppliers as any[]}
      shops={shops as any[]}
    />
  );
}
