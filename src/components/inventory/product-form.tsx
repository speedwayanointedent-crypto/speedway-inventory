"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, Store, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { productSchema, type ProductInput } from "@/lib/validations";
import { createProduct, updateProduct } from "@/actions/inventory";
import { UNIT_TYPES } from "@/lib/constants";
import { generateProductCode, generateSKU } from "@/lib/utils";

interface ShopOpt {
  _id: string;
  name: string;
  code: string;
  city?: string;
}

interface Props {
  product?: ProductInput & { _id?: string };
  categories: Array<{ _id: string; name: string }>;
  suppliers: Array<{ _id: string; companyName: string }>;
  shops: ShopOpt[];
  canManageShops?: boolean;
}

export function ProductForm({ product, categories, suppliers, shops, canManageShops }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const defaultShopId = product?.shop || shops.find((s) => s.code)?._id || "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      productCode: generateProductCode(),
      sku: "",
      barcode: "",
      category: "",
      brand: "",
      vehicleCompatibility: [],
      description: "",
      costPrice: 0,
      sellingPrice: 0,
      wholesalePrice: 0,
      quantity: 0,
      reorderLevel: 10,
      unitType: "Piece",
      supplier: "",
      images: [],
      shop: defaultShopId,
      storageLocation: "",
      status: "ACTIVE",
      ...product,
    },
  });

  const category = watch("category");
  const [vehicles, setVehicles] = React.useState<string>(
    (product?.vehicleCompatibility ?? []).join(", ")
  );

  React.useEffect(() => {
    if (!product && category && !watch("sku")) {
      const cat = categories.find((c) => c._id === category);
      if (cat) setValue("sku", generateSKU(cat.name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const onSubmit = async (data: ProductInput) => {
    setSubmitting(true);
    try {
      data.vehicleCompatibility = vehicles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = product?._id
        ? await updateProduct(product._id, data)
        : await createProduct(data);
      if (res.success) {
        toast.success(product?._id ? "Product updated" : "Product created");
        router.push("/inventory");
        router.refresh();
      } else {
        toast.error("error" in res && res.error ? res.error : "Failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold">Basic Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="productCode">Product Code *</Label>
              <Input id="productCode" {...register("productCode")} />
              {errors.productCode && (
                <p className="text-xs text-destructive mt-1">{errors.productCode.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" {...register("sku")} />
              {errors.sku && <p className="text-xs text-destructive mt-1">{errors.sku.message}</p>}
            </div>
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" {...register("barcode")} />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...register("brand")} />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive mt-1">{errors.category.message}</p>
              )}
            </div>
            <div>
              <Label>Unit Type</Label>
              <Select
                value={watch("unitType")}
                onValueChange={(v) => setValue("unitType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Vehicle Compatibility (comma separated)</Label>
              <Input
                value={vehicles}
                onChange={(e) => setVehicles(e.target.value)}
                placeholder="Toyota Corolla 2018, Honda Civic 2020..."
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...register("description")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold">Pricing & Stock</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="costPrice">Cost Price *</Label>
              <Input id="costPrice" type="number" step="0.01" {...register("costPrice")} />
              {errors.costPrice && (
                <p className="text-xs text-destructive mt-1">{errors.costPrice.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="sellingPrice">Selling Price *</Label>
              <Input id="sellingPrice" type="number" step="0.01" {...register("sellingPrice")} />
              {errors.sellingPrice && (
                <p className="text-xs text-destructive mt-1">{errors.sellingPrice.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="wholesalePrice">Wholesale Price *</Label>
              <Input id="wholesalePrice" type="number" step="0.01" {...register("wholesalePrice")} />
              {errors.wholesalePrice && (
                <p className="text-xs text-destructive mt-1">{errors.wholesalePrice.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" {...register("quantity")} />
            </div>
            <div>
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input id="reorderLevel" type="number" {...register("reorderLevel")} />
            </div>
            <div>
              <Label htmlFor="storageLocation">Storage Location</Label>
              <Input
                id="storageLocation"
                {...register("storageLocation")}
                placeholder="e.g. Aisle A · Shelf 2 · Bin 4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Shop & Supplier</h3>
            {canManageShops && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/shops/new">
                  <Plus className="h-3.5 w-3.5" /> New shop
                </Link>
              </Button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-muted-foreground" /> Shop / Location *
              </Label>
              <Select
                value={watch("shop") || ""}
                onValueChange={(v) => setValue("shop", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name} · {s.code}
                      {s.city ? ` · ${s.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.shop && (
                <p className="text-xs text-destructive mt-1">{errors.shop.message}</p>
              )}
              {shops.length === 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <Link href="/admin/shops/new" className="underline">
                    Add a shop
                  </Link>{" "}
                  to assign locations to products.
                </p>
              )}
            </div>
            <div>
              <Label>Supplier</Label>
              <Select
                value={watch("supplier") || ""}
                onValueChange={(v) => setValue("supplier", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) =>
                  setValue("status", v as "ACTIVE" | "INACTIVE" | "DISCONTINUED")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          <Save className="h-4 w-4" /> {product ? "Update Product" : "Save Product"}
        </Button>
      </div>
    </form>
  );
}
