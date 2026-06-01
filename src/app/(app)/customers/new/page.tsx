import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Add Customer" description="Create a new customer record" />
      <CustomerForm />
    </div>
  );
}
