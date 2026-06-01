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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { customerSchema, type CustomerInput } from "@/lib/validations";
import { createCustomer, updateCustomer } from "@/actions/customers";

interface Props {
  customer?: CustomerInput & { _id?: string };
}

export function CustomerForm({ customer }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ?? {
      name: "",
      phone: "",
      email: "",
      address: "",
      companyName: "",
      notes: "",
      isWholesale: false,
    },
  });

  const onSubmit = async (data: CustomerInput) => {
    setSubmitting(true);
    try {
      const res = customer?._id
        ? await updateCustomer(customer._id, data)
        : await createCustomer(data);
      if (res.success) {
        toast.success(customer ? "Customer updated" : "Customer created");
        router.push("/customers");
        router.refresh();
      }
    } catch {
      toast.error("Failed");
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
              <Label>Name *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Phone *</Label>
              <Input {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
            </div>
            <div>
              <Label>Company</Label>
              <Input {...register("companyName")} />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Textarea rows={2} {...register("address")} />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} {...register("notes")} />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <Switch
                checked={watch("isWholesale")}
                onCheckedChange={(v) => setValue("isWholesale", v)}
              />
              <Label className="cursor-pointer">Wholesale customer</Label>
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
