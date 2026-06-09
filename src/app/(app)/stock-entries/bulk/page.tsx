import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/constants";
import { getShopsForSelect } from "@/actions/shops";
import { BulkStockEntryForm } from "@/components/inventory/bulk-stock-entry-form";

export default async function BulkStockEntryPage() {
  await requirePermission(PERMISSIONS.CREATE_INVENTORY);
  const [shops] = await Promise.all([
    getShopsForSelect(),
  ]);

  return (
    <BulkStockEntryForm
      shops={shops as any[]}
    />
  );
}
