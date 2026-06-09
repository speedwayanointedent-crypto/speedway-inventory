import { ProductForm } from "@/components/inventory/product-form";
import { PageHeader } from "@/components/layout/page-header";
import { getCategories } from "@/actions/admin";
import { getShops } from "@/actions/shops";
import { requireAuth } from "@/lib/session";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const user = await requireAuth();
  const [categories, shops] = await Promise.all([
    getCategories(),
    getShops(),
  ]);
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Add Product" description="Create a new inventory item" />
      <ProductForm
        categories={categories as Array<{ _id: string; name: string }>}
        shops={shops as Array<{ _id: string; name: string; code: string; city?: string }>}
        canManageShops={user.role === ROLES.ADMIN}
      />
    </div>
  );
}
