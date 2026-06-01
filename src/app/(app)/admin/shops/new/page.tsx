import type { Metadata } from "next";
import { ShopForm } from "@/components/shops/shop-form";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "New Shop" };
export const dynamic = "force-dynamic";

export default function NewShopPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Add a shop"
        description="Track every branch or warehouse where your products are stored."
      />
      <ShopForm />
    </div>
  );
}
