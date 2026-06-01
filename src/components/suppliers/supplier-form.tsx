"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supplierSchema, type SupplierInput } from "@/lib/validations";
import { createSupplier, updateSupplier } from "@/actions/suppliers";

export function SupplierForm({ supplier }: { supplier?: SupplierInput & { _id?: string } }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier ?? {
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
  });

  const onSubmit = async (data: SupplierInput) => {
    setSubmitting(true);
    try {
      const res = supplier?._id
        ? await updateSupplier(supplier._id, data)
        : await createSupplier(data);
      if (res.success) {
        toast.success(supplier ? "Updated" : "Created");
        router.push("/suppliers");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Company Name *</Label>
              <Input {...register("companyName")} />
              {errors.companyName && (
                <p className="text-xs text-destructive mt-1">{errors.companyName.message}</p>
              )}
            </div>
            <div>
              <Label>Contact Person *</Label>
              <Input {...register("contactPerson")} />
              {errors.contactPerson && (
                <p className="text-xs text-destructive mt-1">{errors.contactPerson.message}</p>
              )}
            </div>
            <div>
              <Label>Phone *</Label>
              <Input {...register("phone")} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Textarea rows={2} {...register("address")} />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} {...register("notes")} />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          <Save className="h-4 w-4" /> Save
        </Button>
      </div>
    </form>
  );
}
