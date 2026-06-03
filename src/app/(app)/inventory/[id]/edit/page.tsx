import { notFound } from "next/navigation";
import { ProductForm } from "@/components/inventory/product-form";
import { PageHeader } from "@/components/layout/page-header";
import { getProduct } from "@/actions/inventory";
import { getCategories } from "@/actions/admin";
import { getSuppliers } from "@/actions/suppliers";
import { getShops } from "@/actions/shops";
import { requireAuth } from "@/lib/session";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth();
  const [product, categories, suppliersData, shops] = await Promise.all([
    getProduct(id),
    getCategories(),
    getSuppliers({ limit: 100 }),
    getShops(),
  ]);
  if (!product) notFound();

  const p = product as {
    _id: string;
    name: string;
    productCode: string;
    category: { _id: string } | string;
    brand?: string;
    vehicleCompatibility: string[];
    description?: string;
    price: number;
    orientation: "SINGLE" | "LEFT_RIGHT";
    quantity: number;
    quantityLeft: number;
    quantityRight: number;
    reorderLevel: number;
    supplier?: { _id: string } | string | null;
    shop: { _id: string } | string;
    storageLocation?: string;
    status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
    images?: string[];
  };
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Edit Product" description={p.name || ""} />
      <ProductForm
        product={{
          ...p,
          _id: p._id,
          images: p.images ?? [],
          category: typeof p.category === "object" ? p.category._id : p.category,
          supplier: p.supplier
            ? typeof p.supplier === "object"
              ? p.supplier._id
              : p.supplier
            : undefined,
          shop: p.shop
            ? typeof p.shop === "object"
              ? p.shop._id
              : p.shop
            : "",
        }}
        categories={categories as Array<{ _id: string; name: string }>}
        suppliers={suppliersData.items as Array<{ _id: string; companyName: string }>}
        shops={shops as Array<{ _id: string; name: string; code: string; city?: string }>}
        canManageShops={user.role === ROLES.ADMIN}
      />
    </div>
  );
}
