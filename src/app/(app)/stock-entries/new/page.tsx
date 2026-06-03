import { PageHeader } from "@/components/layout/page-header";
import { StockEntryForm } from "@/components/inventory/stock-entry-form";
import { getStockEntryProducts } from "@/actions/stock";
import { getSuppliersForSelect } from "@/actions/suppliers";
import { getShops } from "@/actions/shops";

export const metadata = { title: "New Stock Intake" };

export default async function NewStockEntryPage() {
  const [products, suppliers, shops] = await Promise.all([
    getStockEntryProducts(),
    getSuppliersForSelect(),
    getShops(),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Record Stock Intake"
        description="Add incoming stock from suppliers with multi-product support, payment tracking, and full audit trail"
      />
      <StockEntryForm
        mode="create"
        products={products as Array<{
          _id: string;
          name: string;
          productCode: string;
          price: number;
          orientation: "SINGLE" | "LEFT_RIGHT";
          quantity: number;
          quantityLeft: number;
          quantityRight: number;
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
