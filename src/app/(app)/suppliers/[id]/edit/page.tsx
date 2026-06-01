import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { getSupplier } from "@/actions/suppliers";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();
  const s = supplier as {
    _id?: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
  };
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Edit Supplier" description={s.companyName} />
      <SupplierForm supplier={{ ...s, _id: id }} />
    </div>
  );
}
