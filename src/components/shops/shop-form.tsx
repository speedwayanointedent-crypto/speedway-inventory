"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, Loader2, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { shopSchema, type ShopInput } from "@/lib/validations";
import { createShop, updateShop } from "@/actions/shops";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  shop?: ShopInput & { _id?: string };
}

export function ShopForm({ shop }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopInput>({
    resolver: zodResolver(shopSchema),
    defaultValues: shop ?? {
      name: "",
      code: "",
      address: "",
      city: "",
      region: "",
      phone: "",
      email: "",
      manager: "",
      isActive: true,
      isDefault: false,
      notes: "",
    },
  });

  const onSubmit = async (data: ShopInput) => {
    setSubmitting(true);
    try {
      const res = shop?._id
        ? await updateShop(shop._id, data)
        : await createShop(data);
      if (res.success) {
        toast.success(shop?._id ? "Shop updated" : "Shop created");
        router.push("/admin/shops");
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
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Shop details</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Shop name *</Label>
              <Input id="name" placeholder="Main Branch" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="ACC-01"
                {...register("code")}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("code").onChange(e);
                }}
              />
              {errors.code && <p className="text-xs text-destructive mt-1">{errors.code.message}</p>}
              <p className="text-xs text-muted-foreground mt-1">Short unique identifier (e.g. ACC-01, KSI-02)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Location & contact</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="address">Street address</Label>
              <Input id="address" placeholder="Spintex Road" {...register("address")} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Accra" {...register("city")} />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" placeholder="Greater Accra" {...register("region")} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+233 24 000 0000" {...register("phone")} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="shop@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="manager">Manager</Label>
              <Input id="manager" placeholder="Manager name" {...register("manager")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold">Settings</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive shops will not appear in product forms</p>
              </div>
              <Switch {...register("isActive")} defaultChecked={shop?.isActive ?? true} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="cursor-pointer">Default shop</Label>
                <p className="text-xs text-muted-foreground">New products default to this shop</p>
              </div>
              <Switch {...register("isDefault")} defaultChecked={shop?.isDefault ?? false} />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {shop?._id ? "Update Shop" : "Create Shop"}
        </Button>
      </div>
    </form>
  );
}
