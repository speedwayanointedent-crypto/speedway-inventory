import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopForm } from "@/components/shops/shop-form";
import { PageHeader } from "@/components/layout/page-header";
import { getShop } from "@/actions/shops";
import type { ShopInput } from "@/lib/validations";

export const metadata: Metadata = { title: "Edit Shop" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditShopPage({ params }: Props) {
  const { id } = await params;
  const shop = (await getShop(id)) as (ShopInput & { _id: string }) | null;
  if (!shop) notFound();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={`Edit ${shop.name}`}
        description="Update the location, contact, and settings for this shop."
      />
      <ShopForm shop={shop} />
    </div>
  );
}
