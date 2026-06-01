import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { getCustomer } from "@/actions/customers";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCustomer(id);
  if (!result || !result.customer) notFound();
  const customer = result.customer as {
    _id?: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    companyName?: string;
    notes?: string;
    isWholesale: boolean;
  };
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Edit Customer" description={customer.name} />
      <CustomerForm customer={{ ...customer, _id: id }} />
    </div>
  );
}
