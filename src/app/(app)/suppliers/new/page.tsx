import { PageHeader } from "@/components/layout/page-header";
import { SupplierForm } from "@/components/suppliers/supplier-form";

export default function NewSupplierPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Add Supplier" description="Create a new supplier" />
      <SupplierForm />
    </div>
  );
}
