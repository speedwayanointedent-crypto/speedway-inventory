import { PageHeader } from "@/components/layout/page-header";
import { StockEntryForm } from "@/components/inventory/stock-entry-form";
import { getProducts } from "@/actions/inventory";
import { getSuppliers } from "@/actions/suppliers";

export default async function NewStockEntryPage() {
  const [productsData, suppliersData] = await Promise.all([
    getProducts({ limit: 500 }),
    getSuppliers({ limit: 100 }),
  ]);
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="New Stock Entry" description="Add incoming stock to inventory" />
      <StockEntryForm
        products={productsData.items as Array<{ _id: string; name: string; productCode: string }>}
        suppliers={suppliersData.items as Array<{ _id: string; companyName: string }>}
      />
    </div>
  );
}
